"use server";

import prisma from "@/lib/prisma";
import { getStoreId } from "@/lib/store";
import { safeSerialize } from "@/lib/utils";

export async function getDashboardStats() {
       try {
              const storeId = await getStoreId();

              const today = new Date();
              today.setHours(0, 0, 0, 0);

              const [
                     salesToday,
                     productsCount,
                     lowStockCount,
                    rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr customersCount
              ] = await Promise.all([
                     // Sales Today
                     prisma.sale.aggregate({
                            where: {
                                   storeId,
                                   timestamp: { gte: today }
                            },
                            _sum: { totalAmount: true },
                            _count: true
                     }),
                     // Total Products
                     prisma.productVariant.count({
                            where: { storeId, active: true }
                     }),
                     // Low Stock
                     prisma.productVariant.count({
                            where: {
                                   storeId,
                                   active: true,
                                   stockQuantity: { lte: 5 }
                            }
                     }),
                     // Customers
                     prisma.customer.count({
                            where: { storeId, active: true }
                     })
              ]);

              // Find critical Low Stock items for list
              const criticalStockItems = await prisma.productVariant.findMany({
                     where: { storeId, active: true, stockQuantity: { lte: 5 } },
                     take: 5,
                     include: { product: true },
                     orderBy: { stockQuantity: 'asc' }
              });

              return safeSerialize({
                     salesTodayTotal: Number(salesToday._sum.totalAmount || 0),
                     salesCount: salesToday._count,
                     productsCount,
                     lowStockCount,
                     customersCount,
                     criticalStockItems
              });
       } catch (error) {
              console.error("STATS_ERROR:", error);
              throw new Error("No se pudieron cargar las estadísticas del servidor.");
       }
}

export type DashboardStats = {
       salesTodayTotal: number;
       salesCount: number;
       productsCount: number;
       lowStockCount: number;
       customersCount: number;
       criticalStockItems: any[]; // Using any for simplicity in return type after serialization
};

export async function getDashboardChartData(range: '7d' | '30d' | '90d' = '7d') {
       try {
              const storeId = await getStoreId();
              const today = new Date();
              const startDate = new Date(today);

              const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
              const days = daysMap[range] || 7;

              startDate.setDate(today.getDate() - days);
              startDate.setHours(0, 0, 0, 0);

              const sales = await prisma.sale.findMany({
                     where: {
                            storeId,
                            timestamp: { gte: startDate }
                     },
                     select: {
                            timestamp: true,
                            totalAmount: true
                     }
              });

              const salesByDay: Record<string, number> = {};

              // Initialize keys
              for (let i = days - 1; i >= 0; i--) {
                     const d = new Date();
                     d.setDate(today.getDate() - i);
                     const dayName = d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
                     salesByDay[dayName] = 0;
              }

              sales.forEach(sale => {
                     const d = new Date(sale.timestamp);
                     const dayName = d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
                     if (salesByDay[dayName] !== undefined) {
                            salesByDay[dayName] += Number(sale.totalAmount);
                     }
              });

              const chartData = Object.entries(salesByDay).map(([name, total]) => ({
                     name,
                     total
              }));

              return safeSerialize(chartData);
       } catch (error) {
              console.error("CHART_ERROR:", error);
              throw new Error("No se pudieron cargar los datos del gráfico.");
       }
}

