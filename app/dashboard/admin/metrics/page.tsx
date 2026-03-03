"use client";

import { useState, useEffect } from "react";
import { Activity, Cpu, Server, HardDrive, Wifi, ShieldAlert, ArrowUpRight, Zap } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

const generateData = () => {
       const data = [];
       for (let i = 0; i < 20; i++) {
              data.push({
                     time: `${i}m`,
                     cpu: Math.floor(Math.random() * 40) + 10,
                     ram: Math.floor(Math.random() * 20) + 40,
              });
       }
       return data;
};

export default function MetricsPage() {
       const [data, setData] = useState(generateData());
       const [ping, setPing] = useState(12);

       useEffect(() => {
              const interval = setInterval(() => {
                     setData(currentData => {
                            const newArray = [...currentData.slice(1)];
                            newArray.push({
                                   time: 'now',
                                   cpu: Math.floor(Math.random() * 40) + 10,
                                   ram: Math.floor(Math.random() * 20) + 40,
                            });
                            return newArray;
                     });
                     setPing(Math.floor(Math.random() * 10) + 8);
              }, 3000);
              return () => clearInterval(interval);
       }, []);

       return (
              <div className="min-h-screen bg-gray-50 text-slate-900 font-sans p-8 max-w-[1600px] mx-auto selection:bg-yellow-100">
                     <div className="flex items-center gap-3 mb-8">
                            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm">
                                   <Activity className="text-emerald-500 w-8 h-8" />
                            </div>
                            <div>
                                   <div className="flex items-center gap-3">
                                          <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">Salud del Core</h1>
                                          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-2">
                                                 <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                                 Totalmente Operativo
                                          </span>
                                   </div>
                                   <p className="text-slate-500 font-medium">Métricas en tiempo real de los nodos principales de la base de datos y procesamiento.</p>
                            </div>
                     </div>

                     {/* Live KPIs */}
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <MetricCard title="Carga del Procesador (CPU)" value={`${data[data.length - 1].cpu}%`} icon={<Cpu />} color="blue" description="Uso promedio en los 4 nodos" />
                            <MetricCard title="Memoria en Uso (RAM)" value={`${data[data.length - 1].ram}%`} icon={<Server />} color="purple" description="24.5 GB / 32 GB Asignados" />
                            <MetricCard title="Lectura de Disco (I/O)" value="12 MB/s" icon={<HardDrive />} color="indigo" description="Latencia SSD: 0.2ms" />
                            <MetricCard title="Latencia de Red" value={`${ping} ms`} icon={<Wifi />} color="emerald" description="Ping hacia AWS East-1" />
                     </div>

                     {/* Main Graph */}
                     <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-slate-200/40 mb-8">
                            <div className="flex items-center justify-between mb-8">
                                   <h3 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                                          <Zap className="h-5 w-5 text-yellow-500" /> Rendimiento en Vivo (Últimos 20 min)
                                   </h3>
                                   <div className="flex gap-4 text-xs font-bold">
                                          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-sm"></div> CPU</div>
                                          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-purple-500 rounded-sm"></div> RAM</div>
                                   </div>
                            </div>
                            <div className="h-[400px] w-full">
                                   <ResponsiveContainer width="100%" height="100%">
                                          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                                 <defs>
                                                        <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                                                               <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                               <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                        </linearGradient>
                                                        <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                                                               <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                                                               <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                                        </linearGradient>
                                                 </defs>
                                                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                 <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickMargin={10} axisLine={false} tickLine={false} />
                                                 <YAxis stroke="#94a3b8" fontSize={12} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                                                 <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }} />
                                                 <Area type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCpu)" activeDot={{ r: 8 }} />
                                                 <Area type="monotone" dataKey="ram" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorRam)" />
                                          </AreaChart>
                                   </ResponsiveContainer>
                            </div>
                     </div>
              </div>
       );
}

function MetricCard({ title, value, description, icon, color }: { title: string, value: string, description: string, icon: React.ReactNode, color: string }) {
       const colors: Record<string, string> = {
              blue: "text-blue-500 bg-blue-50 border-blue-100",
              purple: "text-purple-500 bg-purple-50 border-purple-100",
              indigo: "text-indigo-500 bg-indigo-50 border-indigo-100",
              emerald: "text-emerald-500 bg-emerald-50 border-emerald-100"
       };

       return (
              <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-lg shadow-slate-200/30 hover:-translate-y-1 transition-transform group">
                     <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl border ${colors[color]} group-hover:scale-110 transition-transform`}>
                                   {icon}
                            </div>
                            <ArrowUpRight className="text-gray-300 w-5 h-5 group-hover:text-gray-900 transition-colors" />
                     </div>
                     <p className="text-[10px] uppercase tracking-widest font-black text-gray-400 mb-1">{title}</p>
                     <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">{value}</h3>
                     <p className="text-xs text-gray-500 font-medium">{description}</p>
              </div>
       );
}
