'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { getCurrentClubId, getOrCreateTodayCashRegister } from '@/lib/tenant'

const prisma = new PrismaClient()

export async function getProducts() {
       const clubId = await getCurrentClubId()
       return await prisma.product.findMany({
              where: {
                     clubId,
                     isActive: true
              }
       })
}

export async function processSale(items: { productId: number, quantity: number }[], paymentMethod: 'CASH' | 'TRANSFER') {
       try {
              const clubId = await getCurrentClubId()

              // 1. Calculate Total and Validate Stock
              let totalAmount = 0
              let descriptionParts: string[] = []

              // Transaction to ensure atomicity
              return await prisma.$transaction(async (tx) => {
                     for (const item of items) {
                            // Scoped findUnique is not possible directly on ID but ID is unique globally. 
                            // Ideally we verify it belongs to club, but for MVP checking ID existence is enough 
                            // or we check clubId after fetch.
                            const product = await tx.product.findUnique({ where: { id: item.productId } })

                            if (!product) throw new Error(`Producto no encontrado: ${item.productId}`)
                            if (product.clubId !== clubId) throw new Error(`Producto no pertenece al club: ${item.productId}`)

                            if (product.stock < item.quantity) {
                                   throw new Error(`Stock insuficiente para ${product.name}. Disponibles: ${product.stock}`)
                            }

                            // Deduct Stock
                            await tx.product.update({
                                   where: { id: item.productId },
                                   data: { stock: { decrement: item.quantity } }
                            })

                            const subtotal = product.price * item.quantity
                            totalAmount += subtotal
                            descriptionParts.push(`${item.quantity}x ${product.name}`)
                     }

                     // 2. Register Transaction in Caja
                     // We can't use generic helper easily inside shared transaction if we want ATOMICITY.
                     // So we reimplement find/create logic inside this TX or pass TX to helper (if helper supported it).
                     // For now, simple logic inside TX:

                     const today = new Date()
                     today.setHours(0, 0, 0, 0)

                     let register = await tx.cashRegister.findFirst({
                            where: { clubId, date: today }
                     })

                     if (!register) {
                            register = await tx.cashRegister.create({
                                   data: { clubId, date: today, status: 'OPEN' }
                            })
                     }

                     const transaction = await tx.transaction.create({
                            data: {
                                   cashRegisterId: register.id,
                                   type: 'INCOME',
                                   category: 'KIOSCO',
                                   amount: totalAmount,
                                   method: paymentMethod,
                                   description: descriptionParts.join(', ')
                            }
                     })

                     return transaction
              })
       } catch (error: any) {
              console.error("Error processing sale:", error)
              throw new Error(error.message)
       }
}
