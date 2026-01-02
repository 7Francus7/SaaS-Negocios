'use server'

import prisma from '@/lib/db'
import { hash } from 'bcryptjs'
import { revalidatePath } from 'next/cache'

export async function createNewClub(formData: FormData) {
       const clubName = formData.get('clubName') as string
       const adminEmail = formData.get('adminEmail') as string
       const adminPassword = formData.get('adminPassword') as string
       const adminName = formData.get('adminName') as string

       if (!clubName || !adminEmail || !adminPassword) {
              return { success: false, error: 'Faltan datos' }
       }


       try {
              // 1. Determine Plan and Limits
              const plan = (formData.get('plan') as string) || 'BASIC'

              let maxCourts = 2
              let maxUsers = 3
              let hasKiosco = false
              let hasOnlinePayments = false
              let hasAdvancedReports = false

              switch (plan) {
                     case 'PRO':
                            maxCourts = 4
                            maxUsers = 5
                            hasKiosco = true
                            hasAdvancedReports = true
                            break
                     case 'PREMIUM':
                            maxCourts = 10
                            maxUsers = 10
                            hasKiosco = true
                            hasOnlinePayments = true
                            hasAdvancedReports = true
                            break
                     case 'ENTERPRISE':
                            maxCourts = 50
                            maxUsers = 50
                            hasKiosco = true
                            hasOnlinePayments = true
                            hasAdvancedReports = true
                            break
                     default: // BASIC
                            maxCourts = 2
                            maxUsers = 3
                            hasKiosco = false
                            hasOnlinePayments = false
                            hasAdvancedReports = false
              }

              // 2. Generate Slug
              let slug = clubName.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-')
              const existingSlug = await prisma.club.findUnique({ where: { slug } })
              if (existingSlug) {
                     slug = `${slug}-${Date.now()}`
              }

              // 3. Crear el Club
              const club = await prisma.club.create({
                     data: {
                            name: clubName,
                            slug: slug,
                            // SaaS Fields
                            plan: plan as any, // Cast to Enum
                            subscriptionStatus: 'ACTIVE', // Auto-activate for now or TRIAL
                            maxCourts,
                            maxUsers,
                            hasKiosco,
                            hasOnlinePayments,
                            hasAdvancedReports
                     }
              })

              // 4. Crear Canchas por defecto (Ej: 2 canchas estándar)
              await prisma.court.createMany({
                     data: [
                            { name: 'Cancha 1', clubId: club.id },
                            { name: 'Cancha 2', clubId: club.id },
                     ]
              })

              // 5. Crear el Usuario Admin para ese Club
              const hashedPassword = await hash(adminPassword, 10)
              await prisma.user.create({
                     data: {
                            email: adminEmail,
                            name: adminName || 'Admin Club',
                            password: hashedPassword,
                            role: 'ADMIN',
                            clubId: club.id
                     }
              })

              // 6. Crear Reglas de Precio base (Ej: $10.000 generico por ahora)
              await prisma.priceRule.create({
                     data: {
                            name: 'Precio General',
                            price: 10000,
                            daysOfWeek: '0,1,2,3,4,5,6',
                            startTime: '00:00',
                            endTime: '23:59',
                            priority: 1,
                            clubId: club.id
                     }
              })

              revalidatePath('/god-mode')
              return { success: true, message: `Club "${clubName}" creado con éxito!` }

       } catch (error: any) {
              console.error("Error creating club:", error)
              return { success: false, error: error.message || 'Error al crear el club' }
       }
}

export async function getAllClubs() {
       return await prisma.club.findMany({
              include: {
                     _count: {
                            select: {
                                   courts: true,
                                   users: true,
                                   bookings: true
                            }
                     },
                     users: {
                            where: { role: 'ADMIN' },
                            select: { id: true, email: true },
                            take: 1
                     }
              },
              orderBy: {
                     createdAt: 'desc'
              }
       })
}

export async function deleteClub(formData: FormData) {
       const clubId = formData.get('clubId') as string
       if (!clubId) return { success: false, error: 'ID de club requerido' }

       try {
              // Delete dependencies first if cascade not set properly, but usually cascade works if configured.
              // Assuming Cascade delete or manually cleaning up if needed.
              // Here we just delete the club, hoping Prisma Schema handles cascade or we catch error.
              // Usually User, Court, etc should cascade or be deleted manually.
              // Let's rely on simple delete for now or wrap in transaction if schema demands it.

              // Safer approach: Delete related first just in case
              const deleteBookings = prisma.booking.deleteMany({ where: { clubId } })
              const deleteCourts = prisma.court.deleteMany({ where: { clubId } })
              const deletePriceRules = prisma.priceRule.deleteMany({ where: { clubId } })
              const deleteUsers = prisma.user.deleteMany({ where: { clubId } })
              const deleteClub = prisma.club.delete({ where: { id: clubId } })

              await prisma.$transaction([deleteBookings, deleteCourts, deletePriceRules, deleteUsers, deleteClub])

              revalidatePath('/god-mode')
              return { success: true, message: 'Club eliminado' }
       } catch (error: any) {
              console.error("Error deleting club:", error)
              return { success: false, error: error.message }
       }
}

export async function updateClub(formData: FormData) {
       const clubId = formData.get('clubId') as string
       const name = formData.get('name') as string
       const slug = formData.get('slug') as string
       const plan = formData.get('plan') as string // Optional

       if (!clubId || !name || !slug) return { success: false, error: 'Datos incompletos' }

       let updateData: any = { name, slug }

       // If Plan Changed, update Limits and Flags
       if (plan) {
              updateData.plan = plan

              switch (plan) {
                     case 'PRO':
                            updateData.maxCourts = 4
                            updateData.maxUsers = 5
                            updateData.hasKiosco = true
                            updateData.hasOnlinePayments = false
                            updateData.hasAdvancedReports = true
                            break
                     case 'PREMIUM':
                            updateData.maxCourts = 10
                            updateData.maxUsers = 10
                            updateData.hasKiosco = true
                            updateData.hasOnlinePayments = true
                            updateData.hasAdvancedReports = true
                            break
                     case 'ENTERPRISE':
                            updateData.maxCourts = 50
                            updateData.maxUsers = 50
                            updateData.hasKiosco = true
                            updateData.hasOnlinePayments = true
                            updateData.hasAdvancedReports = true
                            break
                     case 'BASIC':
                     default:
                            updateData.maxCourts = 2
                            updateData.maxUsers = 3
                            updateData.hasKiosco = false
                            updateData.hasOnlinePayments = false
                            updateData.hasAdvancedReports = false
                     // Important: If downgrading, we don't delete data, just limits apply for FUTURE actions
              }
       }

       try {
              await prisma.club.update({
                     where: { id: clubId },
                     data: updateData
              })
              revalidatePath('/god-mode')
              return { success: true, message: 'Club actualizado' }
       } catch (error: any) {
              console.error("Error updating club:", error)
              return { success: false, error: error.message }
       }
}

export async function updateClubAdminPassword(formData: FormData) {
       const clubId = formData.get('clubId') as string
       const newPassword = formData.get('newPassword') as string

       if (!clubId || !newPassword) return { success: false, error: 'Faltan datos' }

       try {
              const hashedPassword = await hash(newPassword, 10)

              // Update ALL admins for this club? Or just the first one?
              // Typically there is one main admin. We'll update all users with role ADMIN for this club to stay safe/consistent for now,
              // or better, find the specific user. 
              // But the UI might not distinguish well. Let's update all ADMINs for this club.

              await prisma.user.updateMany({
                     where: {
                            clubId: clubId,
                            role: 'ADMIN'
                     },
                     data: {
                            password: hashedPassword
                     }
              })

              revalidatePath('/god-mode')
              return { success: true, message: 'Contraseña de admin actualizada' }
       } catch (error: any) {
              console.error("Error updating admin password:", error)
              return { success: false, error: error.message }
       }
}
