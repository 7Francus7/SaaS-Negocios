"use server";

import prisma from "@/lib/prisma";
import { getStoreId } from "@/lib/store";
import { revalidatePath } from "next/cache";

export async function getSuppliers(search?: string) {
       const storeId = await getStoreId();
       return prisma.supplier.findMany({
              where: {
                     storeId,
                     active: true,
                     name: { contains: search }
              },
              orderBy: { name: 'asc' }
       });
}

export async function createSupplier(data: {
       name: string;
       contact?: string;
       phone?: string;
       email?: string;
       address?: string;
       notes?: string;
}) {
       const storeId = await getStoreId();

       await prisma.supplier.create({
              data: {
                     ...data,
                     storeId
              }
       });

       revalidatePath("/dashboard/suppliers");
}

export async function deleteSupplier(id: number) {
       const storeId = await getStoreId();
       // Soft delete
       await prisma.supplier.update({
              where: { id },
              data: { active: false }
       });
       revalidatePath("/dashboard/suppliers");
}

export async function updateSupplier(id: number, data: {
       name: string;
       contact?: string;
       phone?: string;
       email?: string;
       address?: string;
       notes?: string;
}) {
       const storeId = await getStoreId();

       const supplier = await prisma.supplier.findUnique({ where: { id } });
       if (!supplier || supplier.storeId !== storeId) throw new Error("Proveedor no encontrado.");

       await prisma.supplier.update({
              where: { id },
              data
       });

       revalidatePath("/dashboard/suppliers");
}
