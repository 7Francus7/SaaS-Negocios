"use server";

import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getStoreId } from "@/lib/store";
import { safeSerialize } from "@/lib/utils";

export type SalesByHour = {
       hour: string;
       salesCount: number;
       totalAmount: number;
};

export type TopItem = {
       id: string | number;
       name: string;
       value: number;
       subtext?: string;
};

export type CategorySalesItem = {
       categoryId: number | null;
       categoryName: string;
       totalRevenue: number;
       totalQuantity: number;
       totalCost: number;
};

export type AdvancedReportData = {
       salesByHour: SalesByHour[];
       topProducts: TopItem[];
       topCustomers: TopItem[];
       paymentMethods: { method: string; total: number; count: number }[];
};

export type ReportsSnapshot = {
       report: AdvancedReportData;
       categoryData: CategorySalesItem[];
};

export type ReportRange =
       | "today"
       | "yesterday"
       | "7d"
       | "30d"
       | "this_month"
       | "last_month"
       | "this_year"
       | "all";

function buildReportRange(range: ReportRange = "today") {
       const now = new Date();
       let startDate = new Date();
       let endDate: Date | undefined;

       if (range === "today") {
              startDate.setHours(0, 0, 0, 0);
              endDate = new Date();
              endDate.setHours(23, 59, 59, 999);
       } else if (range === "yesterday") {
              startDate.setDate(now.getDate() - 1);
              startDate.setHours(0, 0, 0, 0);
              endDate = new Date(startDate);
              endDate.setHours(23, 59, 59, 999);
       } else if (range === "7d") {
              startDate.setDate(now.getDate() - 7);
              startDate.setHours(0, 0, 0, 0);
       } else if (range === "30d") {
              startDate.setDate(now.getDate() - 30);
              startDate.setHours(0, 0, 0, 0);
       } else if (range === "this_month") {
              startDate = new Date(now.getFullYear(), now.getMonth(), 1);
              startDate.setHours(0, 0, 0, 0);
       } else if (range === "last_month") {
              startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
              startDate.setHours(0, 0, 0, 0);
              endDate = new Date(now.getFullYear(), now.getMonth(), 0);
              endDate.setHours(23, 59, 59, 999);
       } else if (range === "this_year") {
              startDate = new Date(now.getFullYear(), 0, 1);
              startDate.setHours(0, 0, 0, 0);
       } else if (range === "all") {
              startDate = new Date(now.getFullYear() - 10, 0, 1);
       }

       return {
              startDate,
              endDate,
              timestampWhere: {
                     gte: startDate,
                     ...(endDate ? { lte: endDate } : {}),
              },
       };
}

async function buildAdvancedReports(storeId: string, range: ReportRange): Promise<AdvancedReportData> {
       const { startDate, endDate, timestampWhere } = buildReportRange(range);

       const [hourlyRows, topProductRows, topCustomerRows, paymentMethodRows] = await Promise.all([
              prisma.$queryRaw<Array<{ hour: number; sales_count: bigint; total_amount: string }>>(Prisma.sql`
                     SELECT EXTRACT(HOUR FROM "timestamp")::int AS hour,
                            COUNT(*)::bigint AS sales_count,
                            COALESCE(SUM("totalAmount"), 0)::text AS total_amount
                     FROM "sales"
                     WHERE "storeId" = ${storeId}
                       AND "timestamp" >= ${startDate}
                       ${endDate ? Prisma.sql`AND "timestamp" <= ${endDate}` : Prisma.empty}
                     GROUP BY 1
                     ORDER BY 1 ASC
              `),
              prisma.saleItem.groupBy({
                     by: ["productNameSnapshot"],
                     where: {
                            sale: {
                                   storeId,
                                   timestamp: timestampWhere,
                            },
                     },
                     _sum: { quantity: true },
                     orderBy: { _sum: { quantity: "desc" } },
                     take: 5,
              }),
              prisma.sale.groupBy({
                     by: ["customerId"],
                     where: {
                            storeId,
                            customerId: { not: null },
                            timestamp: timestampWhere,
                     },
                     _sum: { totalAmount: true },
                     orderBy: { _sum: { totalAmount: "desc" } },
                     take: 5,
              }),
              prisma.salePayment.groupBy({
                     by: ["paymentMethod"],
                     where: {
                            sale: {
                                   storeId,
                                   timestamp: timestampWhere,
                            },
                     },
                     _sum: { amount: true },
                     _count: { _all: true },
                     orderBy: { _sum: { amount: "desc" } },
              }),
       ]);

       const customerIds = topCustomerRows
              .map((row) => row.customerId)
              .filter((id): id is number => id != null);

       const customers = customerIds.length > 0
              ? await prisma.customer.findMany({
                     where: { id: { in: customerIds }, storeId },
                     select: { id: true, name: true },
              })
              : [];

       const customerNameMap = new Map(customers.map((customer) => [customer.id, customer.name]));

       const salesByHourMap = new Map<number, { count: number; total: number }>();
       for (let i = 0; i < 24; i++) salesByHourMap.set(i, { count: 0, total: 0 });

       hourlyRows.forEach((row) => {
              salesByHourMap.set(row.hour, {
                     count: Number(row.sales_count),
                     total: Number(row.total_amount || 0),
              });
       });

       const salesByHour = Array.from(salesByHourMap.entries())
              .map(([hour, data]) => ({
                     hour: `${hour}:00`,
                     salesCount: data.count,
                     totalAmount: data.total,
              }))
              .filter((entry) => range === "today" ? true : entry.salesCount > 0)
              .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

       const topProducts = topProductRows.map((row, index) => ({
              id: index,
              name: row.productNameSnapshot,
              value: Number(row._sum.quantity || 0),
              subtext: "unidades vendidas",
       }));

       const topCustomers = topCustomerRows
              .filter((row) => row.customerId != null)
              .map((row) => ({
                     id: row.customerId as number,
                     name: customerNameMap.get(row.customerId as number) || "Cliente",
                     value: Number(row._sum.totalAmount || 0),
                     subtext: "en compras",
              }));

       const paymentMethods = paymentMethodRows.map((row) => ({
              method: row.paymentMethod,
              total: Number(row._sum.amount || 0),
              count: row._count._all,
       }));

       return safeSerialize({
              salesByHour,
              topProducts,
              topCustomers,
              paymentMethods,
       });
}

async function buildCategorySales(storeId: string, range: ReportRange): Promise<CategorySalesItem[]> {
       const { startDate, endDate } = buildReportRange(range);

       const rows = await prisma.$queryRaw<Array<{
              category_id: number | null;
              category_name: string | null;
              total_revenue: string;
              total_quantity: number;
              total_cost: string;
       }>>(Prisma.sql`
              SELECT p."categoryId" AS category_id,
                     c."name" AS category_name,
                     COALESCE(SUM(si."subtotal"), 0)::text AS total_revenue,
                     COALESCE(SUM(si."quantity"), 0)::float AS total_quantity,
                     COALESCE(SUM(si."subtotalCost"), 0)::text AS total_cost
              FROM "sale_items" si
              INNER JOIN "sales" s ON s."id" = si."saleId"
              INNER JOIN "product_variants" pv ON pv."id" = si."variantId"
              INNER JOIN "products" p ON p."id" = pv."productId"
              LEFT JOIN "categories" c ON c."id" = p."categoryId"
              WHERE s."storeId" = ${storeId}
                AND s."timestamp" >= ${startDate}
                ${endDate ? Prisma.sql`AND s."timestamp" <= ${endDate}` : Prisma.empty}
              GROUP BY p."categoryId", c."name"
              ORDER BY SUM(si."subtotal") DESC
       `);

       return safeSerialize(
              rows.map((row) => ({
                     categoryId: row.category_id,
                     categoryName: row.category_name || "Sin categoría",
                     totalRevenue: Number(row.total_revenue || 0),
                     totalQuantity: Number(row.total_quantity || 0),
                     totalCost: Number(row.total_cost || 0),
              }))
       );
}

export async function getReportsSnapshot(range: ReportRange = "today"): Promise<ReportsSnapshot> {
       const storeId = await getStoreId();
       const [report, categoryData] = await Promise.all([
              buildAdvancedReports(storeId, range),
              buildCategorySales(storeId, range),
       ]);

       return safeSerialize({ report, categoryData });
}

export async function getAdvancedReports(range: ReportRange = "today"): Promise<AdvancedReportData> {
       const storeId = await getStoreId();
       return await buildAdvancedReports(storeId, range);
}

export async function getSalesByCategory(range: ReportRange = "today"): Promise<CategorySalesItem[]> {
       const storeId = await getStoreId();
       return await buildCategorySales(storeId, range);
}
