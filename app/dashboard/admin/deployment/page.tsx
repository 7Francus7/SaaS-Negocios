"use client";

import { Activity, Globe, ArrowRight, ShieldCheck, Cpu, HardDrive, Wifi, Zap, Hexagon, Maximize2, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const regions = [
       { id: 'us-east-1', name: 'US East (N. Virginia)', status: 'operational', load: '12%', ms: 45, users: '12.4k' },
       { id: 'us-west-2', name: 'US West (Oregon)', status: 'operational', load: '24%', ms: 82, users: '5.2k' },
       { id: 'eu-central-1', name: 'Europe (Frankfurt)', status: 'degraded', load: '89%', ms: 140, users: '8.9k' },
       { id: 'sa-east-1', name: 'South America (São Paulo)', status: 'operational', load: '45%', ms: 12, users: '42.1k' },
       { id: 'ap-northeast-1', name: 'Asia Pacific (Tokyo)', status: 'maintenance', load: '0%', ms: 250, users: '0' },
];

export default function DeploymentPage() {
       return (
              <div className="min-h-screen bg-gray-50 text-slate-900 font-sans p-8 max-w-[1600px] mx-auto selection:bg-purple-100">
                     <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                   <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 shadow-sm">
                                          <Globe className="text-purple-500 w-8 h-8" />
                                   </div>
                                   <div>
                                          <div className="flex items-center gap-3">
                                                 <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">Servidores Edge</h1>
                                                 <span className="px-3 py-1 bg-purple-100 text-purple-700 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-2">
                                                        Multi-Región Activa
                                                 </span>
                                          </div>
                                          <p className="text-slate-500 font-medium">Distribución global de tráfico y estado de los nodos CDN / Edge.</p>
                                   </div>
                            </div>
                            <div className="flex gap-2">
                                   <button className="px-5 py-2.5 rounded-2xl bg-white border border-gray-200 text-slate-600 font-bold text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm">
                                          <RefreshCcw className="w-4 h-4" /> Refrescar Estado
                                   </button>
                                   <button className="px-5 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-white font-bold text-sm flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">
                                          <Maximize2 className="w-4 h-4 text-purple-400" /> Nuevo Despliegue
                                   </button>
                            </div>
                     </div>

                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Infra. Summary Card */}
                            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-slate-200/40 lg:col-span-1">
                                   <div className="flex items-center gap-3 mb-8">
                                          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                                                 <Hexagon className="w-6 h-6 text-slate-400" />
                                          </div>
                                          <div>
                                                 <h3 className="font-black text-xl text-slate-900 tracking-tight">Topología</h3>
                                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resumen Global</p>
                                          </div>
                                   </div>

                                   <div className="space-y-6">
                                          <div className="bg-gray-50/50 p-4 rounded-3xl border border-gray-100">
                                                 <div className="flex justify-between items-end mb-2">
                                                        <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Cpu className="w-4 h-4 text-blue-500" /> Compute Total</span>
                                                        <span className="text-2xl font-black text-slate-900">1.4 THz</span>
                                                 </div>
                                                 <div className="w-full bg-gray-200 rounded-full h-1.5"><div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '45%' }}></div></div>
                                          </div>
                                          <div className="bg-gray-50/50 p-4 rounded-3xl border border-gray-100">
                                                 <div className="flex justify-between items-end mb-2">
                                                        <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><HardDrive className="w-4 h-4 text-purple-500" /> Almacenamiento NVMe</span>
                                                        <span className="text-2xl font-black text-slate-900">8.2 TB</span>
                                                 </div>
                                                 <div className="w-full bg-gray-200 rounded-full h-1.5"><div className="bg-purple-500 h-1.5 rounded-full" style={{ width: '68%' }}></div></div>
                                          </div>
                                          <div className="bg-gray-50/50 p-4 rounded-3xl border border-gray-100">
                                                 <div className="flex justify-between items-end mb-2">
                                                        <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Wifi className="w-4 h-4 text-emerald-500" /> Ancho de Banda</span>
                                                        <span className="text-2xl font-black text-slate-900">45 Gbps</span>
                                                 </div>
                                                 <div className="w-full bg-gray-200 rounded-full h-1.5"><div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '32%' }}></div></div>
                                          </div>
                                   </div>
                            </div>

                            {/* Regions Grid */}
                            <div className="lg:col-span-2 space-y-4">
                                   <div className="flex items-center justify-between mb-4">
                                          <h3 className="font-black text-xl text-slate-900 tracking-tight">Regiones Activas (5)</h3>
                                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><Activity className="w-3 h-3" /> Monitoreo Global en Tiempo Real</span>
                                   </div>

                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          {regions.map(r => (
                                                 <RegionCard key={r.id} region={r} />
                                          ))}

                                          {/* Add New Region Placeholder */}
                                          <button className="bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-[2rem] p-6 flex flex-col items-center justify-center text-slate-400 hover:text-purple-600 hover:border-purple-300 hover:bg-purple-50/20 transition-all group min-h-[160px]">
                                                 <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm">
                                                        <Globe className="w-5 h-5" />
                                                 </div>
                                                 <span className="font-bold text-sm uppercase tracking-wider">Aprovisionar Región</span>
                                                 <span className="text-[10px] font-medium mt-1">AWS / Vercel Edge Networks</span>
                                          </button>
                                   </div>
                            </div>
                     </div>
              </div>
       );
}

function RegionCard({ region }: { region: any }) {
       const isOperational = region.status === 'operational';
       const isDegraded = region.status === 'degraded';
       const isMaintenance = region.status === 'maintenance';

       return (
              <div className={cn("bg-white p-6 rounded-[2rem] border transition-all shadow-xl hover:-translate-y-1 overflow-hidden relative group",
                     isOperational ? "border-emerald-100 shadow-emerald-100/30" :
                            isDegraded ? "border-yellow-200 shadow-yellow-100/30" :
                                   "border-slate-200 shadow-slate-100/30 opacity-70"
              )}>
                     {/* Pulse effect for degraded */}
                     {isDegraded && <div className="absolute inset-0 bg-yellow-500/5 animate-pulse z-0 rounded-[2rem]"></div>}

                     <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                   <div>
                                          <h4 className="font-black text-lg text-slate-900 tracking-tight flex items-center gap-2">
                                                 {region.id.includes('us') ? '🇺🇸' : region.id.includes('eu') ? '🇪🇺' : region.id.includes('sa') ? '🇧🇷' : '🇯🇵'}
                                                 {region.name}
                                          </h4>
                                          <p className="text-[10px] font-mono text-slate-400 mt-1">{region.id}</p>
                                   </div>
                                   <span className={cn(
                                          "px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border",
                                          isOperational ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                 isDegraded ? "bg-yellow-50 text-yellow-600 border-yellow-200" :
                                                        "bg-slate-100 text-slate-500 border-slate-200"
                                   )}>
                                          {region.status}
                                   </span>
                            </div>

                            <div className="flex items-center gap-6 mb-4">
                                   <div className="flex flex-col">
                                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">LATENCY</span>
                                          <span className={cn("text-xl font-black", isOperational ? "text-emerald-600" : isDegraded ? "text-yellow-600" : "text-slate-400")}>
                                                 {region.ms}ms
                                          </span>
                                   </div>
                                   <div className="w-[1px] h-8 bg-gray-100"></div>
                                   <div className="flex flex-col">
                                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">CPU LOAD</span>
                                          <span className="text-xl font-black text-slate-900">{region.load}</span>
                                   </div>
                                   <div className="w-[1px] h-8 bg-gray-100"></div>
                                   <div className="flex flex-col">
                                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">ACTIVE REQ</span>
                                          <span className="text-xl font-black text-blue-600">{region.users}</span>
                                   </div>
                            </div>

                            <div className="w-full bg-slate-50 rounded-full h-1 mt-6 border border-slate-100 overflow-hidden">
                                   {!isMaintenance && (
                                          <div
                                                 className={cn("h-1 rounded-full", isOperational ? "bg-emerald-500" : "bg-yellow-500")}
                                                 style={{ width: region.load }}
                                          ></div>
                                   )}
                            </div>
                     </div>
              </div>
       );
}
