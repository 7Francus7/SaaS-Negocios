"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Users, AlertTriangle, TrendingUp, ShoppingBag, DollarSign } from "lucide-react";
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

                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Low Stock Alert List */}
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                   <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                          <AlertTriangle className="h-5 w-5 text-orange-500" />
                                          Reponer Urgentemente
                                   </h3>
                                   {stats.criticalStockItems.length === 0 ? (
                                          <p className="text-sm text-gray-500">¡Todo en orden! No hay stock crítico.</p>
                                   ) : (
                                          <ul className="space-y-3">
                                                 {stats.criticalStockItems.map((item) => (
                                                        <li key={item.id} className="flex justify-between items-center p-3 bg-orange-50/50 rounded-lg border border-orange-100">
                                                               <div>
                                                                      <p className="font-medium text-gray-800">{item.product.name}</p>
                                                                      <p className="text-xs text-gray-500">{item.variantName}</p>
                                                               </div>
                                                               <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">
                                                                      Queda: {item.stockQuantity}
                                                               </span>
                                                        </li>
                                                 ))}
                                          </ul>
                                   )}
                            </div>

                            {/* Quick Actions */}
                            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-xl shadow-lg text-white">
                                   <h3 className="font-bold text-lg mb-2">Acciones Rápidas</h3>
                                   <p className="text-blue-100 text-sm mb-6">Accesos directos para las tareas más comunes.</p>

                                   <div className="grid grid-cols-2 gap-4">
                                          <a href="/dashboard/pos" className="bg-white/10 hover:bg-white/20 p-4 rounded-lg backdrop-blur-sm transition-colors flex flex-col items-center gap-2 border border-white/10">
                                                 <ShoppingBag className="h-6 w-6" />
                                                 <span className="font-medium">Nueva Venta</span>
                                          </a>
                                          <a href="/dashboard/products" className="bg-white/10 hover:bg-white/20 p-4 rounded-lg backdrop-blur-sm transition-colors flex flex-col items-center gap-2 border border-white/10">
                                                 <Package className="h-6 w-6" />
                                                 <span className="font-medium">Añadir Stock</span>
                                          </a>
                                   </div>
                            </div>
                     </div>
              </div>
       );
}
