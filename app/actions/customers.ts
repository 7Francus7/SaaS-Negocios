"use server";

import prisma from "@/lib/prisma";
import { getStoreId } from "@/lib/store";
import { customerSchema } from "@/lib/validations";
import { safeSerialize } from "@/lib/utils";

export async function getCustomers(activeOnly: boolean = true) {
       const storeId = await getStoreId();
       const customers = await prisma.customer.findMany({
              where: {
                     storeId,
                     ...(activeOnly ? { active: true } : {}),
              },
              orderBy: { name: "asc" },
       });

       return customers.map(c => ({
              ...c,
              currentBalance: Number(c.currentBalance),
              closedBalance: Number(c.closedBalance || 0),
              creditLimit: Number(c.creditLimit)
       }));
}

export async function createCustomer(data: {
       name: string;
       dni?: string;
       phone?: string;
       address?: string;
       creditLimit?: number;
}) {
       const storeId = await getStoreId();

       const parsed = customerSchema.parse(data);

       return await prisma.customer.create({
              data: {
                     storeId,
                     name: parsed.name,
                     dni: parsed.dni,
                     phone: parsed.phone,
                     address: parsed.address,
                     creditLimit: parsed.creditLimit ?? 0,
                     currentBalance: 0,
                     closedBalance: 0,
                     active: true,
              },
       });
}

export async function registerPayment(
       customerId: number,
       amount: number,
       description: string = "Pago a cuenta",
       paymentMethod: string = "EFECTIVO"
) {
       try {
              const storeId = await getStoreId();

              if (amount === 0) return { error: "El monto no puede ser 0." };

              const result = await prisma.$transaction(async (tx) => {
                     const customer = await tx.customer.findUnique({
                            where: { id: customerId },
                     });

                     if (!customer || customer.storeId !== storeId) {
                            throw new Error("Cliente no encontrado.");
                     }

                     // Apply Payment to currentBalance (reduces debt)
                     await tx.customer.update({
                            where: { id: customerId },
                            data: {
                                   currentBalance: { decrement: amount },
                            }
                     });

                     // Log Movement
                     await tx.accountMovement.create({
                            data: {
                                   customerId,
                                   movementType: "PAYMENT",
                                   amount: -amount, // Negative implies debt reduction
                                   description,
                                   paymentMethod,
                                   timestamp: new Date(),
                            },
                     });

                     // Update Cash if needed
                     if (paymentMethod === "EFECTIVO") {
                            const session = await tx.cashSession.findFirst({
                                   where: { storeId, status: "OPEN" },
                                   orderBy: { startTime: "desc" },
                            });

                            if (session) {
                                   // Register valid Cash Movement so it appears in Cash Page
                                   await tx.cashMovement.create({
                                          data: {
                                                 cashSessionId: session.id,
                                                 type: amount > 0 ? "IN" : "OUT",
                                                 amount: Math.abs(amount),
                                                 description: amount > 0 ? `Pago Cta Cte: ${customer.name}` : `Devolución Cta Cte: ${customer.name}`,
                                                 timestamp: new Date()
                                          }
                                   });
                            } else {
                                   throw new Error("No hay turno de caja abierto para registrar el pago en EFECTIVO. Por favor, abra la caja primero.");
                            }
                     }
                     // For other methods (TRANSFERENCIA, DEBITO, etc.), we don't touch the cash box.

                     return customer;
              });

              return { success: true, count: 1 };
       } catch (error: any) {
              console.error("registerPayment error:", error);
              return { error: error.message || "Error procesando el pago." };
       }
}

export async function getCustomerHistory(customerId: number) {
       const storeId = await getStoreId();

       // Verify ownership
       const customer = await prisma.customer.findUnique({ where: { id: customerId } });
       if (!customer || customer.storeId !== storeId) return [];

       const history = await prisma.accountMovement.findMany({
              where: { customerId },
              orderBy: { timestamp: "desc" },
              take: 50
       });

       // Extract sale IDs from descriptions to fetch product details
       const saleIds: number[] = [];
       for (const h of history) {
              const match = h.description?.match(/Venta #(\d+)/);
              if (match) saleIds.push(parseInt(match[1]));
       }

       const salesWithItems = saleIds.length > 0
              ? await prisma.sale.findMany({
                     where: { id: { in: saleIds }, storeId },
                     include: { items: true }
              })
              : [];

       const salesMap = new Map(salesWithItems.map(s => [s.id, s]));

       return history.map(h => {
              const match = h.description?.match(/Venta #(\d+)/);
              const sale = match ? salesMap.get(parseInt(match[1])) : undefined;
              return {
                     ...h,
                     amount: Number(h.amount),
                     saleItems: (sale?.items || []).map(item => ({
                            id: item.id,
                            productNameSnapshot: item.productNameSnapshot,
                            quantity: Number(item.quantity),
                            unitPrice: Number(item.unitPrice),
                            subtotal: Number(item.subtotal),
                     }))
              };
       });
}

export async function updateCustomer(customerId: number, data: {
       name: string;
       dni?: string;
       phone?: string;
       address?: string;
       creditLimit?: number;
}) {
       const storeId = await getStoreId();

       const customer = await prisma.customer.findUnique({ where: { id: customerId } });
       if (!customer || customer.storeId !== storeId) throw new Error("Cliente no encontrado.");

       const parsed = customerSchema.parse(data);

       return await prisma.customer.update({
              where: { id: customerId },
              data: {
                     name: parsed.name,
                     dni: parsed.dni,
                     phone: parsed.phone,
                     address: parsed.address,
                     creditLimit: parsed.creditLimit ?? customer.creditLimit,
              },
       });
}

export async function deleteCustomer(customerId: number) {
       const storeId = await getStoreId();

       const customer = await prisma.customer.findUnique({ where: { id: customerId } });
       if (!customer || customer.storeId !== storeId) throw new Error("Cliente no encontrado.");

       // Soft delete
       await prisma.customer.update({
              where: { id: customerId },
              data: { active: false },
       });

       return { success: true };
}


export async function closeCustomerMonth(customerId: number) {
       const storeId = await getStoreId();

       return await prisma.$transaction(async (tx) => {
              const customer = await tx.customer.findUnique({
                     where: { id: customerId }
              });

              if (!customer || customer.storeId !== storeId) {
                     throw new Error("Cliente no encontrado.");
              }

              if (Number(customer.currentBalance) <= 0) {
                     throw new Error("El cliente no tiene deuda actual para cerrar el mes.");
              }

              const amountToMove = customer.currentBalance;

              await tx.customer.update({
                     where: { id: customerId },
                     data: {
                            currentBalance: 0,
                            closedBalance: { increment: amountToMove }
                     }
              });

              await tx.accountMovement.create({
                     data: {
                            customerId,
                            movementType: "MONTH_CLOSE",
                            amount: amountToMove, // Not negative, it's just a refactoring of debt
                            description: "Separación de Cuenta / Cierre de Mes",
                            timestamp: new Date()
                     }
              });

              return true;
       });
}


export async function removeProductFromAccountSale(movementId: number, saleId: number, saleItemId: number) {
       const storeId = await getStoreId();

       return await prisma.$transaction(async (tx) => {
              // 1. Get the sale and verify it belongs to store
              const sale = await tx.sale.findUnique({
                     where: { id: saleId },
                     include: { items: true, customer: true }
              });

              if (!sale || sale.storeId !== storeId || !sale.customerId) {
                     throw new Error("Venta no encontrada o no pertenece a cuenta corriente.");
              }

              // 2. Get the specific item
              const item = sale.items.find(i => i.id === saleItemId);
              if (!item) {
                     throw new Error("Producto no encontrado en esta venta.");
              }

              // 3. Restore stock
              await tx.productVariant.update({
                     where: { id: item.variantId },
                     data: { stockQuantity: { increment: item.quantity } }
              });

              // Stock movement log
              await tx.stockMovement.create({
                     data: {
                            variantId: item.variantId,
                            movementType: "VOID",
                            quantity: item.quantity,
                            reason: `Devolución de ${item.productNameSnapshot} (Venta #${saleId})`
                     }
              });

              // 4. Update Sale Totals
              const newSubtotal = Number(sale.subtotal) - Number(item.subtotal);
              // Simple proportional discount logic or just keep discount fixed? 
              // Usually we just reduce totalAmount by item.subtotal to keep it simple and fair.
              const amountToDeduct = Number(item.subtotal);

              const newTotalAmount = Math.max(0, Number(sale.totalAmount) - amountToDeduct);

              await tx.sale.update({
                     where: { id: saleId },
                     data: {
                            subtotal: newSubtotal,
                            totalAmount: newTotalAmount
                     }
              });

              // 5. Delete or mark the SaleItem
              await tx.saleItem.delete({
                     where: { id: saleItemId }
              });

              // 6. Adjust Customer Balance - deduct the item subtotal
              // First reduce closed balance if needed, but since it's an annulment, 
              // it's a credit in their favor.
              const customer = sale.customer;
              if (customer) {
                     let amountToCredit = amountToDeduct;
                     // We just create an AccountMovement that acts as a payment/credit
                     // But ideally we just reduce currentBalance
                     await tx.customer.update({
                            where: { id: customer.id },
                            data: {
                                   currentBalance: { decrement: amountToCredit }
                            }
                     });

                     await tx.accountMovement.create({
                            data: {
                                   customerId: customer.id,
                                   movementType: "VOID_ITEM",
                                   amount: -amountToCredit,
                                   description: `Devolución: ${item.productNameSnapshot} (Venta #${saleId})`,
                                   timestamp: new Date()
                            }
                     });
              }

              return { success: true };
       });
}

export async function getSaleDetailsForMovement(saleId: number) {
       const storeId = await getStoreId();
       const sale = await prisma.sale.findUnique({
              where: { id: saleId, storeId },
              include: { items: true }
       });
       return safeSerialize(sale);
}

