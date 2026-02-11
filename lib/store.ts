import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export async function getStoreId(): Promise<string> {
       try {
              // 1. Try to get user from cookie
              const cookieStore = await cookies();
              const userEmail = cookieStore.get("user_email")?.value;

              if (userEmail) {
                     const user = await prisma.user.findUnique({
                            where: { email: userEmail },
                            select: { id: true, storeId: true, name: true }
                     });

                     if (user) {
                            // If user is assigned to a store, return it
                            if (user.storeId) {
                                   return user.storeId;
                            }

                            // 2. AUTO-PROVISIONING: If user exists but has no store, create one for them.
                            console.log(`Usuario ${userEmail} sin tienda. Creando nueva tienda...`);

                            // Generate a simple unique slug
                            const randomSlug = Math.random().toString(36).substring(2, 8);
                            const slug = `store-${randomSlug}-${Date.now()}`;

                            // Create the store and associate it with the user
                            const newStore = await prisma.store.create({
                                   data: {
                                          name: user.name ? `Negocio de ${user.name}` : "Mi Nuevo Negocio",
                                          slug: slug,
                                          isActive: true,
                                          users: {
                                                 connect: { id: user.id }
                                          }
                                   }
                            });

                            return newStore.id;
                     }
              }

              // 3. IF NO USER FOUND -> SECURITY ERROR
              // The middleware should have caught this, but this is a second layer of defense.
              throw new Error("❌ SEGURIDAD: Usuario no autenticado.");

       } catch (error) {
              console.error("Store Security Error:", error);
              // Do not return any data if we can't identify the user's store
              throw new Error("Acceso Denegado: No se pudo verificar la identidad de la tienda.");
       }
}

export async function getStoreName(): Promise<string> {
       try {
              const id = await getStoreId();
              const store = await prisma.store.findUnique({
                     where: { id },
                     select: { name: true }
              });
              return store?.name || "Gestión de Despensas";
       } catch (e) {
              return "Gestión de Despensas";
       }
}
