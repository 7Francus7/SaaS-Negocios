"use server";

import prisma from "@/lib/prisma";
import { getStoreId } from "@/lib/store";

export async function getDashboardStats() {
       const storeId = await getStoreId();

       const today = new Date();
       today.setHours(0, 0, 0, 0);

       const [
              salesToday,
              productsCount,
              lowStockCount,
              customersCount
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
                            stockQuantity: { lte: 5 } // Hardcoded 5 or field logic? Ideally field.
                            // stockQuantity: { lte: prisma.productVariant.fields.minStock } // Prisma doesn't support col comparison easily yet in standard where
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

       // Serialize Decimals for Client Component
       const serializedCriticalItems = criticalStockItems.map(item => ({
              ...item,
              costPrice: Number(item.costPrice),
              salePrice: Number(item.salePrice),
              product: item.product // Product has no decimals
       }));

       return {
              salesTodayTotal: Number(salesToday._sum.totalAmount || 0),
              salesCount: salesToday._count,
              productsCount,
              lowStockCount,
              customersCount,
              criticalStockItems: serializedCriticalItems
       };
}

export type DashboardStats = {
       salesTodayTotal: number;
       salesCount: number;
       productsCount: number;
       lowStockCount: number;
       customersCount: number;
       criticalStockItems: (
              Omit<import("@prisma/client").ProductVariant, "costPrice" | "salePrice"> & {
                     costPrice: number;
                     salePrice: number;
                     product: import("@prisma/client").Product
              }
       )[];
};

export async function getDashboardChartData(range: '7d' | '30d' | '90d' = '7d') {
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

       for (let i = days - 1; i >= 0; i--) {
              const d = new Date();
              d.setDate(today.getDate() - i);
              const dayName = d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });

              const key = dayName; // Just simplify key
              salesByDay[key] = 0;
       }

       sales.forEach(sale => {
              const d = new Date(sale.timestamp);
              const dayName = d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
              const key = dayName;

              // Since locale date string ensures consistency, we rely on it.
              // We'll init if missing (e.g. slight mismatch) or just accumulate on matching keys
              if (salesByDay[key] !== undefined) {
                     salesByDay[key] += Number(sale.totalAmount);
              } else {
                     // Fallback for edge cases or if keys dont match exactly due to timezones
                     // For now, simple approach
                     salesByDay[key] = (salesByDay[key] || 0) + Number(sale.totalAmount);
              }
       });

       return Object.entries(salesByDay).map(([name, total]) => ({
              name,
              total
       }));
}
