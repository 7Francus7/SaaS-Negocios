/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
       console.log("🔍 Verificando acceso al sistema...");

       try {
              // 1. Simular Login / Obtención de Store
              console.log("1️⃣  Verificando Tienda (Tenant)...");
              let store = await prisma.store.findFirst();

              if (!store) {
                     console.log("   ⚠️ No se encontró tienda. Creando 'Tienda Demo'...");
                     store = await prisma.store.create({
                            data: {
                                   name: "Tienda Demo",
                                   slug: "demo",
                                   isActive: true
                            }
                     });
                     console.log("   ✅ Tienda creada:", store.id);
              } else {
                     console.log("   ✅ Tienda encontrada:", store.name, `(${store.id})`);
              }

              const storeId = store.id;

              // 2. Simular Carga de Dashboard (getDashboardStats)
              console.log("2️⃣  Simulando carga de métricas (Dashboard)...");

              const today = new Date();
              today.setHours(0, 0, 0, 0);

              // Queries paralelas como en el dashboard
              const [sales, products, customers] = await Promise.all([
                     prisma.sale.aggregate({
                            where: { storeId, timestamp: { gte: today } },
                            _sum: { totalAmount: true },
                            _count: true
                     }),
                     prisma.productVariant.count({ where: { storeId, active: true } }),
                     prisma.customer.count({ where: { storeId, active: true } })
              ]);

              console.log("   📊 Resultados:");
              console.log("      - Ventas Hoy: $", sales._sum.totalAmount || 0, `(${sales._count} operaciones)`);
              console.log("      - Productos Activos:", products);
              console.log("      - Clientes:", customers);

              console.log("\n✅ SISTEMA OPERATIVO: El backend y la base de datos responden correctamente.");
              console.log("   Si no puedes entrar en el navegador, revisa la consola del navegador (F12) por errores de React.");

       } catch (error) {
              console.error("\n❌ ERROR CRÍTICO AL INGRESAR:");
              console.error(error);
              process.exit(1);
       } finally {
              await prisma.$disconnect();
       }
}

main();
