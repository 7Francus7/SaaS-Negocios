'use server'

import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getOrCreateTodayCashRegister } from '@/lib/tenant'

// Cancel a booking combined with Refund logic if applicable
export async function cancelBooking(bookingId: number) {
       try {
              const booking = await prisma.booking.findUnique({ where: { id: bookingId } })

              if (!booking) return { success: false, error: 'Reserva no encontrada' }

              // If it was already canceled, do nothing
              if (booking.status === 'CANCELED') return { success: true }

              // If it was PAID, we need to register a REFUND (Gasto/Devolución)
              if (booking.paymentStatus === 'PAID') {
                     const register = await getOrCreateTodayCashRegister(booking.clubId)

                     await prisma.transaction.create({
                            data: {
                                   cashRegisterId: register.id,
                                   type: 'EXPENSE', // Money going out
                                   category: 'REFUND',
                                   amount: booking.price,
                                   method: 'CASH', // Assuming cash refund for simplicity
                                   description: `Devolución por cancelación Reserva #${booking.id}`
                            }
                     })
              }

              // Finally update status
              await prisma.booking.update({
                     where: { id: bookingId },
                     data: { status: 'CANCELED' }
              })

              revalidatePath('/')
              return { success: true }
       } catch (error) {
              console.error("Error cancelling booking:", error)
              return { success: false, error: "Error al cancelar la reserva" }
       }
}

// Update payment status (e.g., mark as PAID or CONFIRMED)
export async function updateBookingStatus(bookingId: number, options: {
       status?: 'CONFIRMED' | 'PENDING',
       paymentStatus?: 'PAID' | 'UNPAID'
}) {
       try {
              if (options.paymentStatus === 'PAID') {
                     const booking = await prisma.booking.findUnique({ where: { id: bookingId } })
                     if (booking && booking.paymentStatus !== 'PAID') {
                            // Register Income logic
                            const register = await getOrCreateTodayCashRegister(booking.clubId)

                            await prisma.transaction.create({
                                   data: {
                                          cashRegisterId: register.id,
                                          type: 'INCOME',
                                          category: 'BOOKING_PAYMENT',
                                          amount: booking.price,
                                          method: 'CASH', // Default assumption
                                          description: `Pago Reserva #${booking.id}`
                                   }
                            })
                     }
              }

              await prisma.booking.update({
                     where: { id: bookingId },
                     data: {
                            ...options
                     }
              })
              revalidatePath('/')
              return { success: true }
       } catch (error) {
              console.error("Error updating booking:", error)
              return { success: false, error: "Failed to update booking" }
       }
}
