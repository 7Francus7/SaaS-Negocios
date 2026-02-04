/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
       try {
              console.log("Connecting to DB at", process.env.DATABASE_URL);
              const count = await prisma.cashSession.count();
              console.log("Successfully connected. Session count:", count);
       } catch (e) {
              console.error("Connection failed:", e);
              process.exit(1);
       } finally {
              await prisma.$disconnect();
       }
}

main();
