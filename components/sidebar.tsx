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
       Shield,
       Tag,
       Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
       { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
       { href: "/dashboard/products", label: "Inventario", icon: Package },
       { href: "/dashboard/pos", label: "Punto de Venta", icon: ShoppingCart },
       { href: "/dashboard/cash", label: "Caja y Turnos", icon: DollarSign },
       { href: "/dashboard/promotions", label: "Promociones", icon: Tag },
       { href: "/dashboard/customers", label: "Clientes", icon: Users },
       { href: "/dashboard/suppliers", label: "Proveedores", icon: Truck },
       { href: "/dashboard/settings", label: "Configuración", icon: Settings },
];

function SidebarContent() {
       const pathname = usePathname();
       const router = useRouter();
       const searchParams = useSearchParams();
       const [storeName, setStoreName] = useState("Despensa SaaS");
       const [godMode, setGodMode] = useState(false);

       useEffect(() => {
              // Fetch store name
              import("@/app/actions/dashboard").then(({ getPublicStoreInfo }) => {
                     getPublicStoreInfo().then(info => setStoreName(info.name));
              });

              const isGod = searchParams.get('view') === 'god';
              if (isGod) {
                     localStorage.setItem('godMode', 'true');
                     setGodMode(true);
                     // Redirect to God Mode Dashboard if on main dashboard
                     if (pathname === '/dashboard') {
                            router.push('/dashboard/admin');
                     }
              } else {
                     if (typeof window !== 'undefined' && localStorage.getItem('godMode') === 'true') {
                            setGodMode(true);
                     }
              }
       }, [searchParams, pathname, router]);

       const handleLogout = async () => {
              const { logout } = await import("@/app/actions/auth");
              await logout();
              localStorage.removeItem('godMode');
              router.push('/');
       };

       return (
              <aside className={cn(
                     "w-72 border-r flex flex-col h-full fixed left-0 top-0 transition-all duration-500 z-50",
                     godMode ? "bg-white border-yellow-400/30" : "bg-white border-gray-200"
              )}>
                     <div className={cn(
                            "p-8 flex items-center gap-3 border-b transition-colors duration-500",
                            godMode ? "border-yellow-400/20 bg-yellow-50/10" : "border-gray-100"
                     )}>
                            {godMode ? (
                                   <div className="flex items-center gap-3">
                                          <Zap className="h-8 w-8 text-yellow-500 fill-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.3)] anim-pulse" />
                                          <div className="flex flex-col">
                                                 <span className="font-black text-xl tracking-tighter uppercase leading-none text-slate-900">GOD MODE</span>
                                                 <span className="text-[9px] font-bold text-yellow-600 tracking-[0.2em] uppercase">Super Admin</span>
                                          </div>
                                   </div>
                            ) : (
                                   <>
                                          <Store className="h-6 w-6 text-blue-600 mr-2" />
                                          <span className="font-bold text-xl tracking-tight text-gray-900 truncate">{storeName}</span>
                                   </>
                            )}
                     </div>

                     <nav className="flex-1 px-4 py-8 space-y-1">
                            {/* Standard menu items - ONLY visible if NOT in godMode */}
                            {!godMode && menuItems.map((item) => {
                                   const Icon = item.icon;
                                   const isActive = pathname === item.href;

                                   return (
                                          <Link
                                                 key={item.href}
                                                 href={item.href}
                                                 className={cn(
                                                        "flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group",
                                                        isActive
                                                               ? "bg-blue-50 text-blue-700 shadow-sm"
                                                               : "text-gray-700 hover:bg-gray-100"
                                                 )}
                                          >
                                                 <Icon className={cn("h-5 w-5 mr-3 transition-transform group-hover:scale-110",
                                                        isActive ? "text-blue-600" : "text-gray-400"
                                                 )} />
                                                 <span>
                                                        {item.label}
                                                 </span>
                                          </Link>
                                   );
                            })}

                            {godMode && (
                                   <div>
                                          <p className="px-4 pb-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Sistema Premium</p>
                                          <Link
                                                 href="/dashboard/admin"
                                                 className={cn(
                                                        "flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group border",
                                                        pathname === "/dashboard/admin"
                                                               ? "bg-yellow-50 text-yellow-700 border-yellow-200 shadow-sm font-bold"
                                                               : "text-slate-600 hover:bg-gray-50 border-transparent"
                                                 )}
                                          >
                                                 <Shield className={cn("h-5 w-5 mr-3 transition-transform group-hover:scale-110", pathname === "/dashboard/admin" ? "text-yellow-600" : "text-slate-400 group-hover:text-yellow-500")} />
                                                 Panel Global
                                          </Link>
                                   </div>
                            )}
                     </nav>

                     <div className={cn("p-6 border-t", godMode ? "border-yellow-400/20" : "border-gray-100")}>
                            {godMode && (
                                   <div className="px-4 py-3 bg-yellow-50 rounded-xl flex items-center gap-3 mb-4 border border-yellow-100 shadow-sm">
                                          <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-white font-black text-[10px] shadow-sm">
                                                 GM
                                          </div>
                                          <div className="flex flex-col overflow-hidden">
                                                 <span className="text-xs font-bold text-slate-900 truncate">Root Admin</span>
                                                 <span className="text-[10px] text-slate-500 truncate">admin@system.io</span>
                                          </div>
                                   </div>
                            )}
                            <button
                                   onClick={handleLogout}
                                   className={cn(
                                          "flex items-center w-full px-4 py-3 text-sm font-bold uppercase tracking-wider rounded-xl transition-all",
                                          godMode
                                                 ? "text-red-600 hover:bg-red-50"
                                                 : "text-gray-700 hover:bg-red-50 hover:text-red-700 font-bold"
                                   )}
                            >
                                   <LogOut className={cn("h-5 w-5 mr-3", godMode ? "text-red-500" : "text-gray-400")} />
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
