'use server'

import prisma from '@/lib/db'
import { getCurrentClubId } from '@/lib/tenant'
import { hash } from 'bcryptjs'
import { revalidatePath } from 'next/cache'

export async function createTeamMember(data: { name: string, email: string, password: string, role: string }) {
       try {
              const clubId = await getCurrentClubId()

              // 1. Check Limits
              const club = await prisma.club.findUnique({
                     where: { id: clubId },
                     select: {
                            maxUsers: true,
                            plan: true,
                            _count: {
                                   select: { users: true }
                            }
                     }
              })

              if (!club) throw new Error('Club no encontrado')

              // Default limit if null (legacy)
              const limit = club.maxUsers || 1

              if (club._count.users >= limit) {
                     return { success: false, error: `Has llegado al límite de ${limit} usuarios de tu plan ${club.plan || 'BASIC'}. Mejora tu plan para agregar más.` }
              }

              // 2. Check if email exists (Global check? Or tenant scoped? Email is unique globally in User model usually)
              const existing = await prisma.user.findUnique({
                     where: { email: data.email }
              })

              if (existing) {
                     return { success: false, error: 'El email ya está registrado en el sistema.' }
              }

              // 3. Create User
              const hashedPassword = await hash(data.password, 10)

              await prisma.user.create({
                     data: {
                            name: data.name,
                            email: data.email,
                            password: hashedPassword,
                            role: data.role,
                            clubId: clubId
                     }
              })

              revalidatePath('/configuracion')
              return { success: true }

       } catch (error: any) {
              return { success: false, error: error.message }
       }
}

export async function deleteTeamMember(userId: string) {
       try {
              const clubId = await getCurrentClubId()

              // Verify ownership and not deleting self
              // (Self-deletion prevention should be handling in UI or here too)

              await prisma.user.delete({
                     where: {
                            id: userId,
                            clubId: clubId // Security: Ensure deleting user matches our club
                     }
              })

              revalidatePath('/configuracion')
              return { success: true }
       } catch (error: any) {
              return { success: false, error: error.message }
       }
}
