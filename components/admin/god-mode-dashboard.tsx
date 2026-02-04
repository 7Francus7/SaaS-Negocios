"use client";

import { useEffect, useState } from "react";
import {
       getSuperAdminStats,
       getTenants,
       createTenant,
       deleteTenant
} from "@/app/actions/super-admin";
import {
       Zap,
       Search,
       Store,
       Users,
       CreditCard,
       Layers,
       Plus,
       Trash2,
       LogIn,
       Edit3,
       Shield,
       CheckCircle,
       XCircle,
       Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";

// Types
type Tenant = {
       id: string;
       name: string;
       slug: string;
       isActive: boolean;
       createdAt: string;
       users: any[];
       _count: {
              users: number;
              products: number;
              sales: number;
       }
};

type Stats = {
       storesCount: number;
       usersCount: number;
       activeStores: number;
       mrr: number;
};

export function GodModeDashboard() {
       const [stats, setStats] = useState<Stats>({ storesCount: 0, usersCount: 0, activeStores: 0, mrr: 0 });
       const [tenants, setTenants] = useState<Tenant[]>([]);
       const [loading, setLoading] = useState(true);
       const [searchTerm, setSearchTerm] = useState("");

       // Form State
       const [isCreating, setIsCreating] = useState(false);
       const [formData, setFormData] = useState({
              storeName: "",
              plan: "essential",
              ownerName: "",
              email: "",
              password: "admin" // Default for quick creation
       });

       useEffect(() => {
              loadData();
       }, []);

       async function loadData() {
              try {
                     const [statsData, tenantsData] = await Promise.all([
                            getSuperAdminStats(),
                            getTenants()
                     ]);
                     setStats(statsData);
                     setTenants(tenantsData as any);
              } catch (e) {
                     console.error(e);
              } finally {
                     setLoading(false);
              }
       }

       const handleCreate = async (e: React.FormEvent) => {
              e.preventDefault();
              setIsCreating(true);
              try {
                     const res = await createTenant(formData);
                     if (res.success) {
                            setFormData({ ...formData, storeName: "", ownerName: "", email: "" });
                            await loadData();
                     } else {
                            alert(res.error);
                     }
              } finally {
                     setIsCreating(false);
              }
       };

       const handleDelete = async (id: string) => {
              if (!confirm("¿ESTÁS SEGURO? Esto borrará TODO el negocio y sus datos.")) return;
              await deleteTenant(id);
              loadData();
       };

       const formatCurrency = (amount: number) => {
              return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
       };

       const filteredTenants = tenants.filter(t =>
              t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              t.slug.includes(searchTerm.toLowerCase())
       );

       return (
              <div className="min-h-screen bg-[#0a0a0a] text-gray-200 font-sans selection:bg-yellow-500/30">
                     {/* Navbar Global Admin */}
                     <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#0a0a0a] sticky top-0 z-50">
                            <div className="flex items-center gap-3">
                                   <Zap className="text-yellow-500 fill-yellow-500 animate-pulse" />
                                   <span className="font-bold text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">
                                          GOD MODE <span className="text-gray-500 text-sm font-normal ml-2">Panel Global</span>
                                   </span>
                            </div>

                            <div className="flex-1 max-w-xl mx-8 relative">
                                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                   <input
                                          type="text"
                                          placeholder="Buscar club, usuario, email..."
                                          value={searchTerm}
                                          onChange={e => setSearchTerm(e.target.value)}
                                          className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all text-gray-300 placeholder:text-gray-600"
                                   />
                            </div>

                            <div className="text-xs text-gray-500 font-mono">
                                   v3.5 <span className="text-green-500">stable</span>
                            </div>
                     </div>

                     <div className="p-8 max-w-[1600px] mx-auto space-y-8">

                            {/* Top KPI Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                   <div className="p-5 rounded-xl bg-[#111] border border-white/5 flex flex-col justify-between h-32 hover:border-yellow-500/20 transition-colors">
                                          <div className="text-gray-500 text-xs font-bold tracking-widest uppercase">Suscripciones Activas</div>
                                          <div>
                                                 <div className="text-3xl font-bold text-white">{stats.activeStores}</div>
                                                 <div className="text-xs text-gray-500 mt-1">de {stats.storesCount} clubes totales</div>
                                          </div>
                                   </div>
                                   <div className="p-5 rounded-xl bg-[#111] border border-white/5 flex flex-col justify-between h-32 hover:border-green-500/20 transition-colors">
                                          <div className="text-gray-500 text-xs font-bold tracking-widest uppercase">MRR Estimado</div>
                                          <div>
                                                 <div className="text-3xl font-bold text-white">{formatCurrency(stats.mrr)}</div>
                                                 <div className="text-xs text-gray-500 mt-1">Ingreso Mensual Recurrente</div>
                                          </div>
                                   </div>
                                   <div className="p-5 rounded-xl bg-[#111] border border-white/5 flex flex-col justify-between h-32">
                                          <div className="text-gray-500 text-xs font-bold tracking-widest uppercase">Total Usuarios</div>
                                          <div>
                                                 <div className="text-3xl font-bold text-white">{stats.usersCount}</div>
                                                 <div className="text-xs text-gray-500 mt-1">Registrados en plataforma</div>
                                          </div>
                                   </div>
                                   <div className="p-5 rounded-xl bg-[#111] border border-white/5 flex flex-col justify-between h-32">
                                          <div className="text-gray-500 text-xs font-bold tracking-widest uppercase">Versión Sistema</div>
                                          <div>
                                                 <div className="text-3xl font-bold text-white">v3.5</div>
                                                 <div className="text-xs text-gray-500 mt-1">Production Build</div>
                                          </div>
                                   </div>
                            </div>

                            {/* Main Content Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                                   {/* LEFT: Create Form */}
                                   <div className="lg:col-span-1">
                                          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 sticky top-24">
                                                 <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                                                        <Plus className="w-5 h-5 text-yellow-500" />
                                                        Nuevo Negocio
                                                 </h2>
                                                 <p className="text-sm text-gray-500 mb-6">
                                                        Esto generará todo el entorno tenant: Store, Usuario Admin y Configuración Base.
                                                 </p>

                                                 <form onSubmit={handleCreate} className="space-y-4">
                                                        <div>
                                                               <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nombre del Negocio</label>
                                                               <input
                                                                      required
                                                                      value={formData.storeName}
                                                                      onChange={e => setFormData({ ...formData, storeName: e.target.value })}
                                                                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500/50 transition-colors"
                                                                      placeholder="Ej: Kiosco Central"
                                                               />
                                                        </div>

                                                        <div>
                                                               <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Plan de Servicio</label>
                                                               <select
                                                                      value={formData.plan}
                                                                      onChange={e => setFormData({ ...formData, plan: e.target.value })}
                                                                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500/50 transition-colors appearance-none"
                                                               >
                                                                      <option value="essential">Plan Esencial</option>
                                                                      <option value="pro">Plan Profesional</option>
                                                                      <option value="enterprise">Plan Enterprise</option>
                                                               </select>
                                                        </div>

                                                        <div className="pt-4 border-t border-white/5">
                                                               <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Datos del Dueño / Admin</label>
                                                               <div className="space-y-3">
                                                                      <input
                                                                             required
                                                                             value={formData.ownerName}
                                                                             onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                                                                             className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/50 transition-colors"
                                                                             placeholder="Nombre Encargado"
                                                                      />
                                                                      <input
                                                                             type="email"
                                                                             required
                                                                             value={formData.email}
                                                                             onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                                             className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/50 transition-colors"
                                                                             placeholder="admin@nuevonegocio.com"
                                                                      />
                                                                      <input
                                                                             type="text"
                                                                             required
                                                                             value={formData.password}
                                                                             onChange={e => setFormData({ ...formData, password: e.target.value })}
                                                                             className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/50 transition-colors font-mono"
                                                                             placeholder="Password Inicial"
                                                                      />
                                                               </div>
                                                        </div>

                                                        <button
                                                               disabled={isCreating}
                                                               type="submit"
                                                               className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 mt-6"
                                                        >
                                                               {isCreating ? <Loader2 className="animate-spin w-4 h-4" /> : <RocketIcon />}
                                                               Crear SaaS Tenant
                                                        </button>
                                                 </form>
                                          </div>
                                   </div>

                                   {/* RIGHT: Tenant List */}
                                   <div className="lg:col-span-2 space-y-6">
                                          <div className="flex items-center justify-between">
                                                 <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                                                        Negocios Activos ({filteredTenants.length})
                                                 </h2>
                                          </div>

                                          {loading ? (
                                                 <div className="text-center py-12 text-gray-600">Cargando datos del imperio...</div>
                                          ) : (
                                                 <div className="space-y-3">
                                                        {filteredTenants.map(tenant => (
                                                               <div key={tenant.id} className="bg-[#111] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all group">
                                                                      <div className="flex justify-between items-start mb-4">
                                                                             <div>
                                                                                    <div className="flex items-center gap-2 mb-1">
                                                                                           <h3 className="text-xl font-bold text-white">{tenant.name}</h3>
                                                                                           <span className="bg-yellow-500/10 text-yellow-500 text-[10px] font-bold px-2 py-0.5 rounded border border-yellow-500/20">
                                                                                                  PRO
                                                                                           </span>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-4 text-xs font-mono text-gray-500">
                                                                                           <span>ID: {tenant.id.substring(0, 18)}...</span>
                                                                                           <span className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-400">/{tenant.slug}</span>
                                                                                    </div>
                                                                             </div>

                                                                             <div className="flex gap-2">
                                                                                    <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Ver Detalles">
                                                                                           <Edit3 className="w-4 h-4" />
                                                                                    </button>
                                                                                    <button onClick={() => handleDelete(tenant.id)} className="p-2 hover:bg-red-900/20 rounded-lg text-gray-600 hover:text-red-500 transition-colors" title="Eliminar">
                                                                                           <Trash2 className="w-4 h-4" />
                                                                                    </button>
                                                                             </div>
                                                                      </div>

                                                                      <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-4">
                                                                             <div className="text-center">
                                                                                    <div className="text-xl font-bold text-white">{tenant._count?.products || 0}</div>
                                                                                    <div className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Productos</div>
                                                                             </div>
                                                                             <div className="text-center">
                                                                                    <div className="text-xl font-bold text-white">{tenant._count?.users || 0}</div>
                                                                                    <div className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Usuarios</div>
                                                                             </div>
                                                                             <div className="text-center">
                                                                                    <div className="text-xl font-bold text-white">{tenant._count?.sales || 0}</div>
                                                                                    <div className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Ventas</div>
                                                                             </div>
                                                                      </div>
                                                               </div>
                                                        ))}
                                                 </div>
                                          )}
                                   </div>

                            </div>
                     </div>
              </div>
       );
}

function RocketIcon() {
       return (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-purple-600"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path></svg>
       )
}
