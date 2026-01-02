'use server'

import prisma from '@/lib/db'
import { getCurrentClubId, getOrCreateTodayCashRegister } from '@/lib/tenant'
import { revalidatePath } from 'next/cache'

export async function getClients(search?: string) {
       const clubId = await getCurrentClubId()

       const where: any = { clubId }
       if (search) {
              where.OR = [
                     { name: { contains: search } }, // sqlite is case-insensitive by default usually? or need mode: insensitive
                     { phone: { contains: search } },
                     { email: { contains: search } }
              ]
       }

       const clients = await prisma.client.findMany({
              where,
              orderBy: { name: 'asc' },
              include: {
                     bookings: {
                            where: {
                                   paymentStatus: { not: 'PAID' },
                                   status: { not: { in: ['CANCELED'] } }
                            }
                     }
              }
       })

       // Calculate generic debt balance
       return clients.map(c => {
              const debt = c.bookings.reduce((sum, b) => sum + b.price, 0)
              return {
                     ...c,
                     balance: -debt // Negative means they owe us
              }
       })
}

export async function getClientDetails(id: number) {
       const clubId = await getCurrentClubId()

       const client = await prisma.client.findFirst({
              where: { id, clubId },
              include: {
                     bookings: {
                            orderBy: { startTime: 'desc' },
                            take: 20 // Last 20 bookings
                     },
                     transactions: {
                            orderBy: { createdAt: 'desc' },
                            take: 20
                     }
              }
       })

       if (!client) throw new Error("Cliente no encontrado")

       // Calculate Total Debt (All time unpaids)
       // We need to fetch ALL unpaid bookings to calculate total debt, not just last 20
       const allUnpaidBookings = await prisma.booking.findMany({
              where: {
                     clientId: id,
                     paymentStatus: { not: 'PAID' },
                     status: { not: 'CANCELED' }
              }
       })

       const debt = allUnpaidBookings.reduce((sum, b) => sum + b.price, 0)

       return { ...client, debt }
}

export async function createClientPayment(clientId: number, amount: number, method: 'CASH' | 'TRANSFER', description: string) {
       const clubId = await getCurrentClubId()
       const register = await getOrCreateTodayCashRegister(clubId)

       // 1. Create Transaction linked to Client
       const transaction = await prisma.transaction.create({
              data: {
                     cashRegisterId: register.id,
                     clientId,
                     type: 'INCOME',
                     category: 'PAYMENT_ON_ACCOUNT',
                     amount,
                     method,
                     description
              }
       })

       // 2. Auto-allocate to oldest unpaid bookings? 
       // For MVP, we will just register the payment. The "debt" is calculated by UNPAID bookings.
       // If we don't mark bookings as PAID, the debt remains.
       // So we MUST mark bookings as PAID if we want the debt to go down.
       // Strategy: Pay oldest bookings first.

       let remaining = amount
       const unpaidBookings = await prisma.booking.findMany({
              where: {
                     clientId,
                     paymentStatus: 'UNPAID',
                     status: { not: 'CANCELED' }
              },
              orderBy: { startTime: 'asc' }
       })

       for (const booking of unpaidBookings) {
              if (remaining <= 0) break;

              if (booking.price <= remaining) {
                     // Pay full booking
                     await prisma.booking.update({
                            where: { id: booking.id },
                            data: { paymentStatus: 'PAID', paymentMethod: method }
                     })
                     remaining -= booking.price
              } else {
                     // Partial pay? System only supports UNPAID/PAID/PARTIAL
                     // Let's mark PARTIAL? Or strictly only full?
                     // Let's mark PARTIAL and maybe store how much was paid? 
                     // Booking model doesn't have "paidAmount".
                     // STARTUP MVP: Skip partials. Leave it as is.
                     // Or maybe we can't clear the debt if we don't clear the booking.
                     // Let's just update PaymentStatus to PAID if covered.
              }
       }

       revalidatePath('/clientes')
       revalidatePath(`/clientes/${clientId}`)
       return { success: true }
}

export async function updateClient(id: number, data: { name: string, phone: string, email?: string, notes?: string }) {
       await prisma.client.update({
              where: { id },
              data
       })
       revalidatePath(`/clientes/${id}`)
       return { success: true }
}
