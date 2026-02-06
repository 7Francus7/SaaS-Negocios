const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
       try {
              console.log("Searching for all tables related to 'user'...");
              const tables = await prisma.$queryRaw`
                     SELECT table_name 
                     FROM information_schema.tables 
                     WHERE table_name ILIKE '%user%'
              `;
              console.log("Matching tables:", tables);

              for (const table of tables) {
                     console.log(`Columns for ${table.table_name}:`);
                     const columns = await prisma.$queryRawUnsafe(`
                            SELECT column_name 
                            FROM information_schema.columns 
                            WHERE table_name = '${table.table_name}'
                     `);
                     console.log(columns);
              }
       } catch (e) {
              console.error("Failed:", e);
       } finally {
              await prisma.$disconnect();
       }
}

main();
