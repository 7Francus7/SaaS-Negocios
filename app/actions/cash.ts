"use server";

import prisma from "@/lib/prisma";
import { getStoreId } from "@/lib/store";

export async function getOpenSession() {
       const storeId = await getStoreId();
       const session = await prisma.cashSession.findFirst({
              where: { storeId, status: "OPEN" },
              orderBy: { startTime: "desc" }
       });

       if (!session) return null;

       return {
              ...session,
              initialCash: Number(session.initialCash),
              finalCashSystem: Number(session.finalCashSystem),
              finalCashReal: Number(session.finalCashReal)
       };
}

export async function openSession(initialCash: number) {
       const storeId = await getStoreId();

       // Check existing
       const existing = await prisma.cashSession.findFirst({
              where: { storeId, status: "OPEN" }
       });

       if (existing) throw new Error("Ya hay una caja abierta.");

       const session = await prisma.cashSession.create({
              data: {
                     storeId,
                     initialCash,
                     finalCashSystem: 0,
                     status: "OPEN",
                     startTime: new Date()
              }
       });

       return {
              ...session,
              initialCash: Number(session.initialCash),
              finalCashSystem: Number(session.finalCashSystem),
              finalCashReal: Number(session.finalCashReal)
       };
}

export async function closeSession(sessionId: number, finalCashReal: number) {
       const storeId = await getStoreId();

       const session = await prisma.cashSession.findUnique({
              where: { id: sessionId }
       });

       if (!session || session.storeId !== storeId) throw new Error("Sesión no válida");
       if (session.status !== "OPEN") throw new Error("La sesión ya está cerrada");

       const updated = await prisma.cashSession.update({
              where: { id: sessionId },
              data: {
                     status: "CLOSED",
                     endTime: new Date(),
                     finalCashReal: finalCashReal
              }
       });

       return {
              ...updated,
              initialCash: Number(updated.initialCash),
              finalCashSystem: Number(updated.finalCashSystem),
              finalCashReal: Number(updated.finalCashReal)
       };
}

export async function getSessionHistory() {
       const storeId = await getStoreId();
       const sessions = await prisma.cashSession.findMany({
              where: { storeId },
              orderBy: { startTime: 'desc' },
              take: 30
       });

       return sessions.map(s => ({
              ...s,
              initialCash: Number(s.initialCash),
              finalCashSystem: Number(s.finalCashSystem),
              finalCashReal: Number(s.finalCashReal)
       }));
}
