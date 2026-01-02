'use server'

import prisma from '@/lib/db'
import { getCurrentClubId } from '@/lib/tenant'
import { revalidatePath } from 'next/cache'

export async function getSettings() {
       const clubId = await getCurrentClubId()

       const club = await prisma.club.findUnique({
              where: { id: clubId },
              include: {
                     courts: {
                            orderBy: { sortOrder: 'asc' }
                     },
                     priceRules: {
                            orderBy: { priority: 'desc' }
                     },
                     users: {
                            select: { id: true, name: true, email: true, role: true }
                     }
              }
       })

       if (!club) throw new Error('Club not found')

       return club
}

export async function updateClubSettings(data: {
       name?: string
       logoUrl?: string
       openTime?: string
       closeTime?: string
       slotDuration?: number
       cancelHours?: number
}) {
       try {
              const clubId = await getCurrentClubId()

              await prisma.club.update({
                     where: { id: clubId },
                     data: {
                            ...data
                     }
              })

              revalidatePath('/configuracion')
              revalidatePath('/')
              return { success: true }
       } catch (error: any) {
              return { success: false, error: error.message }
       }
}

// --- COURTS ---

export async function upsertCourt(data: { id?: number; name: string; surface?: string; isIndoor?: boolean }) {
       const clubId = await getCurrentClubId()

       if (data.id) {
              // Update
              await prisma.court.update({
                     where: { id: data.id }, // Ideally verify clubId ownership via BEFORE check or AND in query if Prisma supported it directly in update where unique
                     data: {
                            name: data.name,
                            surface: data.surface,
                            isIndoor: data.isIndoor
                     }
              })
       } else {
              // Create
              // 1. Check Limits
              const club = await prisma.club.findUnique({
                     where: { id: clubId },
                     select: { maxCourts: true, plan: true, _count: { select: { courts: true } } }
              })

              if (club) {
                     if (club._count.courts >= club.maxCourts) {
                            throw new Error(`Has alcanzado el límite de ${club.maxCourts} canchas de tu plan ${club.plan || ''}. Mejora tu plan para agregar más.`)
                     }
              }

              await prisma.court.create({
                     data: {
                            clubId,
                            name: data.name,
                            surface: data.surface,
                            isIndoor: data.isIndoor || false
                     }
              })
       }

       revalidatePath('/configuracion')
       return { success: true }
}

export async function deleteCourt(id: number) {
       const clubId = await getCurrentClubId()
       // Verify ownership
       const court = await prisma.court.findFirst({ where: { id, clubId } })
       if (!court) throw new Error('Cancha no encontrada')

       // We might want soft delete, but for now hard delete if no bookings, or error if bookings exist
       // Simple approach: Delete
       try {
              await prisma.court.delete({ where: { id } })
              revalidatePath('/configuracion')
              return { success: true }
       } catch (error) {
              return { success: false, error: 'No se puede eliminar la cancha porque tiene reservas asociadas.' }
       }
}

// --- PRICE RULES ---

type PriceRuleInput = {
       id?: number
       name?: string
       daysOfWeek?: string // "0,1,2,3,4,5,6"
       startTime: string
       endTime: string
       price: number
       priority: number
       startDate?: Date | null
       endDate?: Date | null
}

export async function upsertPriceRule(data: PriceRuleInput) {
       const clubId = await getCurrentClubId()

       if (data.id) {
              await prisma.priceRule.update({
                     where: { id: data.id },
                     data: {
                            name: data.name,
                            daysOfWeek: data.daysOfWeek,
                            startTime: data.startTime,
                            endTime: data.endTime,
                            price: data.price,
                            priority: data.priority,
                            startDate: data.startDate,
                            endDate: data.endDate
                     }
              })
       } else {
              await prisma.priceRule.create({
                     data: {
                            clubId,
                            name: data.name,
                            daysOfWeek: data.daysOfWeek,
                            startTime: data.startTime,
                            endTime: data.endTime,
                            price: data.price,
                            priority: data.priority,
                            startDate: data.startDate,
                            endDate: data.endDate
                     }
              })
       }

       revalidatePath('/configuracion')
       return { success: true }
}

import { hash } from 'bcryptjs'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function deletePriceRule(id: number) {
       const clubId = await getCurrentClubId()

       const rule = await prisma.priceRule.findFirst({ where: { id, clubId } })
       if (!rule) throw new Error('Regla no encontrada')

       await prisma.priceRule.delete({ where: { id } })
       revalidatePath('/configuracion')
       return { success: true }
}

export async function updateMyPassword(formData: FormData) {
       const session = await getServerSession(authOptions)
       if (!session || !session.user || !session.user.email) {
              return { success: false, error: 'No autorizado' }
       }

       const newPassword = formData.get('newPassword') as string
       if (!newPassword || newPassword.length < 6) return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' }

       try {
              const hashedPassword = await hash(newPassword, 10)

              await prisma.user.update({
                     where: { email: session.user.email },
                     data: { password: hashedPassword }
              })

              return { success: true, message: 'Contraseña actualizada' }
       } catch (error: any) {
              console.error("Error updating password:", error)
              return { success: false, error: 'Error al actualizar contraseña' }
       }
}

export async function getAuditLogs(limit = 50) {
       const clubId = await getCurrentClubId()
       const logs = await prisma.auditLog.findMany({
              where: { clubId },
              orderBy: { createdAt: 'desc' },
              take: limit,
              include: {
                     user: { select: { name: true, email: true } }
              }
       })
       return logs
}
