/**
 * Helper to get the current store ID.
 * In the future, this will decode the user session or JWT.
 * For development, we return a fixed ID or fail if none exists.
 */
import prisma from "@/lib/prisma";

export async function getStoreId(): Promise<string> {
       try {
              const firstStore = await prisma.store.findFirst();

              if (firstStore) {
                     return firstStore.id;
              }

              // Auto-seed for dev experience
              // Try to create, if it fails (race condition), find again
              const newStore = await prisma.store.create({
                     data: {
                            name: "Tienda Demo",
                            slug: `demo-${Math.random().toString(36).substring(7)}`, // Unique slug to avoid collisions
                            isActive: true
                     }
              });

              return newStore.id;
       } catch (error) {
              console.error("Store Helper Error:", error);
              const store = await prisma.store.findFirst();
              if (store) return store.id;
              throw new Error("No se pudo identificar o crear una tienda activa.");
       }
}
