const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
       try {
              console.log("Checking columns for User table...");
              const columns = await prisma.$queryRaw`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'User'`;
              console.log("Columns:", columns);
       } catch (e) {
              console.error("Failed to list columns:", e);
       } finally {
              await prisma.$disconnect();
       }
}

main();
