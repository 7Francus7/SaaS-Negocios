'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentClubId, getOrCreateTodayCashRegister } from '@/lib/tenant'
import prisma from '@/lib/db'

// Helper to get or create today's register (Multi-tenant)
export async function getTodaysRegister() {
       const clubId = await getCurrentClubId()
       const register = await getOrCreateTodayCashRegister(clubId)

       // We need to fetch transactions which aren't included by getOrCreateTodayCashRegister
       const registerWithTransactions = await prisma.cashRegister.findUnique({
              where: { id: register.id },
              include: { transactions: true }
       })

       // Should always exist as we just retrieved/created it
       return registerWithTransactions!
}

export async function getCajaStats() {
       const register = await getTodaysRegister()

       const incomeCash = register.transactions
              .filter(t => t.type === 'INCOME' && t.method === 'CASH')
              .reduce((sum, t) => sum + t.amount, 0)

       const incomeTransfer = register.transactions
              .filter(t => t.type === 'INCOME' && t.method === 'TRANSFER')
              .reduce((sum, t) => sum + t.amount, 0)

       const expenses = register.transactions
              .filter(t => t.type === 'EXPENSE')
              .reduce((sum, t) => sum + t.amount, 0)

       const balance = (incomeCash + incomeTransfer) - expenses

       return {
              id: register.id,
              status: register.status,
              incomeCash,
              incomeTransfer,
              expenses,
              total: balance,
              transactionCount: register.transactions.length
       }
}

export async function registerTransaction(data: {
       type: 'INCOME' | 'EXPENSE',
       category: string,
       amount: number,
       method: 'CASH' | 'TRANSFER',
       description?: string,
       bookingId?: number // Optional link
}) {
       const register = await getTodaysRegister()

       const transaction = await prisma.transaction.create({
              data: {
                     cashRegisterId: register.id,
                     type: data.type,
                     category: data.category,
                     amount: data.amount,
                     method: data.method,
                     description: data.description || ''
              }
       })

       revalidatePath('/')
       return transaction
}
