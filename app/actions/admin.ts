"use server";

import prisma from "@/lib/prisma";
import { safeSerialize } from "@/lib/utils";
import { revalidatePath } from "next/cache";

import bcrypt from "bcryptjs";

// --- USERS ---

export async function getSystemUsers() {
       try {
              const users = await prisma.user.findMany({
                     include: {
                            store: true,
                     },
                     orderBy: {
                            createdAt: 'desc',
                     },
              });
              return { success: true, data: safeSerialize(users) };
       } catch (error) {
              console.error("Error fetching system users:", error);
              return { success: false, error: "Error al obtener usuarios" };
       }
}

export async function createSystemUser(data: {
       name: string;
       email: string;
       password?: string;
       role: string;
       storeId?: string;
}) {
       try {
              const existingUser = await prisma.user.findUnique({
                     where: { email: data.email },
              });

              if (existingUser) {
                     return { success: false, error: "El email ya está registrado" };
              }

              const hashedPassword = bcrypt.hashSync(data.password || "123456", 10);

              const user = await prisma.user.create({
                     data: {
                            name: data.name,
                            email: data.email,
                            password: hashedPassword,
                            role: data.role,
                            storeId: data.storeId || null,
                     },
              });

              revalidatePath("/dashboard/admin/users");
              return { success: true, data: safeSerialize(user) };
       } catch (error) {
              console.error("Error creating system user:", error);
              return { success: false, error: "Error al crear usuario" };
       }
}

export async function updateSystemUser(id: string, data: {
       name?: string;
       email?: string;
       role?: string;
       storeId?: string;
       password?: string;
}) {
       try {
              const updateData: any = {
                     ...data,
                     updatedAt: new Date()
              };

              if (data.password) {
                     updateData.password = bcrypt.hashSync(data.password, 10);
              }

              const user = await prisma.user.update({
                     where: { id },
                     data: updateData
              });
              revalidatePath("/dashboard/admin/users");
              return { success: true, data: safeSerialize(user) };
       } catch (error) {
              console.error("Error updating user:", error);
              return { success: false, error: "Error al actualizar usuario" };
       }
}

export async function deleteSystemUser(id: string) {
       try {
              await prisma.user.delete({
                     where: { id }
              });
              revalidatePath("/dashboard/admin/users");
              return { success: true };
       } catch (error) {
              console.error("Error deleting user:", error);
              return { success: false, error: "Error al eliminar usuario" };
       }
}

// --- STORES ---

export async function getSystemStores() {
       try {
              const stores = await prisma.store.findMany({
                     orderBy: { createdAt: 'desc' }
              });
              return { success: true, data: safeSerialize(stores) };
       } catch (error) {
              console.error("Error getting stores:", error);
              return { success: false, error: "Error al obtener tiendas" };
       }
}
