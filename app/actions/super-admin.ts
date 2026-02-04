"use server";

import prisma from "@/lib/prisma";
import { safeSerialize } from "@/lib/utils";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function getSuperAdminStats() {
       try {
              const [storesCount, usersCount, activeStores] = await Promise.all([
                     prisma.store.count(),
                     prisma.user.count(),
                     prisma.store.count({ where: { isActive: true } })
              ]);

              // Mock MRR for now (e.g. $20k per active store)
              const mrr = activeStores * 20000;

              return {
                     storesCount,
                     usersCount,
                     activeStores,
                     mrr
              };
       } catch (error) {
              console.error("Error getting admin stats:", error);
              return { storesCount: 0, usersCount: 0, activeStores: 0, mrr: 0 };
       }
}

export async function getTenants() {
       try {
              const stores = await prisma.store.findMany({
                     include: {
                            users: { // Get owner to show
                                   where: { role: 'OWNER' },
                                   take: 1
                            },
                            _count: {
                                   select: {
                                          users: true,
                                          products: true,
                                          sales: true
                                   }
                            }
                     },
                     orderBy: { createdAt: 'desc' }
              });
              return safeSerialize(stores);
       } catch (error) {
              console.error("Error getting tenants:", error);
              return [];
       }
}

export async function createTenant(data: {
       storeName: string;
       plan: string;
       ownerName: string;
       email: string;
       password: string;
}) {
       try {
              // 1. Check if email exists
              const existingUser = await prisma.user.findUnique({
                     where: { email: data.email }
              });
              if (existingUser) return { success: false, error: "El email del dueño ya existe." };

              // 2. Check if slug exists (simple slug generation)
              const slug = data.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
              const existingStore = await prisma.store.findUnique({
                     where: { slug }
              });
              if (existingStore) return { success: false, error: "El nombre del negocio genera un slug duplicado." };

              // 3. Transaction: Create Store + User
              const passwordHash = bcrypt.hashSync(data.password, 10);

              const result = await prisma.$transaction(async (tx) => {
                     const store = await tx.store.create({
                            data: {
                                   name: data.storeName,
                                   slug: slug, // In real app, ensure uniqueness with suffix
                                   isActive: true
                            }
                     });

                     const user = await tx.user.create({
                            data: {
                                   name: data.ownerName,
                                   email: data.email,
                                   password: passwordHash,
                                   role: "OWNER",
                                   storeId: store.id
                            }
                     });

                     return { store, user };
              });

              revalidatePath("/dashboard/admin");
              return { success: true, data: safeSerialize(result) };

       } catch (error) {
              console.error("Create Tenant Error:", error);
              return { success: false, error: "Error al crear el tenant." };
       }
}

export async function deleteTenant(storeId: string) {
       try {
              await prisma.store.delete({
                     where: { id: storeId }
              });
              revalidatePath("/dashboard/admin");
              return { success: true };
       } catch (error) {
              return { success: false, error: "Error al eliminar tenant" };
       }
}
