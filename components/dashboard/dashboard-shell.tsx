"use client";

import { checkHasOpenSession } from "@/app/actions/cash";
import { autoCloseMonthlyAccounts } from "@/app/actions/customers";
import { Sidebar, type SidebarProps } from "@/components/sidebar";
import { cn } from "@/lib/utils";
import { ShieldAlert, Wallet } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { OfflineSyncProvider } from "@/components/providers/offline-sync-provider";

type DashboardShellProps = {
       children: React.ReactNode;
       initialHasOpenCash: boolean;
} & SidebarProps;

export function DashboardShell({
       children,
       initialHasOpenCash,
       initialStoreName,
       initialUserRole,
}: DashboardShellProps) {
       const pathname = usePathname();
       const router = useRouter();
       const isAdminPage = pathname?.startsWith("/dashboard/admin");
       const isCashPage = pathname === "/dashboard/cash";
       const shouldSkipCashGate = isAdminPage || isCashPage;
       const previousPathname = useRef<string | null>(null);

       const [hasOpenCash, setHasOpenCash] = useState(initialHasOpenCash);

       useEffect(() => {
              if (initialUserRole === "SUPERADMIN") {
                     return;
              }

              const now = new Date();
              if (now.getDate() !== 1) {
                     return;
              }

              const runKey = `auto-close-monthly-accounts:${now.toISOString().slice(0, 10)}`;
              if (typeof window !== "undefined" && window.sessionStorage.getItem(runKey) === "done") {
                     return;
              }

              let isMounted = true;

              autoCloseMonthlyAccounts()
                     .then((result) => {
                            if (typeof window !== "undefined") {
                                   window.sessionStorage.setItem(runKey, "done");
                            }
                            if (isMounted && result?.executed && result?.closed && result.closed > 0) {
                                   console.log(`Cierre automatico de mes: ${result.closed} cuentas cerradas.`);
                            }
                     })
                     .catch((err) => {
                            if (isMounted) {
                                   console.error("Error en cierre automatico de cuentas:", err);
                            }
                     });

              return () => {
                     isMounted = false;
              };
       }, [initialUserRole]);

       useEffect(() => {
              const cameFromCashPage = previousPathname.current === "/dashboard/cash";
              previousPathname.current = pathname ?? null;

              if (shouldSkipCashGate || !cameFromCashPage) {
                     return;
              }

              let isMounted = true;

              checkHasOpenSession()
                     .then((isOpen) => {
                            if (isMounted) {
                                   setHasOpenCash(isOpen);
                            }
                     })
                     .catch(() => {
                            if (isMounted) {
                                   setHasOpenCash(true);
                            }
                     });

              return () => {
                     isMounted = false;
              };
       }, [pathname, shouldSkipCashGate]);

       const isCashierNotAllowed =
              initialUserRole === "CASHIER" &&
              ["/dashboard/products", "/dashboard/reports", "/dashboard/promotions", "/dashboard/suppliers", "/dashboard/settings"].some((p) =>
                     pathname?.startsWith(p)
              );
       const isBlocked = !hasOpenCash && !shouldSkipCashGate;

       return (
              <div className="min-h-screen bg-gray-50 flex font-[family-name:var(--font-geist-sans)]">
                     <OfflineSyncProvider />
                     <Sidebar initialStoreName={initialStoreName} initialUserRole={initialUserRole} />
                     <main
                            className={cn(
                                   "flex-1 lg:ml-72 transition-all duration-500 print:ml-0 print:p-0 min-w-0",
                                   isAdminPage ? "p-0 pt-14 lg:pt-0" : "p-4 pt-16 lg:p-8 lg:pt-8"
                            )}
                     >
                            {isCashierNotAllowed ? (
                                   <div className="h-full w-full min-h-[80vh] flex items-center justify-center p-4 lg:p-8">
                                          <div className="bg-white p-8 lg:p-12 rounded-[2rem] shadow-xl max-w-xl w-full text-center border border-gray-100 flex flex-col items-center">
                                                 <ShieldAlert className="w-16 h-16 text-red-500 mb-6" />
                                                 <h2 className="text-2xl lg:text-3xl font-black text-gray-900 mb-4 tracking-tight">Acceso Denegado</h2>
                                                 <p className="text-gray-500 font-medium mb-8">Tu rango actual de Cajero no permite el acceso a esta seccion administrativa.</p>
                                                 <button
                                                        onClick={() => router.push("/dashboard/pos")}
                                                        className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-wider text-sm hover:bg-blue-700"
                                                 >
                                                        Ir al Punto de Venta
                                                 </button>
                                          </div>
                                   </div>
                            ) : isBlocked ? (
                                   <div className="h-full w-full min-h-[80vh] flex items-center justify-center p-4 lg:p-8">
                                          <div className="bg-white p-8 lg:p-12 rounded-[2rem] shadow-xl max-w-xl w-full text-center border border-gray-100 flex flex-col items-center animate-in zoom-in-95 duration-500">
                                                 <div className="w-24 h-24 lg:w-28 lg:h-28 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 lg:mb-8 relative">
                                                        <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" />
                                                        <ShieldAlert className="w-12 h-12 lg:w-14 lg:h-14 relative z-10" />
                                                 </div>
                                                 <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-4 tracking-tight">Caja Cerrada</h2>
                                                 <p className="text-gray-500 font-medium mb-8 lg:mb-10 text-base lg:text-lg leading-relaxed px-4">
                                                        Por seguridad, es estrictamente necesario <strong className="text-gray-900">Abrir la Caja</strong> antes de poder realizar ventas, registrar pagos o utilizar el sistema.
                                                 </p>
                                                 <button
                                                        onClick={() => router.push("/dashboard/cash")}
                                                        className="w-full flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white p-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/30 hover:scale-[1.02]"
                                                 >
                                                        <Wallet className="w-6 h-6" />
                                                        Ir a Abrir la Caja Ahora
                                                 </button>
                                          </div>
                                   </div>
                            ) : (
                                   children
                            )}
                     </main>
              </div>
       );
}
