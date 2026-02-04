"use server";

import prisma from "@/lib/prisma";
import { getStoreId } from "@/lib/store";

export type SaleItemInput = {
       variantId: number;
       quantity: number;
};

export async function processSale(
       items: SaleItemInput[],
       paymentMethod: string = "EFECTIVO",
       customerId?: number,
       discountPercentage: number = 0
) {
       const storeId = await getStoreId();

       if (items.length === 0) {
              throw new Error("El carrito está vacío.");
       }

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

                     if (variant.stockQuantity < item.quantity) {
                            throw new Error(
                                   `Stock insuficiente para: ${variant.product.name} ${variant.variantName}`
                            );
                     }

                     // Ensure Decimal handled as number for JS math, or use a Decimal lib
                     // Prisma Decimals are objects/strings, converting to Number for simple logic
                     const price = Number(variant.salePrice);
                     const lineTotal = price * item.quantity;
                     subtotal += lineTotal;

                     saleItemsData.push({
                            variantId: variant.id,
                            productNameSnapshot: `${variant.product.name} ${variant.variantName}`,
                            quantity: item.quantity,
                            unitPrice: price,
                            subtotal: lineTotal,
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
              const discountAmount = (subtotal * discountPercentage) / 100;
              const total = subtotal - discountAmount;

              // 4. Create Sale
              const sale = await tx.sale.create({
                     data: {
                            storeId,
                            customerId,
                            paymentMethod,
                            subtotal,
                            discountAmount,
                            totalAmount: total,
                            timestamp: new Date(),
                            items: {
                                   create: saleItemsData,
                            },
                     },
                     include: { items: true },
              });

              // 5. Handle Payment Methods
              if (paymentMethod === "EFECTIVO") {
                     // Find open session
                     const session = await tx.cashSession.findFirst({
                            where: { storeId, status: "OPEN" },
                            orderBy: { startTime: "desc" },
                     });

                     if (!session) {
                            throw new Error("No hay caja abierta. Debe abrir caja para cobrar en efectivo.");
                     }

                     await tx.cashSession.update({
                            where: { id: session.id },
                            data: {
                                   finalCashSystem: {
                                          increment: total,
                                   },
                            },
                     });
              } else if (paymentMethod === "CTA_CTE") {
                     if (!customerId) throw new Error("Debe seleccionar cliente para Cuenta Corriente.");

                     const customer = await tx.customer.findUnique({ where: { id: customerId } });
                     if (!customer) throw new Error("Cliente no encontrado.");

                     // Check credit limit? Optional logic here.

                     await tx.customer.update({
                            where: { id: customerId },
                            data: {
                                   currentBalance: { increment: total },
                            },
                     });

                     await tx.accountMovement.create({
                            data: {
                                   customerId,
                                   movementType: "PURCHASE",
                                   amount: total,
                                   description: `Compra Venta #${sale.id}`,
                                   timestamp: new Date(),
                            },
                     });
              }

              return {
                     ...sale,
                     subtotal: Number(sale.subtotal),
                     discountAmount: Number(sale.discountAmount),
                     totalAmount: Number(sale.totalAmount),
                     items: sale.items.map(item => ({
                            ...item,
                            unitPrice: Number(item.unitPrice),
                            subtotal: Number(item.subtotal)
                     }))
              };
       });
}
