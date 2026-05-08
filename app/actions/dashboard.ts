"use server";

import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getCurrentUser, getStoreId } from "@/lib/store";
import { safeSerialize } from "@/lib/utils";

export async function getPublicStoreInfo() {
       const id = await getStoreId();
       const store = await prisma.store.findUnique({
              where: { id },
              select: { name: true }
       });
       return { name: store?.name || "Mi Negocio" };
}

export async function getDashboardShellInfo() {
       const user = await getCurrentUser();

       if (user?.role === "SUPERADMIN") {
              return {
                     userRole: "SUPERADMIN",
                     storeName: "God Mode",
              };
       }

       const storeInfo = await getPublicStoreInfo();

       return {
              userRole: user?.role || "ADMIN",
              storeName: storeInfo.name,
       };
}

// ... existing code ...

export async function getDashboardStats() {
       try {
              const storeId = await getStoreId();

              const today = new Date();
              today.setHours(0, 0, 0, 0);

              const todayFilter = { storeId, timestamp: { gte: today } };

              const [
                     productsCount,
                     lowStockCount,
                     customersCount,
                     salesAgg,
                     costAgg,
              ] = await Promise.all([
                     prisma.productVariant.count({ where: { storeId, active: true } }),
                     prisma.productVariant.count({
                            where: { storeId, active: true, trackStock: true, stockQuantity: { lte: 5 } }
                     }),
                     prisma.customer.count({ where: { storeId, active: true } }),
                     prisma.sale.aggregate({
                            where: todayFilter,
                            _sum: { totalAmount: true },
                            _count: true,
                     }),
                     prisma.saleItem.aggregate({
                            where: { sale: todayFilter },
                            _sum: { subtotalCost: true },
                     }),
              ]);

              const salesTodayTotal = Number(salesAgg._sum.totalAmount ?? 0);
              const profitToday = salesTodayTotal - Number(costAgg._sum.subtotalCost ?? 0);

              // Find critical Low Stock items for list
               const criticalStockItems = await prisma.productVariant.findMany({
                      where: { storeId, active: true, trackStock: true, stockQuantity: { lte: 5 } },
                      take: 5,
                      select: {
                             id: true,
                             stockQuantity: true,
                             variantName: true,
                             product: {
                                    select: {
                                           name: true,
                                    },
                             },
                      },
                      orderBy: { stockQuantity: 'asc' }
               });

              return safeSerialize({
                     salesTodayTotal,
                     salesCount: salesAgg._count,
                     profitToday,
                     productsCount,
                     lowStockCount,
                     customersCount,
                     criticalStockItems
              });
       } catch (error) {
              console.error("STATS_ERROR:", error);
              return {
                     salesTodayTotal: 0,
                     salesCount: 0,
                     profitToday: 0,
                     productsCount: 0,
                     lowStockCount: 0,
                     customersCount: 0,
                     criticalStockItems: []
              };
       }
}

export type DashboardStats = {
       salesTodayTotal: number;
       salesCount: number;
       profitToday: number;
       productsCount: number;
       lowStockCount: number;
       customersCount: number;
       criticalStockItems: Array<{
              id: number;
              stockQuantity: number;
              variantName: string;
              product: {
                     name: string;
              };
       }>;
};

function buildDashboardRange(range: "7d" | "30d" | "90d" = "7d") {
       const today = new Date();
       const startDate = new Date(today);
       const daysMap = { "7d": 7, "30d": 30, "90d": 90 };
       const days = daysMap[range] || 7;

       startDate.setDate(today.getDate() - days);
       startDate.setHours(0, 0, 0, 0);

       return { today, startDate, days };
}

export async function getDashboardChartData(range: '7d' | '30d' | '90d' = '7d') {
       try {
               const storeId = await getStoreId();
               const { today, startDate, days } = buildDashboardRange(range);
               const rows = await prisma.$queryRaw<Array<{ day: Date; total: string }>>(Prisma.sql`
                      SELECT DATE_TRUNC('day', "timestamp") AS day, COALESCE(SUM("totalAmount"), 0)::text AS total
                      FROM "sales"
                      WHERE "storeId" = ${storeId}
                        AND "timestamp" >= ${startDate}
                      GROUP BY 1
                      ORDER BY 1 ASC
               `);

               const salesByDay: Record<string, number> = {};

              // Initialize keys
              for (let i = days - 1; i >= 0; i--) {
                     const d = new Date();
                     d.setDate(today.getDate() - i);
                     const dayName = d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
                     salesByDay[dayName] = 0;
              }

               rows.forEach((sale) => {
                      const d = new Date(sale.day);
                      const dayName = d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
                      if (salesByDay[dayName] !== undefined) {
                             salesByDay[dayName] += Number(sale.total);
                      }
               });

               const chartData = Object.entries(salesByDay).map(([name, total]) => ({
                      name,
                     total
              }));

              return safeSerialize(chartData);
       } catch (error) {
               console.error("CHART_ERROR:", error);
               return [];
       }
}

export async function getDashboardSnapshot(range: "7d" | "30d" | "90d" = "7d") {
       const [stats, chartData] = await Promise.all([
              getDashboardStats(),
              getDashboardChartData(range),
       ]);

       return safeSerialize({
              stats,
              chartData,
       });
}

export async function getUserRole() {
       const user = await getCurrentUser();
       return user?.role || "ADMIN";
}
