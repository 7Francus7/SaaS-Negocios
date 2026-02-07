"use server";

import prisma from "@/lib/prisma";
import { getStoreId } from "@/lib/store";
import { safeSerialize } from "@/lib/utils";

// --- Types ---
export type SalesByHour = {
       hour: string; // "14:00"
       salesCount: number;
       totalAmount: number;
};

export type TopItem = {
       id: string | number;
       name: string;
       value: number; // Qty for products, Spent for customers
       subtext?: string;
};

export type AdvancedReportData = {
       salesByHour: SalesByHour[];
       topProducts: TopItem[];
       topCustomers: TopItem[];
       paymentMethods: { method: string; total: number; count: number }[];
};

export async function getAdvancedReports(range: 'today' | '7d' | '30d' = 'today'): Promise<AdvancedReportData> {
       const storeId = await getStoreId();

       // 1. Determine Date Range
       const now = new Date();
       const startDate = new Date();

       if (range === 'today') {
              startDate.setHours(0, 0, 0, 0);
       } else if (range === '7d') {
              startDate.setDate(now.getDate() - 7);
              startDate.setHours(0, 0, 0, 0);
       } else {
              startDate.setDate(now.getDate() - 30);
              startDate.setHours(0, 0, 0, 0);
       }

       // 2. Fetch Sales
       const sales = await prisma.sale.findMany({
              where: {
                     storeId,
                     timestamp: { gte: startDate }
              },
              include: {
                     items: true,
                     customer: true
              }
       });

       // 3. Process Sales By Hour (Aggregate)
       const salesByHourMap = new Map<number, { count: number; total: number }>();
       // Initialize 24h
       for (let i = 0; i < 24; i++) salesByHourMap.set(i, { count: 0, total: 0 });

       sales.forEach(sale => {
              const hour = new Date(sale.timestamp).getHours();
              const current = salesByHourMap.get(hour) || { count: 0, total: 0 };
              salesByHourMap.set(hour, {
                     count: current.count + 1,
                     total: current.total + Number(sale.totalAmount)
              });
       });

       const salesByHour = Array.from(salesByHourMap.entries())
              .map(([h, data]) => ({
                     hour: `${h}:00`,
                     salesCount: data.count,
                     totalAmount: data.total
              }))
              .filter(d => range === 'today' ? true : d.salesCount > 0) // Hide empty hours on wider ranges? Maybe show all on today
              .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));


       // 4. Top Products
       const productsMap = new Map<string, { name: string; qty: number }>();
       sales.forEach(sale => {
              sale.items.forEach(item => {
                     const key = item.productNameSnapshot;
                     const current = productsMap.get(key) || { name: key, qty: 0 };
                     productsMap.set(key, { ...current, qty: current.qty + item.quantity });
              });
       });

       const topProducts = Array.from(productsMap.values())
              .sort((a, b) => b.qty - a.qty)
              .slice(0, 5)
              .map((p, i) => ({
                     id: i,
                     name: p.name,
                     value: p.qty,
                     subtext: "unidades vendidas"
              }));

       // 5. Top Customers
       const customersMap = new Map<number, { name: string; spent: number }>();
       sales.forEach(sale => {
              if (sale.customerId && sale.customer) {
                     const current = customersMap.get(sale.customerId) || { name: sale.customer.name, spent: 0 };
                     customersMap.set(sale.customerId, { ...current, spent: current.spent + Number(sale.totalAmount) });
              }
       });

       const topCustomers = Array.from(customersMap.entries())
              .sort((a, b) => b[1].spent - a[1].spent)
              .slice(0, 5)
              .map(([id, c]) => ({
                     id,
                     name: c.name,
                     value: c.spent,
                     subtext: "en compras"
              }));

       // 6. Payment Methods
       const methodsMap = new Map<string, { total: number; count: number }>();
       sales.forEach(sale => {
              const method = sale.paymentMethod;
              const current = methodsMap.get(method) || { total: 0, count: 0 };
              methodsMap.set(method, {
                     total: current.total + Number(sale.totalAmount),
                     count: current.count + 1
              });
       });

       const paymentMethods = Array.from(methodsMap.entries())
              .map(([method, data]) => ({
                     method,
                     total: data.total,
                     count: data.count
              }))
              .sort((a, b) => b.total - a.total);

       return safeSerialize({
              salesByHour,
              topProducts,
              topCustomers,
              paymentMethods
       });
}
