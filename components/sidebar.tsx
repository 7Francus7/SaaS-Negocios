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
       Shield,
       Tag,
       Zap,
       Activity,
       Terminal,
       Monitor,
       BarChart3,
       Cpu,
       Menu,
       X,
       BookOpen,
       ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type MenuItem = {
       href: string;
       label: string;
       icon: React.ElementType;
       color: string;
       activeColor: string;
};

type MenuGroup = {
       label?: string;
       items: MenuItem[];
};

const menuGroups: MenuGroup[] = [
       {
              items: [
                     { href: "/dashboard", label: "Inicio", icon: LayoutDashboard, color: "text-slate-400", activeColor: "text-blue-400" },
              ],
       },
       {
              label: "Operaciones",
              items: [
                     { href: "/dashboard/products", label: "Inventario", icon: Package, color: "text-slate-400", activeColor: "text-violet-400" },
                     { href: "/dashboard/pos", label: "Punto de Venta", icon: ShoppingCart, color: "text-slate-400", activeColor: "text-emerald-400" },
                     { href: "/dashboard/cash", label: "Caja y Turnos", icon: DollarSign, color: "text-slate-400", activeColor: "text-yellow-400" },
                     { href: "/dashboard/sales", label: "Historial Ventas", icon: Activity, color: "text-slate-400", activeColor: "text-sky-400" },
              ],
       },
       {
              label: "Clientes",
              items: [
                     { href: "/dashboard/promotions", label: "Promociones", icon: Tag, color: "text-slate-400", activeColor: "text-pink-400" },
                     { href: "/dashboard/customers", label: "Clientes", icon: Users, color: "text-slate-400", activeColor: "text-indigo-400" },
              ],
       },
       {
              label: "Finanzas",
              items: [
                     { href: "/dashboard/suppliers", label: "Proveedores", icon: Truck, color: "text-slate-400", activeColor: "text-teal-400" },
                     { href: "/dashboard/cashbook", label: "Contabilidad", icon: BookOpen, color: "text-slate-400", activeColor: "text-blue-400" },
                     { href: "/dashboard/reports", label: "Reportes", icon: BarChart3, color: "text-slate-400", activeColor: "text-orange-400" },
              ],
       },
       {
              label: "Sistema",
              items: [
                     { href: "/dashboard/install", label: "Descargar App", icon: Monitor, color: "text-slate-400", activeColor: "text-slate-300" },
                     { href: "/dashboard/settings", label: "Configuración", icon: Settings, color: "text-slate-400", activeColor: "text-slate-300" },
              ],
       },
];

const cashierAllowed = ["Inicio", "Punto de Venta", "Caja y Turnos", "Historial Ventas", "Clientes"];

function StoreAvatar({ name }: { name: string }) {
       const initials = name
              .split(" ")
              .slice(0, 2)
              .map((w) => w[0])
              .join("")
              .toUpperCase();
       return (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-900/40 shrink-0">
                     {initials || <Store className="h-4 w-4" />}
              </div>
       );
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
       const pathname = usePathname();
       const router = useRouter();
       const searchParams = useSearchParams();
       const [storeName, setStoreName] = useState("Mi Tienda");
       const [userRole, setUserRole] = useState("ADMIN");
       const [godMode, setGodMode] = useState(false);

       useEffect(() => {
              import("@/app/actions/dashboard").then(({ getPublicStoreInfo, getUserRole }) => {
                     getPublicStoreInfo().then((info) => setStoreName(info.name));
                     getUserRole().then((r) => setUserRole(r));
              });

              const isGod = searchParams.get("view") === "god";
              if (isGod) {
                     localStorage.setItem("godMode", "true");
                     setGodMode(true);
                     if (pathname === "/dashboard") router.push("/dashboard/admin");
              } else {
                     if (typeof window !== "undefined" && localStorage.getItem("godMode") === "true") {
                            setGodMode(true);
                     }
              }
       }, [searchParams, pathname, router]);

       const handleLogout = async () => {
              const { logout } = await import("@/app/actions/auth");
              await logout();
              localStorage.removeItem("godMode");
              router.push("/");
       };

       if (godMode) {
              return (
                     <aside className="w-72 bg-slate-950 border-r border-yellow-400/20 flex flex-col h-full z-50 print:hidden">
                            <div className="p-5 flex items-center gap-3 border-b border-yellow-400/20">
                                   <Zap className="h-8 w-8 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
                                   <div>
                                          <p className="font-black text-lg text-white tracking-tight leading-none">GOD MODE</p>
                                          <p className="text-[10px] text-yellow-500 font-bold tracking-widest uppercase">Super Admin</p>
                                   </div>
                                   {onClose && (
                                          <button onClick={onClose} className="ml-auto p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 lg:hidden">
                                                 <X className="h-5 w-5" />
                                          </button>
                                   )}
                            </div>
                            <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
                                   <div>
                                          <p className="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Core del Sistema</p>
                                          <Link href="/dashboard/admin" onClick={onClose} className={cn("flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all group", pathname === "/dashboard/admin" ? "bg-yellow-400/10 text-yellow-400 border border-yellow-400/20" : "text-slate-400 hover:bg-slate-800 hover:text-white")}>
                                                 <Shield className="h-5 w-5 mr-3" /> Panel Global
                                          </Link>
                                          <Link href="/dashboard/admin/metrics" onClick={onClose} className="flex items-center px-3 py-2.5 text-sm font-medium rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all group">
                                                 <Activity className="h-5 w-5 mr-3" /> Salud del Core
                                          </Link>
                                   </div>
                                   <div>
                                          <p className="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Infraestructura</p>
                                          <Link href="/dashboard/admin/logs" onClick={onClose} className="flex items-center px-3 py-2.5 text-sm font-medium rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                                                 <Terminal className="h-5 w-5 mr-3" /> Logs Maestros
                                          </Link>
                                          <Link href="/dashboard/admin/deployment" onClick={onClose} className="flex items-center px-3 py-2.5 text-sm font-medium rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                                                 <Cpu className="h-5 w-5 mr-3" /> Servidores Edge
                                          </Link>
                                   </div>
                            </nav>
                            <div className="p-4 border-t border-yellow-400/20">
                                   <div className="flex items-center gap-3 px-3 py-3 bg-slate-900 rounded-xl mb-3 border border-slate-800">
                                          <div className="w-8 h-8 rounded-lg bg-yellow-400 flex items-center justify-center text-slate-900 font-black text-xs">GM</div>
                                          <div>
                                                 <p className="text-xs font-bold text-white">Root Admin</p>
                                                 <p className="text-[10px] text-slate-500">admin@system.io</p>
                                          </div>
                                   </div>
                                   <button onClick={handleLogout} className="flex items-center w-full px-3 py-2.5 text-sm font-semibold rounded-xl text-red-400 hover:bg-red-500/10 transition-all">
                                          <LogOut className="h-4 w-4 mr-3" /> Cerrar Sesión
                                   </button>
                            </div>
                     </aside>
              );
       }

       return (
              <aside className="w-72 bg-white border-r border-gray-100 flex flex-col h-full z-50 print:hidden">
                     {/* Header */}
                     <div className="p-5 flex items-center gap-3 border-b border-gray-100">
                            <StoreAvatar name={storeName} />
                            <div className="flex-1 min-w-0">
                                   <p className="font-bold text-sm text-gray-900 truncate leading-tight">{storeName}</p>
                                   <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-0.5">
                                          {userRole === "CASHIER" ? "Cajero" : "Administrador"}
                                   </p>
                            </div>
                            {onClose && (
                                   <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 lg:hidden">
                                          <X className="h-5 w-5" />
                                   </button>
                            )}
                     </div>

                     {/* Nav */}
                     <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
                            {menuGroups.map((group, gi) => {
                                   const visibleItems = group.items.filter((item) =>
                                          userRole === "CASHIER" ? cashierAllowed.includes(item.label) : true
                                   );
                                   if (visibleItems.length === 0) return null;

                                   return (
                                          <div key={gi}>
                                                 {group.label && (
                                                        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
                                                               {group.label}
                                                        </p>
                                                 )}
                                                 <div className="space-y-0.5">
                                                        {visibleItems.map((item) => {
                                                               const Icon = item.icon;
                                                               const isActive = pathname === item.href;

                                                               return (
                                                                      <Link
                                                                             key={item.href}
                                                                             href={item.href}
                                                                             onClick={onClose}
                                                                             className={cn(
                                                                                    "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-150 group relative",
                                                                                    isActive
                                                                                           ? "bg-indigo-50 text-indigo-700"
                                                                                           : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                                                             )}
                                                                      >
                                                                             {isActive && (
                                                                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-indigo-500 rounded-r-full" />
                                                                             )}
                                                                             <Icon
                                                                                    className={cn(
                                                                                           "h-[18px] w-[18px] shrink-0 transition-colors",
                                                                                           isActive ? item.activeColor : "text-gray-400 group-hover:text-gray-600"
                                                                                    )}
                                                                             />
                                                                             <span className="flex-1">{item.label}</span>
                                                                             {isActive && <ChevronRight className="h-3.5 w-3.5 text-indigo-300" />}
                                                                      </Link>
                                                               );
                                                        })}
                                                 </div>
                                          </div>
                                   );
                            })}
                     </nav>

                     {/* Footer */}
                     <div className="p-3 border-t border-gray-100">
                            <button
                                   onClick={handleLogout}
                                   className="flex items-center w-full gap-3 px-3 py-2.5 text-sm font-medium rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all duration-150 group"
                            >
                                   <LogOut className="h-[18px] w-[18px] shrink-0 group-hover:text-red-500 transition-colors" />
                                   Cerrar Sesión
                            </button>
                     </div>
              </aside>
       );
}

function SidebarContentWrapper() {
       const [isOpen, setIsOpen] = useState(false);

       return (
              <>
                     {/* Mobile Header */}
                     <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 print:hidden">
                            <button
                                   onClick={() => setIsOpen(true)}
                                   className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700"
                                   aria-label="Abrir menú"
                            >
                                   <Menu className="h-5 w-5" />
                            </button>
                            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                                   <Store className="h-3.5 w-3.5 text-white" />
                            </div>
                            <span className="font-bold text-gray-900 truncate text-sm">Panel de Control</span>
                     </div>

                     {/* Mobile Overlay Drawer */}
                     {isOpen && (
                            <div className="lg:hidden fixed inset-0 z-50 flex print:hidden" onClick={() => setIsOpen(false)}>
                                   <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" />
                                   <div className="relative h-full flex flex-col animate-in slide-in-from-left duration-300" onClick={(e) => e.stopPropagation()}>
                                          <SidebarContent onClose={() => setIsOpen(false)} />
                                   </div>
                            </div>
                     )}

                     {/* Desktop Sidebar */}
                     <div className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:left-0 lg:top-0 lg:h-full print:hidden">
                            <SidebarContent />
                     </div>
              </>
       );
}

export function Sidebar() {
       return (
              <Suspense fallback={<div className="hidden lg:block w-72 bg-white border-r border-gray-100 h-full fixed" />}>
                     <SidebarContentWrapper />
              </Suspense>
       );
}
