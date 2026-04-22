"use server";

import prisma from "@/lib/prisma";
import { getStoreId, getCurrentUser } from "@/lib/store";
import { safeSerialize } from "@/lib/utils";
import bcrypt from "bcryptjs";

export async function getEmployees() {
    const storeId = await getStoreId();
    const currentUser = await getCurrentUser();
    
    if (currentUser?.role === "CASHIER") {
        throw new Error("Acceso denegado: solo el Administrador puede ver empleados.");
    }

    const employees = await prisma.user.findMany({
        where: { storeId },
        select: { id: true, name: true, email: true, role: true, createdAt: true }
    });
    return safeSerialize(employees);
}

export async function createEmployee(data: { name: string, email: string, password: string, role: string }) {
    const storeId = await getStoreId();
    const currentUser = await getCurrentUser();
    
    if (currentUser?.role === "CASHIER") {
        throw new Error("Acceso denegado.");
    }

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
        throw new Error("Ese email ya está registrado.");
    }

    const hash = bcrypt.hashSync(data.password, 10);
    const user = await prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            password: hash,
            role: data.role || "CASHIER",
            storeId
        }
    });

    return safeSerialize(user);
}

export async function deleteEmployee(id: string) {
    const storeId = await getStoreId();
    const currentUser = await getCurrentUser();
    
    if (currentUser?.role === "CASHIER") {
        throw new Error("Acceso denegado.");
    }
    
    if (id === currentUser?.id) {
        throw new Error("No puedes eliminarte a ti mismo.");
    }

    // Verify it belongs to this store
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.storeId !== storeId) {
        throw new Error("Empleado no encontrado.");
    }

    await prisma.user.delete({ where: { id } });
    return true;
}
