const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
       try {
              const count = await prisma.store.count();
              console.log("Store count:", count);
              const stores = await prisma.store.findMany();
              console.log("Stores:", stores);
       } catch (e) {
              console.error("Failed:", e);
       } finally {
              await prisma.$disconnect();
       }
}

main();
