const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
       try {
              const customerId = 1;
              const amount = -400;
              const description = "Pago a cuenta";
              const paymentMethod = "EFECTIVO";
              const storeId = "12345"; // placeholder

              // Simulate tx
              const res = await prisma.$transaction(async (tx) => {
                     const customer = await tx.customer.findFirst();
                     if (!customer) throw new Error("No customer");

                     // Apply Payment to currentBalance
                     await tx.customer.update({
                            where: { id: customer.id },
                            data: { currentBalance: { decrement: amount } }
                     });

                     // Log Movement
                     await tx.accountMovement.create({
                            data: {
                                   customerId: customer.id,
                                   movementType: "PAYMENT",
                                   amount: -amount,
                                   description,
                                   paymentMethod,
                                   timestamp: new Date(),
                            }
                     });

                     const session = await tx.cashSession.findFirst();

                     if (session) {
                            await tx.cashMovement.create({
                                   data: {
                                          cashSessionId: session.id,
                                          type: amount > 0 ? "IN" : "OUT",
                                          amount: Math.abs(amount),
                                          description: amount > 0 ? `Pago: ${customer.name}` : `Dev: ${customer.name}`,
                                          timestamp: new Date()
                                   }
                            });
                     }
                     return true;
              });
              console.log("Success", res);
       } catch (e) {
              console.error("PrismaError", e.message);
       } finally {
              await prisma.$disconnect();
       }
}
main();
