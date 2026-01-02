'use server'

import prisma from '@/lib/db'
import { getEffectivePrice } from '@/lib/tenant'
import { startOfDay, endOfDay, addDays, format, parse, set } from 'date-fns'

export async function getPublicClubBySlug(slug: string) {
       const club = await prisma.club.findUnique({
              where: { slug },
              include: {
                     courts: {
                            orderBy: { sortOrder: 'asc' }
                     }
              }
       })
       return club
}

export async function getPublicAvailability(clubId: string, dateInput: Date | string) {
       const date = new Date(dateInput)
       const start = startOfDay(date)
       const end = endOfDay(date)

       // 1. Get Club Settings
       const club = await prisma.club.findUnique({
              where: { id: clubId },
              select: { openTime: true, closeTime: true, slotDuration: true }
       })
       if (!club) throw new Error('Club not found')

       // 2. Get Courts
       const courts = await prisma.court.findMany({
              where: { clubId },
              orderBy: { sortOrder: 'asc' }
       })

       // 3. Get Existing Bookings
       const bookings = await prisma.booking.findMany({
              where: {
                     clubId,
                     startTime: { gte: start, lte: end },
                     status: { not: 'CANCELED' }
              },
              select: { courtId: true, startTime: true }
       })

       // 4. Generate Slots Logic
       const slots = []

       // Parse open/close times safely
       // We create a base date using the query date to ensure correct comparison
       const [openH, openM] = club.openTime.split(':').map(Number)
       const [closeH, closeM] = club.closeTime.split(':').map(Number)

       let currentTime = set(date, { hours: openH, minutes: openM, seconds: 0, milliseconds: 0 })
       let endTime = set(date, { hours: closeH, minutes: closeM, seconds: 0, milliseconds: 0 })

       // Handle crossing midnight
       if (endTime <= currentTime) {
              endTime = addDays(endTime, 1)
       }

       const now = new Date()

       while (currentTime < endTime) {
              // Skip past times if looking at today
              if (currentTime < now && date.getDate() === now.getDate() && date.getMonth() === now.getMonth()) {
                     currentTime = new Date(currentTime.getTime() + club.slotDuration * 60000)
                     continue
              }

              const timeLabel = format(currentTime, 'HH:mm')

              // Helper to check court availability
              const freeCourts = courts.filter(court => {
                     // Check if there is a booking starting at this time for this court
                     // Using tolerance of 1 minute for small drifts
                     return !bookings.some(b =>
                            b.courtId === court.id &&
                            Math.abs(b.startTime.getTime() - currentTime.getTime()) < 60000
                     )
              })

              if (freeCourts.length > 0) {
                     // Get price for this slot
                     const price = await getEffectivePrice(clubId, currentTime, club.slotDuration)

                     slots.push({
                            time: timeLabel,
                            price,
                            courts: freeCourts.map(c => ({ id: c.id, name: c.name, type: c.surface }))
                     })
              }

              // Advance time
              currentTime = new Date(currentTime.getTime() + club.slotDuration * 60000)
       }

       return slots
}

export async function createPublicBooking(data: {
       clubId: string
       courtId: number
       dateStr: string // YYYY-MM-DD
       timeStr: string // HH:mm
       clientName: string
       clientPhone: string
}) {
       try {
              // 1. Find or Create Client
              let client = await prisma.client.findFirst({
                     where: { clubId: data.clubId, phone: data.clientPhone }
              })

              if (!client) {
                     client = await prisma.client.create({
                            data: {
                                   clubId: data.clubId,
                                   name: data.clientName,
                                   phone: data.clientPhone
                            }
                     })
              }

              // 2. Fetch Settings
              const club = await prisma.club.findUnique({
                     where: { id: data.clubId },
                     select: { slotDuration: true }
              })
              if (!club) return { success: false, error: 'Club not found' }

              // 3. Dates & Price
              const dateTime = new Date(`${data.dateStr}T${data.timeStr}:00`)
              const endTime = new Date(dateTime.getTime() + club.slotDuration * 60000)
              const price = await getEffectivePrice(data.clubId, dateTime, club.slotDuration)

              // 4. Create Booking
              const booking = await prisma.booking.create({
                     data: {
                            clubId: data.clubId,
                            courtId: data.courtId,
                            clientId: client.id,
                            startTime: dateTime,
                            endTime: endTime,
                            price,
                            status: 'PENDING',
                            paymentStatus: 'UNPAID'
                     }
              })

              return { success: true, booking }
       } catch (error: any) {
              console.error("ERROR CREATING PUBLIC BOOKING:", error)
              return { success: false, error: error.message || 'Error desconocido' }
       }
}
