/**
 * Helper to get the current store ID.
 * In the future, this will decode the user session or JWT.
 * For development, we return a fixed ID or fail if none exists.
 */
import prisma from "@/lib/prisma";

export async function getStoreId(): Promise<string> {
       // TODO: Replace with real authentication logic (NextAuth / Clerk)
       // For now, we try to find the first store in the DB, or create one if empty.

       const firstStore = await prisma.store.findFirst();

       if (firstStore) {
              return firstStore.id;
       }

       // Auto-seed for dev experience
       const newStore = await prisma.store.create({
              data: {
                     name: "Tienda Demo",
                     slug: "demo",
                     isActive: true
              }
       });

       return newStore.id;
}
