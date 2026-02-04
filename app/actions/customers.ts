"use server";

import prisma from "@/lib/prisma";
import { getStoreId } from "@/lib/store";

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

       if (!data.name) throw new Error("El nombre es obligatorio.");

       return await prisma.customer.create({
              data: {
                     storeId,
                     name: data.name,
                     dni: data.dni,
                     phone: data.phone,
                     address: data.address,
                     creditLimit: data.creditLimit ?? 0,
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
                            // Warn or throw? For now let's allow receiving money even if box is closed, 
                            // but ideally we should require open box for cash IN.
                            // Let's simple ignore linkage to session if closed, but strictly speaking this hides money.
                            // Better software practice: throw error if cash payment and no box open.
                            throw new Error("Debe abrir la caja para recibir pagos en efectivo.");
                     }
              }

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
