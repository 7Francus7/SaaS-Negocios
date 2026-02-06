const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
       try {
              console.log("Starting creation test...");
              const store = await prisma.store.create({
                     data: {
                            name: "Test Store",
                            slug: "test-store-" + Math.random().toString(36).substring(7),
                            isActive: true
                     }
              });
              console.log("Store created:", store.id);

              const passwordHash = bcrypt.hashSync("password123", 10);
              const user = await prisma.user.create({
                     data: {
                            name: "Test User",
                            email: "test-" + Math.random().toString(36).substring(7) + "@example.com",
                            password: passwordHash,
                            role: "OWNER",
                            storeId: store.id
                     }
              });
              console.log("User created:", user.id);
       } catch (e) {
              console.error("Failed to create:", e);
       } finally {
              await prisma.$disconnect();
       }
}

main();
