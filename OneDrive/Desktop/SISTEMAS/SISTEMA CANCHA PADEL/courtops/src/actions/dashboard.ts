'use server'

import prisma from '@/lib/db'
import { getCurrentClubId } from '@/lib/tenant'

export async function getDashboardAlerts() {
       const clubId = await getCurrentClubId()

       // 1. Low Stock Products (e.g. less than 5 units)
       // Assuming we might have a 'minStock' field in future, for now hardcoded to 5
       const lowStockProducts = await prisma.product.findMany({
              where: {
                     clubId,
                     stock: {
                            lte: 5
                     },
                     isActive: true
              },
              take: 5,
              select: {
                     name: true,
                     stock: true
              }
       })

       // 2. Pending Payments for Today (Confirmed but Unpaid)
       const todayStart = new Date()
       todayStart.setHours(0, 0, 0, 0)

       const todayEnd = new Date()
       todayEnd.setHours(23, 59, 59, 999)

       const pendingPayments = await prisma.booking.findMany({
              where: {
                     clubId,
                     startTime: {
                            gte: todayStart,
                            lte: todayEnd
                     },
                     OR: [
                            { paymentStatus: 'UNPAID', status: 'CONFIRMED' },
                            { status: 'PENDING' }
                     ]
              },
              include: {
                     client: { select: { name: true } }
              },
              orderBy: {
                     startTime: 'asc'
              },
              take: 5
       })

       return {
              lowStock: lowStockProducts,
              pendingPayments: pendingPayments
       }
}
