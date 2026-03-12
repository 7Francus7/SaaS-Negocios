"use server";

import prisma from "@/lib/prisma";
import { getStoreId } from "@/lib/store";
import { safeSerialize } from "@/lib/utils";

export async function getSalesHistory(options?: {
       from?: Date;
       to?: Date;
       limit?: number;
       paymentMethod?: string;
}) {
       const storeId = await getStoreId();
       const limit = options?.limit || 50;

       const sales = await prisma.sale.findMany({
              where: {
                     storeId,
                     ...(options?.from ? { timestamp: { gte: options.from } } : {}),
                     ...(options?.to ? { timestamp: { lte: options.to } } : {}),
                     ...(options?.paymentMethod ? { paymentMethod: options.paymentMethod } : {}),
              },
              include: {
                     items: true,
                     payments: true,
                     customer: { select: { name: true } },
              },
              orderBy: { timestamp: "desc" },
              take: limit,
       });

       return safeSerialize(sales);
}

export async function voidSale(saleId: number) {
       const storeId = await getStoreId();

       const sale = await prisma.sale.findUnique({
              where: { id: saleId },
              include: { items: true, payments: true },
       });

       if (!sale || sale.storeId !== storeId) throw new Error("Venta no encontrada.");

       // Restore stock for each item
       return await prisma.$transaction(async (tx) => {
              for (const item of sale.items) {
                     // Restore stock
                     await tx.productVariant.update({
                            where: { id: item.variantId },
                            data: { stockQuantity: { increment: item.quantity } },
                     });

                     // Log stock movement
                     await tx.stockMovement.create({
                            data: {
                                   variantId: item.variantId,
                                   movementType: "VOID",
                                   quantity: item.quantity,
                                   reason: `Anulación Venta #${saleId}`,
                            },
                     });
              }

              // Reverse each payment type
              for (const payment of sale.payments) {
                     if (payment.paymentMethod === "EFECTIVO") {
                            // Find the session that was active during the sale or just the most recent open one
                            const session = await tx.cashSession.findFirst({
                                   where: { storeId, status: "OPEN" },
                                   orderBy: { startTime: "desc" },
                            });

                            if (session) {
                                   await tx.cashSession.update({
                                          where: { id: session.id },
                                          data: { finalCashSystem: { decrement: payment.amount } },
                                   });
                            }
                     } else if (payment.paymentMethod === "CTA_CTE" && sale.customerId) {
                            await tx.customer.update({
                                   where: { id: sale.customerId },
                                   data: { currentBalance: { decrement: payment.amount } },
                            });

                            await tx.accountMovement.create({
                                   data: {
                                          customerId: sale.customerId,
                                          movementType: "VOID",
                                          amount: -payment.amount,
                                          description: `Anulación Venta #${saleId}`,
                                          timestamp: new Date(),
                                   },
                            });
                     }
              }

              // Delete the sale
              await tx.sale.delete({ where: { id: saleId } });

              return { success: true };
       });
}

