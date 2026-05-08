import { cookies } from "next/headers";
import { cache } from "react";
import prisma from "@/lib/prisma";

type SessionUserSnapshot = {
       id: string;
       email: string;
       name: string | null;
       role: string;
       storeId: string | null;
};

const getSessionUserSnapshot = cache(async (): Promise<SessionUserSnapshot | null> => {
       const cookieStore = await cookies();
       const email = cookieStore.get("user_email")?.value;

       if (!email) return null;

       const id = cookieStore.get("user_id")?.value;
       const role = cookieStore.get("user_role")?.value;
       const storeId = cookieStore.get("user_store_id")?.value;
       const name = cookieStore.get("user_name")?.value ?? null;

       // If the cookie snapshot is incomplete, rehydrate from DB so every action
       // resolves the same tenant instead of behaving like a user has no store.
       if (id && role && storeId) {
              return {
                     id,
                     email,
                     name,
                     role,
                     storeId,
              };
       }

       const dbUser = await prisma.user.findUnique({
              where: { email },
              select: { id: true, email: true, name: true, role: true, storeId: true },
       });

       if (dbUser) {
              return dbUser;
       }

       if (id && role) {
              return {
                     id,
                     email,
                     name,
                     role,
                     storeId: storeId || null,
              };
       }

       return null;
});

export async function getStoreId(): Promise<string> {
       try {
              const user = await getSessionUserSnapshot();

              if (user) {
                     if (user.storeId) {
                            return user.storeId;
                     }

                     if (user.role === "SUPERADMIN") {
                            throw new Error("El superadmin no tiene una tienda asociada.");
                     }

                     console.log(`Usuario ${user.email} sin tienda. Creando nueva tienda...`);

                     const randomSlug = Math.random().toString(36).substring(2, 8);
                     const slug = `store-${randomSlug}-${Date.now()}`;

                     const newStore = await prisma.$transaction(async (tx) => {
                            const createdStore = await tx.store.create({
                                   data: {
                                          name: user.name ? `Negocio de ${user.name}` : "Mi Nuevo Negocio",
                                          slug,
                                          isActive: true,
                                   },
                            });

                            await tx.user.update({
                                   where: { id: user.id },
                                   data: { storeId: createdStore.id },
                            });

                            return createdStore;
                     });

                     return newStore.id;
              }

              throw new Error("SEGURIDAD: Usuario no autenticado.");
       } catch (error) {
              console.error("Store Security Error:", error);
              throw new Error("Acceso Denegado: No se pudo verificar la identidad de la tienda.");
       }
}

export async function getStoreName(): Promise<string> {
       try {
              const id = await getStoreId();
              const store = await prisma.store.findUnique({
                     where: { id },
                     select: { name: true },
              });
              return store?.name || "Gestion de Despensas";
       } catch {
              return "Gestion de Despensas";
       }
}

export async function getCurrentUser() {
       try {
              return await getSessionUserSnapshot();
       } catch {
              return null;
       }
}
