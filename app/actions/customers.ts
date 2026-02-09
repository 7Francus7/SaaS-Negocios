"use server";

import prisma from "@/lib/prisma";
import { getStoreId } from "@/lib/store";
import { customerSchema } from "@/lib/validations";

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
       const storeId = await getStoreId();

       if (amount <= 0) throw new Error("El monto debe ser mayor a 0.");

       return await prisma.$transaction(async (tx) => {
              const customer = await tx.customer.findUnique({
                     where: { id: customerId },
              });

              if (!customer || customer.storeId !== storeId) {
                     throw new Error("Cliente no encontrado.");
              }

              // Update Balance
              await tx.customer.update({
                     where: { id: customerId },
                     data: {
                            currentBalance: { decrement: amount },
                     },
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
                                          type: "IN",
                                          amount: amount,
                                          description: `Pago Cta Cte: ${customer.name}`,
                                          timestamp: new Date()
                                   }
                            });
                     } else {
                            throw new Error("Debe abrir la caja para recibir pagos en efectivo.");
                     }
              }
              // For other methods (TRANSFERENCIA, DEBITO, etc.), we don't touch the cash box.

              return customer;
       });
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

       return history.map(h => ({
              ...h,
              amount: Number(h.amount)
       }));
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
