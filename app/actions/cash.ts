"use server";

import prisma from "@/lib/prisma";
import { getStoreId } from "@/lib/store";
import { safeSerialize } from "@/lib/utils";

export async function getOpenSession() {
       const storeId = await getStoreId();
       const session = await prisma.cashSession.findFirst({
              where: { storeId, status: "OPEN" },
              orderBy: { startTime: "desc" },
              include: {
                     store: true,
                     movements: {
                            orderBy: { timestamp: 'desc' }
                     }
              }
       });

       if (!session) return null;

       // Calculate current totals on the fly
       const result = await calculateSessionTotals(session.id, storeId, session.startTime);

       return {
              ...safeSerialize(session),
              currentSales: result.totalSales,
              totalIn: result.totalIn,
              totalOut: result.totalOut,
              expectedCash: Number(session.initialCash) + result.totalSales + result.totalIn - result.totalOut
       };
}

async function calculateSessionTotals(sessionId: number, storeId: string, startTime: Date) {
       const [salesAggregate, movementsAggregate] = await Promise.all([
              // Sum only CASH sales created after session start
              prisma.sale.aggregate({
                     where: {
                            storeId,
                            timestamp: { gte: startTime },
                            paymentMethod: "EFECTIVO"
                     },
                     _sum: { totalAmount: true }
              }),
              // Sum Movements
              prisma.cashMovement.groupBy({
                     by: ['type'],
                     where: { cashSessionId: sessionId },
                     _sum: { amount: true }
              })
       ]);

       const totalSales = Number(salesAggregate._sum.totalAmount || 0);

       const totalIn = Number(movementsAggregate.find(m => m.type === 'IN')?._sum.amount || 0);
       const totalOut = Number(movementsAggregate.find(m => m.type === 'OUT')?._sum.amount || 0);

       return { totalSales, totalIn, totalOut };
}

export async function registerCashMovement(amount: number, type: 'IN' | 'OUT', description: string) {
       const session = await getOpenSession();
       if (!session) throw new Error("No hay caja abierta");

       const movement = await prisma.cashMovement.create({
              data: {
                     cashSessionId: session.id,
                     type,
                     amount,
                     description,
                     timestamp: new Date()
              }
       });

       return safeSerialize(movement);
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
                     finalCashSystem: initialCash, // Starts equal to initial
                     status: "OPEN",
                     startTime: new Date()
              }
       });

       return safeSerialize(session);
}

export async function closeSession(sessionId: number, finalCashReal: number, notes?: string) {
       const storeId = await getStoreId();

       const session = await prisma.cashSession.findUnique({
              where: { id: sessionId }
       });

       if (!session || session.storeId !== storeId) throw new Error("Sesión no válida");
       if (session.status !== "OPEN") throw new Error("La sesión ya está cerrada");

       // Calculate final system expected cash
       const totals = await calculateSessionTotals(sessionId, storeId, session.startTime);
       const finalCashSystem = Number(session.initialCash) + totals.totalSales;

       const updated = await prisma.cashSession.update({
              where: { id: sessionId },
              data: {
                     status: "CLOSED",
                     endTime: new Date(),
                     finalCashSystem,
                     finalCashReal,
                     // We could add notes here if we extend the schema, 
                     // but for now we just close it.
              }
       });

       return safeSerialize(updated);
}

export async function getSessionHistory() {
       const storeId = await getStoreId();
       const sessions = await prisma.cashSession.findMany({
              where: { storeId },
              orderBy: { startTime: 'desc' },
              take: 30
       });

       return safeSerialize(sessions);
}
