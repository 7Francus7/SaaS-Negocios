"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { setSessionCookies } from "@/lib/session-cookies";
import { safeSerialize } from "@/lib/utils";

export async function getSuperAdminStats() {
       try {
              const [storesCount, usersCount, activeStores] = await Promise.all([
                     prisma.store.count(),
                     prisma.user.count(),
                     prisma.store.count({ where: { isActive: true } }),
              ]);

              return {
                     storesCount,
                     usersCount,
                     activeStores,
                     mrr: activeStores * 20000,
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
                            users: {
                                   where: { role: "OWNER" },
                                   take: 1,
                            },
                            _count: {
                                   select: {
                                          users: true,
                                          products: true,
                                          sales: true,
                                   },
                            },
                     },
                     orderBy: { createdAt: "desc" },
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
              if (!data.email || !data.password || !data.storeName) {
                     return { success: false, error: "Faltan datos obligatorios." };
              }

              const normalizedEmail = data.email.toLowerCase().trim();
              const existingUser = await prisma.user.findUnique({
                     where: { email: normalizedEmail },
              });

              if (existingUser) {
                     return { success: false, error: "El email del dueño ya existe." };
              }

              let slug = data.storeName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
              if (!slug) slug = `store-${Math.random().toString(36).substring(7)}`;

              const existingStore = await prisma.store.findUnique({
                     where: { slug },
              });

              if (existingStore) {
                     slug = `${slug}-${Math.random().toString(36).substring(7)}`;
              }

              const passwordHash = bcrypt.hashSync(data.password, 10);

              await prisma.$transaction(async (tx) => {
                     const store = await tx.store.create({
                            data: {
                                   name: data.storeName,
                                   slug,
                                   isActive: true,
                            },
                     });

                     await tx.user.create({
                            data: {
                                   name: data.ownerName,
                                   email: normalizedEmail,
                                   password: passwordHash,
                                   role: "OWNER",
                                   storeId: store.id,
                            },
                     });
              });

              revalidatePath("/dashboard/admin");
              return { success: true };
       } catch (error: unknown) {
              console.error("Error critico en createTenant:", error);
              return {
                     success: false,
                     error: error instanceof Error
                            ? error.message
                            : "Error interno al crear el tenant. Verifique la conexion a la base de datos.",
              };
       }
}

export async function deleteTenant(storeId: string) {
       try {
              await prisma.store.delete({
                     where: { id: storeId },
              });
              revalidatePath("/dashboard/admin");
              return { success: true };
       } catch {
              return { success: false, error: "Error al eliminar tenant" };
       }
}

export async function updateTenant(storeId: string, data: { name: string; isActive: boolean }) {
       try {
              await prisma.store.update({
                     where: { id: storeId },
                     data: {
                            name: data.name,
                            isActive: data.isActive,
                     },
              });
              revalidatePath("/dashboard/admin");
              return { success: true };
       } catch {
              return { success: false, error: "Error al actualizar tenant" };
       }
}

export async function impersonateTenant(storeSlug: string) {
       try {
              const store = await prisma.store.findUnique({
                     where: { slug: storeSlug },
                     include: {
                            users: {
                                   where: { role: "OWNER" },
                                   take: 1,
                            },
                     },
              });

              if (!store || !store.users[0]) {
                     return { success: false, error: "No se encontro un administrador para este negocio." };
              }

              const owner = store.users[0];
              await setSessionCookies({
                     email: owner.email,
                     id: owner.id,
                     role: owner.role,
                     storeId: store.id,
                     name: owner.name,
              });

              return { success: true };
       } catch (error) {
              console.error("Error impersonating:", error);
              return { success: false, error: "Error al intentar acceder." };
       }
}
