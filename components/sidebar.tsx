"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
       LayoutDashboard,
       Package,
       ShoppingCart,
       Users,
       Settings,
       LogOut,
       Store,
       DollarSign,
       Truck
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

export function Sidebar() {
       const pathname = usePathname();

       return (
              <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full fixed left-0 top-0">
                     <div className="h-16 flex items-center px-6 border-b border-gray-100">
                            <Store className="h-6 w-6 text-blue-600 mr-2" />
                            <span className="font-bold text-xl tracking-tight text-gray-900">Despensa SaaS</span>
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
                                                        isActive
                                                               ? "bg-blue-50 text-blue-700"
                                                               : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                                 )}
                                          >
                                                 <Icon className={cn("h-5 w-5 mr-3", isActive ? "text-blue-600" : "text-gray-400")} />
                                                 {item.label}
                                          </Link>
                                   );
                            })}
                     </nav>

                     <div className="p-4 border-t border-gray-100">
                            <button className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors">
                                   <LogOut className="h-5 w-5 mr-3 text-gray-400 group-hover:text-red-600" />
                                   Cerrar Sesión
                            </button>
                     </div>
              </aside>
       );
}
