"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Package, Users, AlertTriangle, TrendingUp, ShoppingBag, DollarSign, Zap, CheckCircle2, Settings } from "lucide-react";
import { getDashboardStats, getDashboardChartData, DashboardStats } from "@/app/actions/dashboard";
import { checkOnboardingStatus } from "@/app/actions/onboarding";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { formatCurrency } from "@/lib/utils";

export default function DashboardPage() {
       const router = useRouter();
       const [stats, setStats] = useState<DashboardStats | null>(null);
       const [chartData, setChartData] = useState<{ name: string; total: number }[]>([]);
       const [loading, setLoading] = useState(true);
       const [error, setError] = useState("");

       const [range, setRange] = useState<'7d' | '30d' | '90d'>("7d");

       // Check onboarding status
       useEffect(() => {
              // Skip onboarding check for God Mode
              const isGodMode = typeof window !== 'undefined' && (
                     localStorage.getItem('godMode') === 'true' ||
                     window.location.search.includes('view=god')
              );

              if (isGodMode) return;

              checkOnboardingStatus().then(({ completed }) => {
                     if (!completed) {
                            router.push("/onboarding");
                     }
              });
       }, [router]);

       const fetchData = async () => {
              setLoading(true);
              setError("");
              try {
                     const [statsData, chartData] = await Promise.all([
                            getDashboardStats(),
                            getDashboardChartData(range)
                     ]);
                     setStats(statsData);
                     setChartData(chartData);
              } catch (err) {
                     console.error("Dashboard Error:", err);
                     setError(err instanceof Error ? err.message : "Error desconocido al cargar el tablero");
              } finally {
                     setLoading(false);
              }
       };

       useEffect(() => {
              fetchData();
       }, [range]); // Refetch when range changes

       if (loading && !stats) return <div className="p-8 flex justify-center text-gray-500">Cargando tablero...</div>;

       if (error) {
              return (
                     <div className="p-8 flex flex-col items-center justify-center text-center">
                            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Error de Carga</h2>
                            <p className="text-gray-600 mb-4 font-mono text-sm bg-gray-50 p-4 rounded border border-red-100 max-w-md">{error}</p>
                            <button
                                   onClick={fetchData}
                                   className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                   Reintentar
                            </button>
                     </div>
              );
       }

       if (!stats) return <div className="p-8 text-center text-gray-500">No se pudieron cargar las estadísticas.</div>;

       const cards = [
              {
                     title: "Ventas Hoy",
                     value: formatCurrency(stats.salesTodayTotal),
                     subtext: `${stats.salesCount} operaciones`,
                     icon: ShoppingBag,
                     color: "text-blue-600",
                     bg: "bg-blue-50"
              },
              {
                     title: "Ganancia Hoy",
                     value: formatCurrency(stats.profitToday),
                     subtext: "Neto estimado",
                     icon: TrendingUp,
                     color: "text-emerald-600",
                     bg: "bg-emerald-50"
              },
              {
                     title: "Inventario",
                     value: stats.productsCount,
                     subtext: "Productos",
                     icon: Package,
                     color: "text-indigo-600",
                     bg: "bg-indigo-50"
              },
              {
                     title: "Stock Bajo",
                     value: stats.lowStockCount,
                     subtext: "Atención requerida",
                     icon: AlertTriangle,
                     color: "text-orange-600",
                     bg: "bg-orange-50"
              },
       ];

       const getRangeLabel = () => {
              if (range === '7d') return "Últimos 7 Días";
              if (range === '30d') return "Últimos 30 Días";
              return "Últimos 3 Meses";
       };

       return (
              <div className="space-y-8">
                     <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                   <h1 className="text-2xl font-bold text-gray-900">Resumen de Tienda</h1>
                                   <p className="text-gray-500">Bienvenido a tu panel de control.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                   <span className="text-sm text-gray-500 font-medium">Periodo:</span>
                                   <select
                                          value={range}
                                          onChange={(e) => setRange(e.target.value as any)}
                                          className="border border-gray-300 rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer hover:border-blue-400 transition-colors"
                                   >
                                          <option value="7d">Últimos 7 Días</option>
                                          <option value="30d">Últimos 30 Días</option>
                                          <option value="90d">Últimos 3 Meses</option>
                                   </select>
                            </div>
                     </div>

                     {/* Prominent Quick Actions - TOP OF PAGE */}
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Link href="/dashboard/pos" className="group bg-gradient-to-br from-blue-600 to-blue-700 p-1 rounded-2xl shadow-lg hover:shadow-blue-200 transition-all hover:-translate-y-1 active:scale-95">
                                   <div className="bg-white/10 backdrop-blur-sm rounded-[calc(1rem-1px)] p-4 flex items-center justify-between text-white">
                                          <div className="flex items-center gap-4">
                                                 <div className="bg-white/20 p-3 rounded-xl group-hover:scale-110 transition-transform">
                                                        <ShoppingBag className="h-6 w-6" />
                                                 </div>
                                                 <div>
                                                        <p className="font-bold text-lg leading-tight uppercase tracking-tight">Nueva Venta</p>
                                                        <p className="text-blue-100 text-[10px] mt-0.5 font-medium uppercase tracking-wider">Cargar Operación</p>
                                                 </div>
                                          </div>
                                          <div className="bg-white/20 h-8 w-8 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                                                 <Zap className="h-4 w-4 fill-white animate-pulse" />
                                          </div>
                                   </div>
                            </Link>

                            <Link href="/dashboard/products" className="group bg-gradient-to-br from-indigo-600 to-indigo-700 p-1 rounded-2xl shadow-lg hover:shadow-indigo-200 transition-all hover:-translate-y-1 active:scale-95">
                                   <div className="bg-white/10 backdrop-blur-sm rounded-[calc(1rem-1px)] p-4 flex items-center justify-between text-white">
                                          <div className="flex items-center gap-4">
                                                 <div className="bg-white/20 p-3 rounded-xl group-hover:scale-110 transition-transform">
                                                        <Package className="h-6 w-6" />
                                                 </div>
                                                 <div>
                                                        <p className="font-bold text-lg leading-tight uppercase tracking-tight">Añadir Stock</p>
                                                        <p className="text-indigo-100 text-[10px] mt-0.5 font-medium uppercase tracking-wider">Ingreso de Mercadería</p>
                                                 </div>
                                          </div>
                                          <div className="bg-white/20 h-8 w-8 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                                                 <TrendingUp className="h-4 w-4" />
                                          </div>
                                   </div>
                            </Link>

                            <Link href="/dashboard/cash" className="group bg-gradient-to-br from-emerald-600 to-emerald-700 p-1 rounded-2xl shadow-lg hover:shadow-emerald-200 transition-all hover:-translate-y-1 active:scale-95">
                                   <div className="bg-white/10 backdrop-blur-sm rounded-[calc(1rem-1px)] p-4 flex items-center justify-between text-white">
                                          <div className="flex items-center gap-4">
                                                 <div className="bg-white/20 p-3 rounded-xl group-hover:scale-110 transition-transform">
                                                        <DollarSign className="h-6 w-6" />
                                                 </div>
                                                 <div>
                                                        <p className="font-bold text-lg leading-tight uppercase tracking-tight">Caja y Turnos</p>
                                                        <p className="text-emerald-100 text-[10px] mt-0.5 font-medium uppercase tracking-wider">Control de Dinero</p>
                                                 </div>
                                          </div>
                                          <div className="bg-white/20 h-8 w-8 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                                                 <Zap className="h-4 w-4 fill-white" />
                                          </div>
                                   </div>
                            </Link>

                            <Link href="/dashboard/customers" className="group bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-200 transition-all hover:shadow-md hover:-translate-y-1 hidden lg:flex items-center gap-4 active:scale-95">
                                   <div className="bg-blue-50 p-3 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                          <Users className="h-6 w-6" />
                                   </div>
                                   <div>
                                          <p className="font-bold text-gray-900 leading-tight uppercase tracking-tight">Clientes</p>
                                          <p className="text-gray-500 text-[10px] mt-0.5 font-medium uppercase tracking-wider">Cuenta Corriente</p>
                                   </div>
                            </Link>
                     </div>

                     {/* KPI Cards */}
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {cards.map((card, idx) => {
                                   const Icon = card.icon;
                                   return (
                                          <div key={idx} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                                                 <div className={`p-4 rounded-lg ${card.bg}`}>
                                                        <Icon className={`h-6 w-6 ${card.color}`} />
                                                 </div>
                                                 <div>
                                                        <p className="text-sm font-medium text-gray-500">{card.title}</p>
                                                        <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                                                        <p className="text-xs text-gray-400">{card.subtext}</p>
                                                 </div>
                                          </div>
                                   );
                            })}
                     </div>

                     {/* Charts Section */}
                     <DashboardCharts data={chartData} title={`Ventas: ${getRangeLabel()}`} />

                     <div className="grid grid-cols-1 gap-6">
                            {/* Low Stock Alert List - Full Width */}
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                                   <div className="absolute top-0 right-0 p-8 opacity-5">
                                          <AlertTriangle className="h-24 w-24 text-orange-600" />
                                   </div>
                                   <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2 text-xl">
                                          <div className="p-2 bg-orange-100 rounded-lg">
                                                 <AlertTriangle className="h-6 w-6 text-orange-600" />
                                          </div>
                                          Reponer Urgentemente
                                   </h3>
                                   {stats.criticalStockItems.length === 0 ? (
                                          <div className="flex flex-col items-center justify-center py-10 text-center bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
                                                 <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                                                        <Package className="h-8 w-8 text-emerald-600" />
                                                 </div>
                                                 <p className="font-bold text-gray-900 text-lg">¡Inventario Impecable!</p>
                                                 <p className="text-sm text-gray-500 max-w-xs mx-auto">No hay productos con stock crítico. Tus estanterías están bien provistas.</p>
                                          </div>
                                   ) : (
                                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                 {stats.criticalStockItems.map((item) => (
                                                        <div key={item.id} className="flex flex-col p-4 bg-orange-50/30 rounded-2xl border border-orange-100 group hover:bg-orange-50 hover:border-orange-200 transition-all shadow-sm">
                                                               <div className="flex justify-between items-start mb-2">
                                                                      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-orange-600 bg-orange-100 px-2 py-1 rounded-md">Stock Crítico</span>
                                                                      <span className="bg-red-600 text-white px-2.5 py-1 rounded-lg text-xs font-black shadow-sm ring-2 ring-red-100">
                                                                             Queda: {item.stockQuantity}
                                                                      </span>
                                                               </div>
                                                               <p className="font-black text-gray-900 uppercase tracking-tight truncate group-hover:text-blue-600 transition-colors text-sm">{item.product.name}</p>
                                                               <p className="text-xs text-gray-500 font-medium">{item.variantName}</p>

                                                               <Link href={`/dashboard/products?search=${item.product.name}`} className="mt-4 text-[10px] font-black uppercase tracking-widest text-center py-2 bg-white text-orange-600 rounded-lg border border-orange-100 hover:bg-orange-600 hover:text-white transition-all">
                                                                      Reponer Stock
                                                               </Link>
                                                        </div>
                                                 ))}
                                          </div>
                                   )}
                            </div>
                     </div>
              </div>
       );
}
