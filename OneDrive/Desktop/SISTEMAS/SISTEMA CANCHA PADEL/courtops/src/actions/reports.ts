'use server'

import prisma from '@/lib/db'
import { subDays } from 'date-fns'
import { getCurrentClubId } from '@/lib/tenant'

export async function getFinancialStats(start: Date, end: Date) {
       const clubId = await getCurrentClubId()

       // Filter transactions where CashRegister belongs to the club
       const transactions = await prisma.transaction.findMany({
              where: {
                     cashRegister: {
                            clubId
                     },
                     createdAt: {
                            gte: start,
                            lte: end
                     }
              }
       })

       const income = transactions
              .filter(t => t.type === 'INCOME')
              .reduce((sum, t) => sum + t.amount, 0)

       const expenses = transactions
              .filter(t => t.type === 'EXPENSE')
              .reduce((sum, t) => sum + t.amount, 0)

       const balance = income - expenses

       // Breakdown by category
       const byCategory = transactions.reduce((acc, t) => {
              acc[t.category] = (acc[t.category] || 0) + t.amount
              return acc
       }, {} as Record<string, number>)

       return { income, expenses, balance, byCategory }
}

export async function getReportTransactions(start: Date, end: Date) {
       const clubId = await getCurrentClubId()

       return await prisma.transaction.findMany({
              where: {
                     cashRegister: {
                            clubId
                     },
                     createdAt: {
                            gte: start,
                            lte: end
                     }
              },
              orderBy: {
                     createdAt: 'desc'
              },
              take: 100 // Limit for performance
       })
}

export async function getOccupancyStats() {
       const clubId = await getCurrentClubId()

       // Get Club Hours
       const club = await prisma.club.findUnique({
              where: { id: clubId },
              select: { openTime: true, closeTime: true }
       })

       if (!club) return []

       const openHour = parseInt(club.openTime.split(':')[0])
       const closeHour = parseInt(club.closeTime.split(':')[0])

       // Analizamos los últimos 30 días para tener una muestra representativa
       const endDate = new Date()
       const startDate = subDays(endDate, 30)

       const bookings = await prisma.booking.findMany({
              where: {
                     clubId,
                     startTime: { gte: startDate, lte: endDate },
                     status: { not: 'CANCELED' }
              }
       })

       // Agrupamos por hora del día (0-23)
       const hoursCount = new Array(24).fill(0)

       // Total bookings count
       const totalBookings = bookings.length

       bookings.forEach(booking => {
              const hour = booking.startTime.getHours()
              hoursCount[hour]++
       })

       // Convertir a formato para gráfico
       // Filter based on operational hours
       const chartData = hoursCount.map((count, hour) => ({
              hour: `${hour}:00`,
              count,
              percentage: totalBookings > 0 ? Math.round((count / totalBookings) * 100) : 0
       })).filter((_, hour) => {
              // Handle overnight hours (e.g. 14:00 to 02:00)
              if (closeHour < openHour) {
                     return hour >= openHour || hour < closeHour // Using < closeHour assuming closeTime is when it SHUTS. e.g. closes at 00:00 means hour 0 should be shown? Maybe <=. Let's use <= closeHour to be safe and inclusive or strictly < if bookings stop before. Usually bookings start AT the hour. if close is 00:30, last booking might be 23:00. Hour 0 would be 00:00-01:00. 
                     // Let's use <= closeHour + 1 to include the closing hour block just in case, or simplistically current logic.
                     return hour >= openHour || hour <= closeHour
              } else {
                     return hour >= openHour && hour <= closeHour // e.g. 10 to 22
              }
       })

       return chartData
}
