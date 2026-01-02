'use server'

import { startOfDay, endOfDay } from 'date-fns'
import { getCurrentClubId } from '@/lib/tenant'
import prisma from '@/lib/db'

export type BookingWithClient = {
       id: number
       startTime: Date
       endTime: Date
       courtId: number
       status: string
       price: number
       paymentStatus: string
       client: {
              name: string
       } | null
}

export async function getBookingsForDate(date: Date): Promise<BookingWithClient[]> {
       try {
              const clubId = await getCurrentClubId()
              const start = startOfDay(date)
              const end = endOfDay(date)

              const bookings = await prisma.booking.findMany({
                     where: {
                            clubId,
                            startTime: {
                                   gte: start,
                                   lte: end
                            },
                            status: {
                                   not: 'CANCELED'
                            }
                     },
                     include: {
                            client: {
                                   select: {
                                          name: true
                                   }
                            }
                     }
              })

              return bookings
       } catch (error) {
              console.error('Error fetching bookings:', error)
              return []
       }
}

export async function getCourts() {
       const clubId = await getCurrentClubId()
       return await prisma.court.findMany({
              where: {
                     clubId,
                     isActive: true
              },
              orderBy: {
                     sortOrder: 'asc'
              }
       })
}
