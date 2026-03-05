const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
       try {
              const user = await prisma.user.findUnique({ where: { email: 'despensafran@saas.com' } });
              console.log("User:", user);
       } catch (e) {
              console.error("Error is", e);
       } finally {
              await prisma.$disconnect();
       }
}
main();
