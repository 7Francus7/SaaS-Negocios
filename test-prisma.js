const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
       try {
              const res = await prisma.customer.update({
                     where: { id: 1 },
                     data: {
                            currentBalance: { decrement: -400 },
                            closedBalance: { decrement: 0 }
                     }
              });
              console.log("Success", res);
       } catch (e) {
              console.error("Error is", e);
       } finally {
              await prisma.$disconnect();
       }
}
main();
