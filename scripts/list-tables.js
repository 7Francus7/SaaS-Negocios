const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
       try {
              console.log("Checking tables...");
              const tables = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
              console.log("Tables:", tables);
       } catch (e) {
              console.error("Failed to list tables:", e);
       } finally {
              await prisma.$disconnect();
       }
}

main();
