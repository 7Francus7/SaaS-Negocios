"use client";

import { Sidebar } from "@/components/sidebar";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { checkHasOpenSession } from "@/app/actions/cash";
import { Wallet, ShieldAlert } from "lucide-react";

export default function DashboardLayout({
       children,
}: {
       children: React.ReactNode;
}) {
       const pathname = usePathname();
       const router = useRouter();
       const isAdminPage = pathname?.startsWith("/dashboard/admin");
       const isCashPage = pathname === "/dashboard/cash";

       const [hasOpenCash, setHasOpenCash] = useState<boolean | null>(null);
       const [userRole, setUserRole] = useState<string | null>(null);

       useEffect(() => {
              if (isAdminPage || isCashPage) {
                     setHasOpenCash(true);
                     return;
              }

              let isMounted = true;
              setHasOpenCash(null); // re-trigger check on nav

              import("@/app/actions/dashboard").then(m => m.getUserRole().then(r => setUserRole(r)));
              checkHasOpenSession().then((isOpen) => {
                     if (isMounted) {
                            setHasOpenCash(isOpen);
                     }
              }).catch(() => {
                     if (isMounted) {
                            setHasOpenCash(true); // Fallback on error to avoid softlock
                     }
              });

              return () => {
                     isMounted = false;
              };
       }, [pathname, isAdminPage, isCashPage]);

       const isCashierNotAllowed = userRole === "CASHIER" && ["/dashboard/products", "/dashboard/reports", "/dashboard/promotions", "/dashboard/suppliers", "/dashboard/settings"].some(p => pathname?.startsWith(p));
       const isBlocked = hasOpenCash === false && !isAdminPage && !isCashPage;
       const isChecking = hasOpenCash === null && !isAdminPage && !isCashPage;

       return (
              <div className="min-h-screen bg-gray-50 flex font-[family-name:var(--font-geist-sans)]">
                     <Sidebar />
                     <main className={cn(
                            "flex-1 ml-72 transition-all duration-500",
                            isAdminPage ? "p-0" : "p-8"
                     )}>
                            {isChecking ? (
                                   <div className="h-[80vh] flex flex-col items-center justify-center text-gray-400 gap-4 animate-pulse">
                                          <div className="w-10 h-10 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
                                          <p className="text-sm font-bold uppercase tracking-widest">Verificando Estado de Caja...</p>
                                   </div>
                            ) : isCashierNotAllowed ? (
                                   <div className="h-full w-full min-h-[80vh] flex items-center justify-center p-8">
                                          <div className="bg-white p-12 rounded-[2rem] shadow-xl max-w-xl w-full text-center border border-gray-100 flex flex-col items-center">
                                                 <ShieldAlert className="w-16 h-16 text-red-500 mb-6" />
                                                 <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Acceso Denegado</h2>
                                                 <p className="text-gray-500 font-medium mb-8">Tu rango actual de Cajero no permite el acceso a esta sección administrativa.</p>
                                                 <button onClick={() => router.push('/dashboard/pos')} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-wider text-sm hover:bg-blue-700">Ir al Punto de Venta</button>
                                          </div>
                                   </div>
                            ) : isBlocked ? (
                                   <div className="h-full w-full min-h-[80vh] flex items-center justify-center p-8">
                                          <div className="bg-white p-12 rounded-[2rem] shadow-xl max-w-xl w-full text-center border border-gray-100 flex flex-col items-center animate-in zoom-in-95 duration-500">
                                                 <div className="w-28 h-28 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-8 relative">
                                                        <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" />
                                                        <ShieldAlert className="w-14 h-14 relative z-10" />
                                                 </div>
                                                 <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Caja Cerrada</h2>
                                                 <p className="text-gray-500 font-medium mb-10 text-lg leading-relaxed px-4">
                                                        Por seguridad, es estrictamente necesario <strong className="text-gray-900">Abrir la Caja</strong> antes de poder realizar ventas, registrar pagos o utilizar el sistema.
                                                 </p>
                                                 <button
                                                        onClick={() => router.push('/dashboard/cash')}
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
