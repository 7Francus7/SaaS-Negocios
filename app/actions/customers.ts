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

                     // Apply Payment: first reduce closedBalance (old debt), then currentBalance
                      const closedBal = Number(customer.closedBalance || 0);
                      const currentBal = Number(customer.currentBalance || 0);
                      
                      let deductFromClosed = 0;
                      let deductFromCurrent = 0;
                      
                      if (amount > 0) {
                             // Positive payment → reduce debt
                             // First pay off old (closed) debt, then current
                             deductFromClosed = Math.min(amount, closedBal);
                             deductFromCurrent = amount - deductFromClosed;
                      } else {
                             // Negative amount (refund/adjustment) → add to current balance
                             deductFromCurrent = amount; // will be negative, so decrement negative = increment
                      }
                      
                      await tx.customer.update({
                             where: { id: customerId },
                             data: {
                                    closedBalance: { decrement: deductFromClosed },
                                    currentBalance: { decrement: deductFromCurrent },
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
                      // Read updated customer balances
                      const updatedCustomer = await tx.customer.findUnique({
                             where: { id: customerId },
                      });

                      return {
                             customerName: customer.name,
                             customerDni: customer.dni,
                             customerPhone: customer.phone,
                             previousClosedBalance: closedBal,
                             previousCurrentBalance: currentBal,
                             paidAmount: amount,
                             paymentMethod,
                             deductedFromClosed: deductFromClosed,
                             deductedFromCurrent: deductFromCurrent,
                             remainingClosedBalance: Number(updatedCustomer?.closedBalance || 0),
                             remainingCurrentBalance: Number(updatedCustomer?.currentBalance || 0),
                             timestamp: new Date().toISOString(),
                      };
               });

               return { success: true, count: 1, receiptData: result };
       } catch (error: any) {
              console.error("registerPayment error:", error);
              return { error: error.message || "Error procesando el pago." };
       }
}

/**
 * Returns customer history grouped by month periods.
 * Each month group contains movements between MONTH_CLOSE events.
 * The current (open) month is always the first group.
 */
export async function getCustomerHistoryByMonth(customerId: number) {
       const storeId = await getStoreId();

       const customer = await prisma.customer.findUnique({ where: { id: customerId } });
       if (!customer || customer.storeId !== storeId) return { months: [], customer: null };

       // Get ALL movements (no limit) sorted chronologically
       const allMovements = await prisma.accountMovement.findMany({
              where: { customerId },
              orderBy: { timestamp: "asc" },
       });

       // Extract sale IDs for product details
       const saleIds: number[] = [];
       for (const h of allMovements) {
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

       const enrichMovement = (h: any) => {
              const match = h.description?.match(/Venta #(\d+)/);
              const sale = match ? salesMap.get(parseInt(match[1])) : undefined;
              return {
                     ...h,
                     amount: Number(h.amount),
                     saleItems: (sale?.items || []).map((item: any) => ({
                            id: item.id,
                            productNameSnapshot: item.productNameSnapshot,
                            quantity: Number(item.quantity),
                            unitPrice: Number(item.unitPrice),
                            subtotal: Number(item.subtotal),
                     }))
              };
       };

       // Group movements by month using MONTH_CLOSE as boundary
       const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
              "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

       interface MonthGroup {
              label: string;
              monthKey: string; // "YYYY-MM" 
              movements: any[];
              total: number;
              isCurrent: boolean;
       }

       const months: MonthGroup[] = [];
       let currentGroupMovements: any[] = [];
       let currentGroupStartDate: Date | null = null;

       for (const mov of allMovements) {
              if (mov.movementType === "MONTH_CLOSE") {
                     // Save the accumulated group as a closed month
                     if (currentGroupMovements.length > 0 || true) {
                            const closeDate = new Date(mov.timestamp);
                            const monthLabel = `${monthNames[closeDate.getMonth()]} ${closeDate.getFullYear()}`;
                            const monthKey = `${closeDate.getFullYear()}-${String(closeDate.getMonth() + 1).padStart(2, '0')}`;
                            
                            const enrichedMovements = currentGroupMovements.map(enrichMovement);
                            const total = enrichedMovements.reduce((sum: number, m: any) => sum + m.amount, 0);

                            months.push({
                                   label: monthLabel,
                                   monthKey,
                                   movements: enrichedMovements,
                                   total,
                                   isCurrent: false,
                            });
                     }
                     currentGroupMovements = [];
                     currentGroupStartDate = new Date(mov.timestamp);
              } else {
                     currentGroupMovements.push(mov);
              }
       }

       // The remaining movements are the "current" open month
       const now = new Date();
       const currentMonthLabel = `${monthNames[now.getMonth()]} ${now.getFullYear()} (Actual)`;
       const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
       
       const enrichedCurrent = currentGroupMovements.map(enrichMovement);
       const currentTotal = enrichedCurrent.reduce((sum: number, m: any) => sum + m.amount, 0);

       months.push({
              label: currentMonthLabel,
              monthKey: currentMonthKey,
              movements: enrichedCurrent,
              total: currentTotal,
              isCurrent: true,
       });

       // Reverse so current month is first, oldest months last
       months.reverse();

       return {
              months,
              customer: {
                     id: customer.id,
                     name: customer.name,
                     dni: customer.dni,
                     phone: customer.phone,
                     address: customer.address,
                     currentBalance: Number(customer.currentBalance),
                     closedBalance: Number(customer.closedBalance || 0),
                     creditLimit: Number(customer.creditLimit),
              }
       };
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

/**
 * Cierre automático de cuentas corrientes.
 * Se ejecuta al cargar la app: si hoy es el último día del mes (o si ya pasó
 * el último día y no se cerró), cierra todas las cuentas corrientes con deuda 
 * positiva, moviendo currentBalance → closedBalance.
 */
export async function autoCloseMonthlyAccounts() {
        const storeId = await getStoreId();
        const now = new Date();
        
        // Calcular el último día del mes actual
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const currentDay = now.getDate();
        
        // Solo ejecutar el último día del mes
        if (currentDay !== lastDayOfMonth) {
                return { executed: false, reason: "No es el último día del mes." };
        }
        
        // Verificar si ya se ejecutó este mes usando StoreSetting
        const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const lastCloseRecord = await prisma.storeSetting.findUnique({
                where: { storeId_key: { storeId, key: "last_auto_month_close" } }
        });
        
        if (lastCloseRecord && lastCloseRecord.value === monthKey) {
                return { executed: false, reason: "Ya se cerró este mes." };
        }
        
        // Obtener todos los clientes con deuda actual positiva
        const customersWithDebt = await prisma.customer.findMany({
                where: {
                        storeId,
                        active: true,
                        currentBalance: { gt: 0 }
                }
        });
        
        if (customersWithDebt.length === 0) {
                // Marcar como cerrado aunque no haya deudas
                await prisma.storeSetting.upsert({
                        where: { storeId_key: { storeId, key: "last_auto_month_close" } },
                        update: { value: monthKey },
                        create: { storeId, key: "last_auto_month_close", value: monthKey, description: "Último cierre automático de cuentas corrientes" }
                });
                return { executed: true, closed: 0, reason: "No hay clientes con deuda para cerrar." };
        }
        
        // Cerrar cada cuenta en una transacción
        const closedCount = await prisma.$transaction(async (tx) => {
                let count = 0;
                
                const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
                const monthName = monthNames[now.getMonth()];
                
                for (const customer of customersWithDebt) {
                        const amountToMove = customer.currentBalance;
                        
                        await tx.customer.update({
                                where: { id: customer.id },
                                data: {
                                        currentBalance: 0,
                                        closedBalance: { increment: amountToMove }
                                }
                        });
                        
                        await tx.accountMovement.create({
                                data: {
                                        customerId: customer.id,
                                        movementType: "MONTH_CLOSE",
                                        amount: amountToMove,
                                        description: `Cierre Automático de ${monthName} ${now.getFullYear()}`,
                                        timestamp: new Date()
                                }
                        });
                        
                        count++;
                }
                
                return count;
        });
        
        // Registrar que ya se hizo el cierre de este mes
        await prisma.storeSetting.upsert({
                where: { storeId_key: { storeId, key: "last_auto_month_close" } },
                update: { value: monthKey },
                create: { storeId, key: "last_auto_month_close", value: monthKey, description: "Último cierre automático de cuentas corrientes" }
        });
        
        return { executed: true, closed: closedCount };
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

