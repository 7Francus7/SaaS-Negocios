"use server";

import prisma from "@/lib/prisma";
import { getStoreId } from "@/lib/store";

export type SaleItemInput = {
       variantId: number;
       quantity: number;
       unitPrice?: number;
};

import { saleSchema } from "@/lib/validations";

export type PaymentInput = {
       method: string;
       amount: number;
};

export async function processSale(
       items: SaleItemInput[],
       payments: PaymentInput[],
       customerId?: number,
       discountAmount: number = 0
) {
       const storeId = await getStoreId();

       if (items.length === 0) {
              throw new Error("El carrito está vacío.");
       }

       const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);

       // Transaction
       return await prisma.$transaction(async (tx) => {
              // 1. Fetch all variants involved
              const variantIds = items.map((i) => i.variantId);
              const variants = await tx.productVariant.findMany({
                     where: {
                            id: { in: variantIds },
                            storeId: storeId,
                      },
                      include: { product: true },
              });

              const variantsMap = new Map(variants.map((v) => [v.id, v]));

              let subtotal = 0;
              const saleItemsData = [];

              // 2. Validate & Calculate
              for (const item of items) {
                     const variant = variantsMap.get(item.variantId);
                     if (!variant) throw new Error(`Producto ID ${item.variantId} no encontrado.`);

                      const price = item.unitPrice !== undefined ? item.unitPrice : Number(variant.salePrice);
                      const cost = Number(variant.costPrice);
                      const lineTotal = price * item.quantity;
                      const lineTotalCost = cost * item.quantity;
                     subtotal += lineTotal;

                     saleItemsData.push({
                            variantId: variant.id,
                            productNameSnapshot: `${variant.product.name} ${variant.variantName}`,
                            quantity: item.quantity,
                            unitPrice: price,
                            unitCost: cost,
                            subtotal: lineTotal,
                            subtotalCost: lineTotalCost,
                     });

                     // Update Stock
                     const newStock = variant.stockQuantity - item.quantity;
                     await tx.productVariant.update({
                            where: { id: variant.id },
                            data: { stockQuantity: newStock },
                     });

                     // Log Movement
                     await tx.stockMovement.create({
                            data: {
                                   variantId: variant.id,
                                   movementType: "SALE",
                                   quantity: -item.quantity,
                                   reason: "Venta POS",
                                   balanceSnapshot: newStock,
                            },
                     });
              }

              // 3. Totals
              const totalAmount = Math.max(0, subtotal - discountAmount);

              if (Math.abs(totalPayments - totalAmount) > 0.01) {
                     // We allow overpayment (change) for cash, but total recorded should match. 
                     // Actually, the payments array should reflect what is kept.
              }

              // 4. Create Sale
              const sale = await tx.sale.create({
                     data: {
                            storeId,
                            customerId,
                            paymentMethod: payments.length === 1 ? payments[0].method : "MIXTO",
                            subtotal,
                            discountAmount,
                            totalAmount,
                            timestamp: new Date(),
                            items: {
                                   create: saleItemsData,
                            },
                            payments: {
                                   create: payments.map(p => ({
                                          paymentMethod: p.method,
                                          amount: p.amount
                                   }))
                            }
                     },
                     include: { items: true, payments: true },
              });

              // 5. Handle Payment Logics (Cash Session, Customer Balance)
              for (const payment of payments) {
                     if (payment.method === "EFECTIVO") {
                            const session = await tx.cashSession.findFirst({
                                   where: { storeId, status: "OPEN" },
                                   orderBy: { startTime: "desc" },
                            });

                            if (!session) {
                                   throw new Error("No hay caja abierta para procesar pago en efectivo.");
                            }

                            const currentFinalCash = Number(session.finalCashSystem || session.initialCash || 0);
                            await tx.cashSession.update({
                                   where: { id: session.id },
                                   data: {
                                          finalCashSystem: currentFinalCash + payment.amount,
                                   },
                            });
                     } else if (payment.method === "CTA_CTE") {
                            if (!customerId) throw new Error("Debe seleccionar cliente para Cuenta Corriente.");

                            await tx.customer.update({
                                   where: { id: customerId },
                                   data: {
                                          currentBalance: { increment: payment.amount },
                                   },
                            });

                            await tx.accountMovement.create({
                                   data: {
                                          customerId,
                                          movementType: "PURCHASE",
                                          amount: payment.amount,
                                          description: `Compra Mixta Venta #${sale.id}`,
                                          timestamp: new Date(),
                                          paymentMethod: "CTA_CTE"
                                   },
                            });
                     }
              }

              return {
                     ...sale,
                     subtotal: Number(sale.subtotal),
                     discountAmount: Number(sale.discountAmount),
                     totalAmount: Number(sale.totalAmount),
                     items: (sale.items as any[]).map((item: any) => ({
                            ...item,
                            unitPrice: Number(item.unitPrice),
                            unitCost: Number(item.unitCost || 0),
                            subtotal: Number(item.subtotal),
                            subtotalCost: Number(item.subtotalCost || 0)
                     })),
                     payments: sale.payments.map(p => ({
                            ...p,
                            amount: Number(p.amount)
                     }))
              } as any;
       });
}

