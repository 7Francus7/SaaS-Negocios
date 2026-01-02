'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentClubId, getEffectivePrice, getOrCreateTodayCashRegister } from '@/lib/tenant'
import prisma from '@/lib/db'
import { logAction } from '@/lib/logger'

export type CreateBookingInput = {
       clientName: string
       clientPhone: string
       clientEmail?: string
       courtId: number
       startTime: Date // Javascript Date object
       paymentStatus?: 'UNPAID' | 'PAID' | 'PARTIAL'
       status?: 'PENDING' | 'CONFIRMED'
}

export async function createBooking(data: CreateBookingInput) {
       try {
              const clubId = await getCurrentClubId()

              // 0. Fetch Club Settings (Duration) & Client in one go if possible, but sequential is fine for now
              const clubConfig = await prisma.club.findUnique({
                     where: { id: clubId },
                     select: { slotDuration: true }
              })

              const slotDuration = clubConfig?.slotDuration || 90

              // 1. Find or Create Client (Scoped to Club)
              let client = await prisma.client.findFirst({
                     where: {
                            clubId,
                            phone: data.clientPhone
                     }
              })

              if (!client) {
                     client = await prisma.client.create({
                            data: {
                                   clubId,
                                   name: data.clientName,
                                   phone: data.clientPhone,
                                   email: data.clientEmail
                            }
                     })
              } else {
                     // Optional: Update name/email if provided
                     if (data.clientEmail || (data.clientName && data.clientName !== client.name)) {
                            await prisma.client.update({
                                   where: { id: client.id },
                                   data: {
                                          email: data.clientEmail || client.email,
                                          name: data.clientName
                                   }
                            })
                     }
              }

              // 2. Calculate Price based on PriceRules (New Logic)
              // Pass dynamic duration context
              const finalPrice = await getEffectivePrice(clubId, data.startTime, slotDuration)

              // 3. Prevent Overlaps
              // Rule: No existing booking can OVERLAP with NewBooking (Start to End)
              // New Booking End = Start + slotDuration
              const requestEnd = new Date(data.startTime)
              requestEnd.setMinutes(requestEnd.getMinutes() + slotDuration)

              const overlap = await prisma.booking.findFirst({
                     where: {
                            clubId, // Scope to club
                            courtId: data.courtId,
                            status: { not: 'CANCELED' },
                            OR: [
                                   // Existing starts inside new
                                   { startTime: { gte: data.startTime, lt: requestEnd } },
                                   // Existing ends inside new
                                   { endTime: { gt: data.startTime, lte: requestEnd } },
                                   // Existing engulfs new
                                   { startTime: { lte: data.startTime }, endTime: { gte: requestEnd } }
                            ]
                     }
              })

              if (overlap) {
                     throw new Error("Ya existe una reserva en este horario.")
              }

              // 4. Create Booking
              const booking = await prisma.booking.create({
                     data: {
                            clubId,
                            courtId: data.courtId,
                            clientId: client.id,
                            startTime: data.startTime,
                            endTime: requestEnd,
                            price: finalPrice,
                            status: data.status || 'CONFIRMED',
                            paymentStatus: data.paymentStatus || 'UNPAID',
                            paymentMethod: data.paymentStatus === 'PAID' ? 'CASH' : null
                     }
              })

              // 4.5. Log Audit Action
              // We don't await this to keep UI fast, or we await if strict consistency needed.
              // For "Best for system", let's await safely inside a try-catch block inside logAction function, 
              // but here we just call it. Since logAction is async, we should await it if we want to ensure it's written before return.
              // Given the wrapper in logger.ts, we can await it.
              await logAction({
                     clubId,
                     action: 'CREATE',
                     entity: 'BOOKING',
                     entityId: booking.id.toString(),
                     details: {
                            courtId: data.courtId,
                            startTime: data.startTime,
                            price: finalPrice,
                            client: client.name
                     }
              })


              // 5. REGISTER TRANSACTION IF PAID
              if (data.paymentStatus === 'PAID') {
                     const register = await getOrCreateTodayCashRegister(clubId)

                     await prisma.transaction.create({
                            data: {
                                   cashRegisterId: register.id,
                                   type: 'INCOME',
                                   category: 'BOOKING',
                                   amount: finalPrice,
                                   method: 'CASH', // Defaulting to CASH for manual quick pay
                                   description: `Reserva Cancha ${data.courtId} - ${data.clientName}`
                            }
                     })
              }

              revalidatePath('/') // Revalidate the dashboard
              return { success: true, booking }

       } catch (error: any) {
              console.error("Booking Creation Error:", error)
              return { success: false, error: error.message }
       }
}
