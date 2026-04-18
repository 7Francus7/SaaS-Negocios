"use server";

import prisma from "@/lib/prisma";
import { getStoreId } from "@/lib/store";
import { safeSerialize } from "@/lib/utils";
import type { EntryType, EntryCategory, PaymentMethod } from "@/lib/cashbook-constants";

export interface CashBookEntryData {
  date: string;
  type: EntryType;
  category: EntryCategory;
  amount: number;
  description?: string;
  method: PaymentMethod;
  reference?: string;
}

export interface GetEntriesFilter {
  dateFrom?: string;
  dateTo?: string;
  type?: string;
  category?: string;
  method?: string;
}

export async function getCashBookEntries(filter: GetEntriesFilter = {}) {
  const storeId = await getStoreId();
  const { dateFrom, dateTo, type, category, method } = filter;

  const where: Record<string, unknown> = { storeId };

  if (dateFrom || dateTo) {
    const dateFilter: Record<string, Date> = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }
    where.date = dateFilter;
  }
  if (type) where.type = type;
  if (category) where.category = category;
  if (method) where.method = method;

  const entries = await prisma.cashBookEntry.findMany({
    where,
    orderBy: { date: "desc" },
    take: 300,
  });

  return entries.map(e => ({
    ...e,
    date: e.date.toISOString(),
    amount: Number(e.amount),
  }));
}

export async function createCashBookEntry(data: CashBookEntryData) {
  const storeId = await getStoreId();

  const entry = await prisma.cashBookEntry.create({
    data: {
      storeId,
      date: new Date(data.date),
      type: data.type,
      category: data.category,
      amount: data.amount,
      description: data.description || null,
      method: data.method,
      reference: data.reference || null,
    },
  });

  return safeSerialize(entry);
}

export async function updateCashBookEntry(
  id: number,
  data: Partial<CashBookEntryData>
) {
  const storeId = await getStoreId();

  const existing = await prisma.cashBookEntry.findUnique({ where: { id } });
  if (!existing || existing.storeId !== storeId)
    throw new Error("Movimiento no encontrado");

  const updated = await prisma.cashBookEntry.update({
    where: { id },
    data: {
      ...(data.date && { date: new Date(data.date) }),
      ...(data.type && { type: data.type }),
      ...(data.category && { category: data.category }),
      ...(data.amount !== undefined && { amount: data.amount }),
      ...(data.description !== undefined && {
        description: data.description || null,
      }),
      ...(data.method && { method: data.method }),
      ...(data.reference !== undefined && {
        reference: data.reference || null,
      }),
    },
  });

  return safeSerialize(updated);
}

export async function deleteCashBookEntry(id: number) {
  const storeId = await getStoreId();

  const existing = await prisma.cashBookEntry.findUnique({ where: { id } });
  if (!existing || existing.storeId !== storeId)
    throw new Error("Movimiento no encontrado");

  await prisma.cashBookEntry.delete({ where: { id } });
  return { success: true };
}

export async function getDashboardStats() {
  const storeId = await getStoreId();

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );

  const [todayIn, todayOut, monthIn, monthOut, allIn, allOut] =
    await Promise.all([
      prisma.cashBookEntry.aggregate({
        where: {
          storeId,
          type: "INGRESO",
          date: { gte: todayStart, lte: todayEnd },
        },
        _sum: { amount: true },
      }),
      prisma.cashBookEntry.aggregate({
        where: {
          storeId,
          type: "EGRESO",
          date: { gte: todayStart, lte: todayEnd },
        },
        _sum: { amount: true },
      }),
      prisma.cashBookEntry.aggregate({
        where: {
          storeId,
          type: "INGRESO",
          date: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      }),
      prisma.cashBookEntry.aggregate({
        where: {
          storeId,
          type: "EGRESO",
          date: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      }),
      prisma.cashBookEntry.aggregate({
        where: { storeId, type: "INGRESO" },
        _sum: { amount: true },
      }),
      prisma.cashBookEntry.aggregate({
        where: { storeId, type: "EGRESO" },
        _sum: { amount: true },
      }),
    ]);

  const ingresosHoy = Number(todayIn._sum.amount || 0);
  const egresosHoy = Number(todayOut._sum.amount || 0);

  return {
    ingresosHoy,
    egresosHoy,
    balanceDia: ingresosHoy - egresosHoy,
    ingresosMes: Number(monthIn._sum.amount || 0),
    egresosMes: Number(monthOut._sum.amount || 0),
    balanceTotal:
      Number(allIn._sum.amount || 0) - Number(allOut._sum.amount || 0),
  };
}

export async function getMonthlyChartData(year: number) {
  const storeId = await getStoreId();

  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59, 999);

  const entries = await prisma.cashBookEntry.findMany({
    where: { storeId, date: { gte: start, lte: end } },
    select: { date: true, type: true, amount: true },
  });

  const MONTHS = [
    "Ene","Feb","Mar","Abr","May","Jun",
    "Jul","Ago","Sep","Oct","Nov","Dic",
  ];
  const months = MONTHS.map((m) => ({ month: m, ingresos: 0, egresos: 0 }));

  entries.forEach((e) => {
    const idx = new Date(e.date).getMonth();
    if (e.type === "INGRESO") months[idx].ingresos += Number(e.amount);
    else months[idx].egresos += Number(e.amount);
  });

  return months;
}

export async function getBalanceBefore(dateStr?: string) {
  // No date filter = showing all entries from the start, so starting balance is 0
  if (!dateStr) return 0;

  const storeId = await getStoreId();
  const where = { storeId, date: { lt: new Date(dateStr) } };

  const [inAgg, outAgg] = await Promise.all([
    prisma.cashBookEntry.aggregate({ where: { ...where, type: "INGRESO" }, _sum: { amount: true } }),
    prisma.cashBookEntry.aggregate({ where: { ...where, type: "EGRESO" }, _sum: { amount: true } }),
  ]);

  return Number(inAgg._sum.amount || 0) - Number(outAgg._sum.amount || 0);
}

export async function getDailySummary(dateStr?: string) {
  const storeId = await getStoreId();
  const target = dateStr ? new Date(dateStr) : new Date();

  const start = new Date(target);
  start.setHours(0, 0, 0, 0);
  const end = new Date(target);
  end.setHours(23, 59, 59, 999);

  const [dayIn, dayOut, prevIn, prevOut, dayEntries] = await Promise.all([
    prisma.cashBookEntry.aggregate({
      where: { storeId, type: "INGRESO", date: { gte: start, lte: end } },
      _sum: { amount: true },
    }),
    prisma.cashBookEntry.aggregate({
      where: { storeId, type: "EGRESO", date: { gte: start, lte: end } },
      _sum: { amount: true },
    }),
    prisma.cashBookEntry.aggregate({
      where: { storeId, type: "INGRESO", date: { lt: start } },
      _sum: { amount: true },
    }),
    prisma.cashBookEntry.aggregate({
      where: { storeId, type: "EGRESO", date: { lt: start } },
      _sum: { amount: true },
    }),
    prisma.cashBookEntry.findMany({
      where: { storeId, date: { gte: start, lte: end } },
      orderBy: { date: "asc" },
    }),
  ]);

  const saldoApertura =
    Number(prevIn._sum.amount || 0) - Number(prevOut._sum.amount || 0);
  const totalIngresos = Number(dayIn._sum.amount || 0);
  const totalEgresos = Number(dayOut._sum.amount || 0);

  return {
    saldoApertura,
    totalIngresos,
    totalEgresos,
    saldoCierre: saldoApertura + totalIngresos - totalEgresos,
    entries: safeSerialize(dayEntries),
  };
}
