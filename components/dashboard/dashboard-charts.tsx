"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface DashboardChartsProps {
       data: { name: string; total: number }[];
       title?: string;
}

export function DashboardCharts({ data, title }: DashboardChartsProps) {
       return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                     {/* Sales Chart (Bar) */}
                     <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">{title || "Ventas"}</h3>
                            <div className="h-[300px] w-full">
                                   <ResponsiveContainer width="100%" height="100%">
                                          <BarChart data={data}>
                                                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                 <XAxis
                                                        dataKey="name"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: '#6b7280', fontSize: 12 }}
                                                        dy={10}
                                                 />
                                                 <YAxis
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: '#6b7280', fontSize: 12 }}
                                                        tickFormatter={(value) => `$${value}`}
                                                 />
                                                 <Tooltip
                                                        cursor={{ fill: '#f9fafb' }}
                                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                                 />
                                                 <Bar
                                                        dataKey="total"
                                                        fill="#3b82f6"
                                                        radius={[6, 6, 0, 0]}
                                                        barSize={40}
                                                 />
                                          </BarChart>
                                   </ResponsiveContainer>
                            </div>
                     </div>

                     {/* Activity Trend (Area) - Using same data for demo visuals, usually distinct */}
                     <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Tendencia de Ingresos</h3>
                            <div className="h-[300px] w-full">
                                   <ResponsiveContainer width="100%" height="100%">
                                          <AreaChart data={data}>
                                                 <defs>
                                                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                               <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1} />
                                                               <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                        </linearGradient>
                                                 </defs>
                                                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                 <XAxis
                                                        dataKey="name"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: '#6b7280', fontSize: 12 }}
                                                        dy={10}
                                                 />
                                                 <YAxis
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: '#6b7280', fontSize: 12 }}
                                                        tickFormatter={(value) => `$${value}`}
                                                 />
                                                 <Tooltip
                                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                                 />
                                                 <Area
                                                        type="monotone"
                                                        dataKey="total"
                                                        stroke="#8b5cf6"
                                                        strokeWidth={3}
                                                        fillOpacity={1}
                                                        fill="url(#colorTotal)"
                                                 />
                                          </AreaChart>
                                   </ResponsiveContainer>
                            </div>
                     </div>
              </div>
       );
}
