"use client";

import { useEffect, useState } from "react";
import {
       BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, PieChart, Pie, Cell
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { AlertTriangle, TrendingUp, Users, ShoppingBag, Calendar, Clock, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { getAdvancedReports, type AdvancedReportData } from "@/app/actions/reports";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function ReportsPage() {
       const [range, setRange] = useState<'today' | '7d' | '30d'>('today');
       const [data, setData] = useState<AdvancedReportData | null>(null);
       const [loading, setLoading] = useState(true);

       useEffect(() => {
              async function fetch() {
                     setLoading(true);
                     try {
                            const report = await getAdvancedReports(range);
                            setData(report);
                     } catch (e) {
                            console.error(e);
                     } finally {
                            setLoading(false);
                     }
              }
              fetch();
       }, [range]);

       if (loading) return <div className="p-12 text-center text-gray-500 animate-pulse">Generando reportes de inteligencia...</div>;
       if (!data) return <div className="p-12 text-center text-red-500">Error al cargar reportes.</div>;

       return (
              <div className="space-y-8 max-w-[1600px] mx-auto">
                     {/* Header */}
                     <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                   <h1 className="text-3xl font-black text-gray-900 tracking-tight">Reportes Avanzados</h1>
                                   <p className="text-gray-500 font-medium mt-1">Análisis profundo del rendimiento de tu negocio.</p>
                            </div>

                            <div className="flex bg-gray-100 p-1 rounded-xl self-start md:self-auto">
                                   {(['today', '7d', '30d'] as const).map((r) => (
                                          <button
                                                 key={r}
                                                 onClick={() => setRange(r)}
                                                 className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${range === r
                                                        ? 'bg-white text-blue-600 shadow-sm'
                                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                                                        }`}
                                          >
                                                 {r === 'today' ? 'Hoy' : r === '7d' ? '7 Días' : '30 Días'}
                                          </button>
                                   ))}
                            </div>
                     </div>

                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                            {/* Sales by Hour Chart */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                   <div className="flex items-center justify-between mb-8">
                                          <div className="flex items-center gap-3">
                                                 <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                        <Clock className="h-6 w-6" />
                                                 </div>
                                                 <h3 className="font-bold text-gray-900">Actividad por Hora</h3>
                                          </div>
                                          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                                 Pico: {data.salesByHour.reduce((max, curr) => curr.salesCount > max.salesCount ? curr : max, { salesCount: 0 }).salesCount} ventas
                                          </span>
                                   </div>
                                   <div className="h-[300px] w-full">
                                          <ResponsiveContainer width="100%" height="100%">
                                                 <AreaChart data={data.salesByHour}>
                                                        <defs>
                                                               <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                                                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                               </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                                        <XAxis
                                                               dataKey="hour"
                                                               axisLine={false}
                                                               tickLine={false}
                                                               tick={{ fill: '#9ca3af', fontSize: 12 }}
                                                               dy={10}
                                                        />
                                                        <YAxis
                                                               axisLine={false}
                                                               tickLine={false}
                                                               tick={{ fill: '#9ca3af', fontSize: 12 }}
                                                               tickFormatter={(value) => `${value}`}
                                                        />
                                                        <Tooltip
                                                               contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                               formatter={(value: any) => [`${value} ventas`, 'Volumen']}
                                                        />
                                                        <Area
                                                               type="monotone"
                                                               dataKey="salesCount"
                                                               stroke="#3b82f6"
                                                               strokeWidth={3}
                                                               fillOpacity={1}
                                                               fill="url(#colorSales)"
                                                        />
                                                 </AreaChart>
                                          </ResponsiveContainer>
                                   </div>
                            </div>

                            {/* Payment Methods Pie */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                   <div className="flex items-center gap-3 mb-8">
                                          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                                 <PieChartIcon className="h-6 w-6" />
                                          </div>
                                          <h3 className="font-bold text-gray-900">Métodos de Pago</h3>
                                   </div>
                                   <div className="flex flex-col md:flex-row items-center gap-8 h-[300px]">
                                          <div className="h-full w-full md:w-1/2">
                                                 <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                               <Pie
                                                                      data={data.paymentMethods}
                                                                      cx="50%"
                                                                      cy="50%"
                                                                      innerRadius={60}
                                                                      outerRadius={80}
                                                                      paddingAngle={5}
                                                                      dataKey="count"
                                                               >
                                                                      {data.paymentMethods.map((entry, index) => (
                                                                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                                      ))}
                                                               </Pie>
                                                               <Tooltip wrapperStyle={{ outline: 'none' }} contentStyle={{ borderRadius: '8px' }} />
                                                        </PieChart>
                                                 </ResponsiveContainer>
                                          </div>
                                          <div className="w-full md:w-1/2 space-y-4">
                                                 {data.paymentMethods.map((method, idx) => (
                                                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                                                               <div className="flex items-center gap-3">
                                                                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                                                      <span className="font-bold text-sm text-gray-700 capitalize">{method.method.toLowerCase().replace('_', ' ')}</span>
                                                               </div>
                                                               <div className="text-right">
                                                                      <p className="font-bold text-gray-900">{formatCurrency(method.total)}</p>
                                                                      <p className="text-xs text-gray-500 font-medium">{method.count} ventas</p>
                                                               </div>
                                                        </div>
                                                 ))}
                                          </div>
                                   </div>
                            </div>
                     </div>

                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Top Products */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                   <div className="flex items-center gap-3 mb-6">
                                          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                                 <ShoppingBag className="h-6 w-6" />
                                          </div>
                                          <h3 className="font-bold text-gray-900">Top Productos</h3>
                                   </div>
                                   <div className="space-y-4">
                                          {data.topProducts.map((p, i) => (
                                                 <div key={i} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors group">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 font-bold">
                                                               {i + 1}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                               <p className="font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">{p.name}</p>
                                                               <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2 overflow-hidden">
                                                                      <div
                                                                             className="bg-indigo-500 h-full rounded-full"
                                                                             style={{ width: `${(p.value / (data.topProducts[0]?.value || 1)) * 100}%` }}
                                                                      />
                                                               </div>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                               <p className="font-bold text-gray-900">{p.value}</p>
                                                               <p className="text-[10px] uppercase font-bold text-gray-400">Unidades</p>
                                                        </div>
                                                 </div>
                                          ))}
                                          {data.topProducts.length === 0 && (
                                                 <p className="text-center text-gray-400 py-8">No hay datos suficientes</p>
                                          )}
                                   </div>
                            </div>

                            {/* Top Customers */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                   <div className="flex items-center gap-3 mb-6">
                                          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                                                 <Users className="h-6 w-6" />
                                          </div>
                                          <h3 className="font-bold text-gray-900">Mejores Clientes</h3>
                                   </div>
                                   <div className="space-y-4">
                                          {data.topCustomers.map((c, i) => (
                                                 <div key={i} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors group">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 font-bold">
                                                               {i + 1}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                               <p className="font-bold text-gray-900 truncate group-hover:text-amber-600 transition-colors">{c.name}</p>
                                                               <p className="text-xs text-gray-500 font-medium">Cliente Frecuente</p>
                                                        </div>
                                                        <div className="text-right shrink-0 bg-gray-50 p-2 rounded-lg border border-gray-100">
                                                               <p className="font-bold text-emerald-600">{formatCurrency(c.value)}</p>
                                                        </div>
                                                 </div>
                                          ))}
                                          {data.topCustomers.length === 0 && (
                                                 <p className="text-center text-gray-400 py-8">No hay datos suficientes</p>
                                          )}
                                   </div>
                            </div>
                     </div>
              </div>
       );
}
