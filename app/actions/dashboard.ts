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
                     productsCount,
                     lowStockCount,
                     customersCount,
                     salesTodayDetailed
              ] = await Promise.all([
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
                     }),
                     // Sales Today for specific logic
                     prisma.sale.findMany({
                            where: {
                                   storeId,
                                   timestamp: { gte: today }
                            },
                            include: {
                                   items: true
                            }
                     }) as Promise<any[]>
              ]);

              const salesTodayTotal = (salesTodayDetailed as any[]).reduce((sum: number, s: any) => sum + Number(s.totalAmount || 0), 0);

              const profitToday = (salesTodayDetailed as any[]).reduce((acc: number, sale: any) => {
                     const cost = (sale.items || []).reduce((sum: number, item: any) => sum + Number(item.subtotalCost || 0), 0);
                     return acc + (Number(sale.totalAmount || 0) - cost);
              }, 0);

              // Find critical Low Stock items for list
              const criticalStockItems = await prisma.productVariant.findMany({
                     where: { storeId, active: true, stockQuantity: { lte: 5 } },
                     take: 5,
                     include: { product: true },
                     orderBy: { stockQuantity: 'asc' }
              });

              return safeSerialize({
                     salesTodayTotal,
                     salesCount: salesTodayDetailed.length,
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
       criticalStockItems: any[];
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
              return [];
       }
}
