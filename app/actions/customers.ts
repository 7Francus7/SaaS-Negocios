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
                            await tx.cashSession.update({
                                   where: { id: session.id },
                                   data: {
                                          finalCashSystem: { increment: amount },
                                   },
                            });
                     }
                     // Note: If no session open, we accept the payment but don't log it to cash system (just customer account)
                     // This mimics Python logic where it might just print a warning or fail silently on cash update.
              }

              return customer;
       });
}
