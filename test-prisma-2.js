const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
       try {
              const res = await prisma.customer.update({
                     where: { id: 1 },
                     data: {
                            currentBalance: { decrement: -400 } // Test decrement negative
                     }
              });
              console.log("Success", res.currentBalance);
       } catch (e) {
              console.error("PrismaError", e.message);
       } finally {
              await prisma.$disconnect();
       }
}
main();
