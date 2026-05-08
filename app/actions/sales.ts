"use server";

import prisma from "@/lib/prisma";
import { getStoreId } from "@/lib/store";

export type SaleItemInput = {
       variantId: number;
       quantity: number;
       unitPrice?: number;
};

export type PaymentInput = {
       method: string;
       amount: number;
};

type LoadedVariant = {
       id: number;
       variantName: string;
       salePrice: unknown;
       costPrice: unknown;
       stockQuantity: number;
       product: {
              name: string;
       };
};

export async function processSale(
       items: SaleItemInput[],
       payments: PaymentInput[],
       customerId?: number,
       discountAmount = 0
) {
       const storeId = await getStoreId();

       if (items.length === 0) {
              throw new Error("El carrito esta vacio.");
       }

       return await prisma.$transaction(async (tx) => {
              const variantIds = items.map((item) => item.variantId);
              const variants = await tx.productVariant.findMany({
                     where: {
                            id: { in: variantIds },
                            storeId,
                     },
                     select: {
                            id: true,
                            variantName: true,
                            salePrice: true,
                            costPrice: true,
                            stockQuantity: true,
                            product: {
                                   select: {
                                          name: true,
                                   },
                            },
                     },
              });

              const variantsMap = new Map<number, LoadedVariant>(
                     variants.map((variant) => [variant.id, variant as LoadedVariant])
              );

              let subtotal = 0;
              const saleItemsData: Array<{
                     variantId: number;
                     productNameSnapshot: string;
                     quantity: number;
                     unitPrice: number;
                     unitCost: number;
                     subtotal: number;
                     subtotalCost: number;
              }> = [];

              const stockOps: Promise<unknown>[] = [];

              for (const item of items) {
                     const variant = variantsMap.get(item.variantId);
                     if (!variant) {
                            throw new Error(`Producto ID ${item.variantId} no encontrado.`);
                     }

                     const price = item.unitPrice !== undefined ? item.unitPrice : Number(variant.salePrice);
                     const cost = Number(variant.costPrice);
                     const lineTotal = price * item.quantity;
                     const lineTotalCost = cost * item.quantity;
                     const newStock = variant.stockQuantity - item.quantity;

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

                     stockOps.push(
                            tx.productVariant.update({
                                   where: { id: variant.id },
                                   data: {
                                          stockQuantity: newStock,
                                          stockMovements: {
                                                 create: {
                                                        movementType: "SALE",
                                                        quantity: -item.quantity,
                                                        reason: "Venta POS",
                                                        balanceSnapshot: newStock,
                                                 },
                                          },
                                   },
                            })
                     );
              }

              await Promise.all(stockOps);

              const totalAmount = Math.max(0, subtotal - discountAmount);
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
                                   create: payments.map((payment) => ({
                                          paymentMethod: payment.method,
                                          amount: payment.amount,
                                   })),
                            },
                     },
                     select: {
                            id: true,
                            timestamp: true,
                     },
              });

              const cashbookMethodMap: Record<string, string> = {
                     EFECTIVO: "EFECTIVO",
                     TRANSFERENCIA: "TRANSFERENCIA",
                     TARJETA: "TARJETA",
              };

              const efectivoTotal = payments
                     .filter((payment) => payment.method === "EFECTIVO")
                     .reduce((sum, payment) => sum + payment.amount, 0);
              const ctaCteTotal = payments
                     .filter((payment) => payment.method === "CTA_CTE")
                     .reduce((sum, payment) => sum + payment.amount, 0);

              if (efectivoTotal > 0) {
                     const cashSession = await tx.cashSession.findFirst({
                            where: { storeId, status: "OPEN" },
                            orderBy: { startTime: "desc" },
                            select: { id: true, finalCashSystem: true, initialCash: true },
                     });

                     if (!cashSession) {
                            throw new Error("No hay caja abierta para procesar pago en efectivo.");
                     }

                     const currentFinalCash = Number(cashSession.finalCashSystem || cashSession.initialCash || 0);
                     await tx.cashSession.update({
                            where: { id: cashSession.id },
                            data: { finalCashSystem: currentFinalCash + efectivoTotal },
                     });
              }

              if (ctaCteTotal > 0) {
                     if (!customerId) {
                            throw new Error("Debe seleccionar cliente para Cuenta Corriente.");
                     }

                     await Promise.all([
                            tx.customer.update({
                                   where: { id: customerId },
                                   data: { currentBalance: { increment: ctaCteTotal } },
                            }),
                            tx.accountMovement.create({
                                   data: {
                                          customerId,
                                          movementType: "PURCHASE",
                                          amount: ctaCteTotal,
                                          description: `Compra Mixta Venta #${sale.id}`,
                                          timestamp: new Date(),
                                          paymentMethod: "CTA_CTE",
                                   },
                            }),
                     ]);
              }

              const cashBookEntries = payments
                     .map((payment) => {
                            const method = cashbookMethodMap[payment.method];
                            if (!method) return null;

                            return {
                                   storeId,
                                   date: sale.timestamp,
                                   type: "INGRESO",
                                   category: "VENTA",
                                   amount: payment.amount,
                                   method,
                                   description: `Venta #${sale.id}`,
                                   reference: `VENTA-${sale.id}`,
                            };
                     })
                     .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

              if (cashBookEntries.length > 0) {
                     await tx.cashBookEntry.createMany({
                            data: cashBookEntries,
                     });
              }

              let raffleNumber: number | null = null;
              const qualifiesForRaffle =
                     totalAmount >= 10000 &&
                     payments.every((payment) => payment.method === "EFECTIVO" || payment.method === "TRANSFERENCIA");

              if (qualifiesForRaffle) {
                     const [raffleEnabled, counterSetting] = await Promise.all([
                            tx.storeSetting.findUnique({
                                   where: { storeId_key: { storeId, key: "raffle_enabled" } },
                                   select: { value: true },
                            }),
                            tx.storeSetting.findUnique({
                                   where: { storeId_key: { storeId, key: "raffle_counter" } },
                                   select: { value: true },
                            }),
                     ]);

                     if (raffleEnabled?.value === "true") {
                            const newCounter = parseInt(counterSetting?.value || "0", 10) + 1;
                            await tx.storeSetting.upsert({
                                   where: { storeId_key: { storeId, key: "raffle_counter" } },
                                   update: { value: String(newCounter) },
                                   create: {
                                          storeId,
                                          key: "raffle_counter",
                                          value: String(newCounter),
                                          description: "Contador cupones sorteo",
                                   },
                            });
                            raffleNumber = newCounter;
                     }
              }

              return {
                     saleId: sale.id,
                     raffleNumber,
              };
       }, {
              maxWait: 10000,
              timeout: 20000,
       });
}
