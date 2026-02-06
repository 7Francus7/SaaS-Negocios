const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function createTenant(data) {
       try {
              console.log("Creating tenant...");
              let slug = data.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
              if (!slug) slug = 'store-' + Math.random().toString(36).substring(7);

              const passwordHash = bcrypt.hashSync(data.password, 10);

              await prisma.$transaction(async (tx) => {
                     const store = await tx.store.create({
                            data: {
                                   name: data.storeName,
                                   slug: slug,
                                   isActive: true
                            }
                     });

                     await tx.user.create({
                            data: {
                                   name: data.ownerName,
                                   email: data.email,
                                   password: passwordHash,
                                   role: "OWNER",
                                   storeId: store.id
                            }
                     });
              });
              console.log("Success!");
       } catch (e) {
              console.error("Error:", e);
       } finally {
              await prisma.$disconnect();
       }
}

createTenant({
       storeName: "Negocio Real",
       ownerName: "Admin",
       email: "admin-real@example.com",
       password: "password123"
});
