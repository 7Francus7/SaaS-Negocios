"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import {
       LayoutDashboard,
       Package,
       ShoppingCart,
       Users,
       Settings,
       LogOut,
       Store,
       DollarSign,
       Truck,
       Crown,
       Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
       { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
       { href: "/dashboard/products", label: "Inventario", icon: Package },
       { href: "/dashboard/pos", label: "Punto de Venta", icon: ShoppingCart },
       { href: "/dashboard/cash", label: "Caja y Turnos", icon: DollarSign },
       { href: "/dashboard/customers", label: "Clientes", icon: Users },
       { href: "/dashboard/suppliers", label: "Proveedores", icon: Truck },
       { href: "/dashboard/settings", label: "Configuración", icon: Settings },
];

function SidebarContent() {
       const pathname = usePathname();
       const router = useRouter();
       const searchParams = useSearchParams();
       const [godMode, setGodMode] = useState(false);

       useEffect(() => {
              const isGod = searchParams.get('view') === 'god';
              if (isGod) {
                     localStorage.setItem('godMode', 'true');
                     setGodMode(true);
              } else {
                     if (typeof window !== 'undefined' && localStorage.getItem('godMode') === 'true') {
                            setGodMode(true);
                     }
              }
       }, [searchParams]);

       const handleLogout = () => {
              localStorage.removeItem('godMode');
              router.push('/');
       };

       return (
              <aside className={cn("w-64 border-r flex flex-col h-full fixed left-0 top-0 transition-all duration-300", godMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200")}>
                     <div className={cn("h-16 flex items-center px-6 border-b transition-colors", godMode ? "border-slate-800" : "border-gray-100")}>
                            {godMode ? (
                                   <Crown className="h-6 w-6 text-yellow-500 mr-2" />
                            ) : (
                                   <Store className="h-6 w-6 text-blue-600 mr-2" />
                            )}
                            <span className={cn("font-bold text-xl tracking-tight", godMode ? "text-white" : "text-gray-900")}>
                                   {godMode ? "GOD MODE" : "Despensa SaaS"}
                            </span>
                     </div>

                     <nav className="flex-1 px-3 py-6 space-y-1">
                            {menuItems.map((item) => {
                                   const Icon = item.icon;
                                   const isActive = pathname === item.href;

                                   return (
                                          <Link
                                                 key={item.href}
                                                 href={item.href}
                                                 className={cn(
                                                        "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                                                        godMode
                                                               ? (isActive ? "bg-slate-800 text-yellow-400" : "text-slate-400 hover:bg-slate-800 hover:text-white")
                                                               : (isActive ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900")
                                                 )}
                                          >
                                                 <Icon className={cn("h-5 w-5 mr-3",
                                                        godMode
                                                               ? (isActive ? "text-yellow-400" : "text-slate-500")
                                                               : (isActive ? "text-blue-600" : "text-gray-400")
                                                 )} />
                                                 {item.label}
                                          </Link>
                                   );
                            })}

                            {godMode && (
                                   <div className="pt-4 mt-4 border-t border-slate-800">
                                          <h4 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">GOD MODE</h4>
                                          <Link
                                                 href="/dashboard/admin"
                                                 className={cn(
                                                        "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                                                        pathname === "/dashboard/admin"
                                                               ? "bg-slate-800 text-yellow-400"
                                                               : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                                 )}
                                          >
                                                 <Shield className={cn("h-5 w-5 mr-3", pathname === "/dashboard/admin" ? "text-yellow-400" : "text-slate-500")} />
                                                 Panel Global
                                          </Link>
                                   </div>
                            )}
                     </nav>

                     <div className={cn("p-4 border-t", godMode ? "border-slate-800" : "border-gray-100")}>
                            <button
                                   onClick={handleLogout}
                                   className={cn(
                                          "flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                                          godMode
                                                 ? "text-slate-400 hover:bg-red-900/20 hover:text-red-400"
                                                 : "text-gray-700 hover:bg-red-50 hover:text-red-700"
                                   )}
                            >
                                   <LogOut className={cn("h-5 w-5 mr-3", godMode ? "text-slate-500 group-hover:text-red-400" : "text-gray-400 group-hover:text-red-600")} />
                                   Cerrar Sesión
                            </button>
                     </div>
              </aside>
       );
}

export function Sidebar() {
       return (
              <Suspense fallback={<div className="w-64 bg-white border-r h-full fixed" />}>
                     <SidebarContent />
              </Suspense>
       );
}
