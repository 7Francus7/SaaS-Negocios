/**
 * Repara los cargos de "Cierre Automático" duplicados que generó la condición
 * de carrera en autoCloseMonthlyAccounts (varias terminales disparando el cierre
 * a la vez el día 1 del mes cargaban el saldo dos veces en closedBalance y creaban
 * dos movimientos MONTH_CLOSE idénticos).
 *
 * Qué hace:
 *   - Busca movimientos MONTH_CLOSE cuya descripción sea "Cierre Automático de ...".
 *   - Los agrupa por (cliente, descripción). Un cliente sólo puede tener UN cierre
 *     automático por mes, así que cualquier repetición dentro de un grupo es un
 *     duplicado del bug. NO toca el cierre manual ("Separación de Cuenta / Cierre
 *     de Mes"), que es intencional y puede repetirse.
 *   - Conserva el movimiento más antiguo de cada grupo y elimina los extras.
 *   - Descuenta de closedBalance la suma de los cargos extra (con tope en 0).
 *
 * Uso:
 *   node scripts/repair-duplicate-month-close.js            -> SIMULACIÓN (no modifica nada)
 *   node scripts/repair-duplicate-month-close.js --apply    -> APLICA los cambios
 *
 * Es idempotente: correrlo de nuevo después de aplicar no encuentra nada para reparar.
 * Requiere la variable de entorno DATABASE_URL apuntando a la base a reparar.
 */

const { PrismaClient, Prisma } = require('@prisma/client');
const prisma = new PrismaClient();

const APPLY = process.argv.includes('--apply');
const AUTO_PREFIX = 'Cierre Automático de ';
const D = (v) => new Prisma.Decimal(v);

function money(n) {
       try {
              return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(Number(n));
       } catch {
              return `$${Number(n).toFixed(2)}`;
       }
}

async function main() {
       console.log(
              APPLY
                     ? '=== MODO APLICAR — se van a modificar datos en la base ==='
                     : '=== MODO SIMULACIÓN (dry-run) — no se modifica nada ==='
       );

       // 1. Traer todos los cierres automáticos, ordenados para conservar el más antiguo.
       const movements = await prisma.accountMovement.findMany({
              where: { movementType: 'MONTH_CLOSE', description: { startsWith: AUTO_PREFIX } },
              orderBy: [{ timestamp: 'asc' }, { id: 'asc' }],
              select: { id: true, customerId: true, description: true, amount: true, timestamp: true },
       });

       // 2. Agrupar por (cliente, descripción) para detectar repeticiones.
       const groups = new Map();
       for (const m of movements) {
              const key = `${m.customerId}||${m.description}`;
              if (!groups.has(key)) groups.set(key, []);
              groups.get(key).push(m);
       }

       // 3. Reunir los movimientos extra por cliente.
       const perCustomer = new Map(); // customerId -> { extraIds, dupAmount, details }
       for (const list of groups.values()) {
              if (list.length < 2) continue; // sin duplicados
              const [, ...extras] = list; // se conserva list[0] (el más antiguo)
              const cid = list[0].customerId;
              if (!perCustomer.has(cid)) {
                     perCustomer.set(cid, { extraIds: [], dupAmount: D(0), details: [] });
              }
              const entry = perCustomer.get(cid);
              let groupDup = D(0);
              for (const e of extras) {
                     entry.extraIds.push(e.id);
                     groupDup = groupDup.plus(e.amount);
              }
              entry.dupAmount = entry.dupAmount.plus(groupDup);
              entry.details.push({ description: list[0].description, extraCount: extras.length, groupDup });
       }

       if (perCustomer.size === 0) {
              console.log('\nNo se encontraron cierres automáticos duplicados. Nada para reparar. ✅');
              return;
       }

       // 4. Reportar (y aplicar si corresponde).
       const customerIds = [...perCustomer.keys()];
       const customers = await prisma.customer.findMany({
              where: { id: { in: customerIds } },
              select: { id: true, name: true, storeId: true, closedBalance: true },
       });
       const cmap = new Map(customers.map((c) => [c.id, c]));

       let totalRemoved = 0;
       const clampedAccounts = [];

       for (const cid of customerIds) {
              const entry = perCustomer.get(cid);
              const c = cmap.get(cid);
              const current = c ? D(c.closedBalance) : D(0);
              const projected = Prisma.Decimal.max(D(0), current.minus(entry.dupAmount));
              const clamped = current.lessThan(entry.dupAmount);
              totalRemoved += entry.extraIds.length;

              console.log(`\nCliente #${cid} — ${c ? c.name : '(cliente no encontrado)'}  [store ${c ? c.storeId : '?'}]`);
              for (const d of entry.details) {
                     console.log(`   • "${d.description}": ${d.extraCount} cargo(s) extra por ${money(d.groupDup)}`);
              }
              console.log(`   Movimientos duplicados a eliminar: ${entry.extraIds.length} (ids: ${entry.extraIds.join(', ')})`);
              console.log(`   Deuda cerrada: ${money(current)}  →  ${money(projected)}${clamped ? '   ⚠ ajustada a 0 — REVISAR MANUALMENTE' : ''}`);
              if (clamped) clampedAccounts.push(cid);

              if (APPLY) {
                     await prisma.$transaction(async (tx) => {
                            // Bloqueo de fila del cliente: serializa por si algo más toca la cuenta.
                            await tx.$queryRaw`SELECT "id" FROM "customers" WHERE "id" = ${cid} FOR UPDATE`;

                            // Re-verificar qué extras siguen existiendo (idempotencia): sólo se
                            // eliminan y descuentan los que realmente están presentes ahora.
                            const stillThere = await tx.accountMovement.findMany({
                                   where: {
                                          id: { in: entry.extraIds },
                                          movementType: 'MONTH_CLOSE',
                                          description: { startsWith: AUTO_PREFIX },
                                   },
                                   select: { id: true, amount: true },
                            });
                            if (stillThere.length === 0) return;

                            let dup = D(0);
                            for (const m of stillThere) dup = dup.plus(m.amount);

                            await tx.accountMovement.deleteMany({ where: { id: { in: stillThere.map((m) => m.id) } } });
                            await tx.$executeRaw`
                                   UPDATE "customers"
                                   SET "closedBalance" = GREATEST(0, "closedBalance" - ${dup.toString()}::numeric)
                                   WHERE "id" = ${cid}
                            `;
                     });
              }
       }

       console.log('\n=== Resumen ===');
       console.log(`Clientes afectados: ${customerIds.length}`);
       console.log(`Movimientos duplicados ${APPLY ? 'eliminados' : 'a eliminar'}: ${totalRemoved}`);
       if (clampedAccounts.length) {
              console.log(`⚠ Cuentas cuya deuda se ajustó a 0 (revisar manualmente): ${clampedAccounts.join(', ')}`);
       }
       console.log(
              APPLY
                     ? '\nReparación aplicada. ✅'
                     : '\nSimulación completa. Revisá el detalle y, si está correcto, corré de nuevo con --apply.'
       );
}

main()
       .catch((e) => {
              console.error('Error en la reparación:', e);
              process.exitCode = 1;
       })
       .finally(() => prisma.$disconnect());
