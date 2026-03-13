"use server";

import prisma from "@/lib/prisma";
import { getStoreId } from "@/lib/store";
import { safeSerialize } from "@/lib/utils";

export async function checkHasOpenSession() {
       const storeId = await getStoreId();
       const session = await prisma.cashSession.findFirst({
              where: { storeId, status: "OPEN" },
              select: { id: true }
       });
       return !!session;
}

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

async function generateSessionSummary(sessionId: number, storeId: string, startTime: Date, endTime: Date) {
       // Get all sales for this session's time range
       const sales = await prisma.sale.findMany({
              where: {
                     storeId,
                     timestamp: { gte: startTime, lte: endTime }
              },
              include: {
                     payments: true
              }
       });

       // Get all movements
       const movements = await prisma.cashMovement.findMany({
              where: { cashSessionId: sessionId }
       });

       const salesByMethod: Record<string, number> = {};
       let totalSalesValue = 0;

       sales.forEach(sale => {
              totalSalesValue += Number(sale.totalAmount);
              
              // Use specific payments if they exist, otherwise fallback to the sale's paymentMethod
              if (sale.payments && sale.payments.length > 0) {
                     sale.payments.forEach(p => {
                            salesByMethod[p.paymentMethod] = (salesByMethod[p.paymentMethod] || 0) + Number(p.amount);
                     });
              } else {
                     salesByMethod[sale.paymentMethod] = (salesByMethod[sale.paymentMethod] || 0) + Number(sale.totalAmount);
              }
       });

       const income = movements.filter(m => m.type === 'IN').reduce((acc, m) => acc + Number(m.amount), 0);
       const expenses = movements.filter(m => m.type === 'OUT').reduce((acc, m) => acc + Number(m.amount), 0);

       return {
              totalSales: totalSalesValue,
              salesCount: sales.length,
              salesByMethod,
              cashIn: income,
              cashOut: expenses,
              movementsCount: movements.length,
              generatedAt: endTime
       };
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
       const finalCashSystem = Number(session.initialCash) + totals.totalSales + totals.totalIn - totals.totalOut;
       const endTime = new Date();

       // Generate detailed summary
       const summary = await generateSessionSummary(sessionId, storeId, session.startTime, endTime);

       const updated = await prisma.cashSession.update({
              where: { id: sessionId },
              data: {
                     status: "CLOSED",
                     endTime,
                     finalCashSystem,
                     finalCashReal,
                     summary: summary as any,
                     notes: notes || null
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
