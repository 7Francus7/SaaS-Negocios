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
                            select: { storeId: true }
                     });

                     if (user && user.storeId) {
                            return user.storeId;
                     }

                     // If user exists but no storeId, we'll continue to fallback logic
                     console.log(`User ${userEmail} has no storeId assigned.`);
              }

              // 2. Fallback: Return first store found
              const firstStore = await prisma.store.findFirst();

              if (firstStore) {
                     return firstStore.id;
              }

              // 3. Only create if absolutely necessary (first time setup)
              console.log("No store found, creating default Tienda Demo...");
              const newStore = await prisma.store.create({
                     data: {
                            name: "Tienda Demo",
                            slug: `demo-${Math.random().toString(36).substring(7)}`,
                            isActive: true
                     }
              });

              return newStore.id;
       } catch (error) {
              console.error("Store Helper Error:", error);

              // Absolute last resort: try to find ANY store without user context
              try {
                     const store = await prisma.store.findFirst();
                     if (store) return store.id;
              } catch (dbError) {
                     console.error("Database connection failed during fallback:", dbError);
              }

              throw new Error("No se pudo identificar una tienda activa. Por favor, contacte a soporte si el problema persiste.");
       }
}

export async function getStoreName(): Promise<string> {
       try {
              const id = await getStoreId();
              const store = await prisma.store.findUnique({
                     where: { id },
                     select: { name: true }
              });
              return store?.name || "Despensa SaaS";
       } catch (e) {
              return "Despensa SaaS";
       }
}
