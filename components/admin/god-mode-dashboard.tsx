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
       Loader2,
       Bell,
       Terminal,
       Monitor,
       Settings,
       Rocket,
       Activity,
       Building2,
       ArrowRight,
       Server,
       LayoutGrid,
       List,
       Circle
} from "lucide-react";
import { cn } from "@/lib/utils";

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
       const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

       // Form State
       const [isCreating, setIsCreating] = useState(false);
       const [formData, setFormData] = useState({
              storeName: "",
              plan: "SaaS Professional (Recomendado)",
              ownerName: "",
              email: "",
              password: ""
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
                            setFormData({ ...formData, storeName: "", ownerName: "", email: "", password: "" });
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
              return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount);
       };

       const filteredTenants = tenants.filter(t =>
              t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              t.slug.includes(searchTerm.toLowerCase())
       );

       return (
              <div className="min-h-screen bg-[#0A0A0B] text-slate-100 font-sans selection:bg-yellow-400/30">
                     {/* Masthead / Header */}
                     <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between sticky top-0 bg-[#0A0A0B]/80 backdrop-blur-xl z-20">
                            <div className="flex items-center gap-6 flex-1">
                                   <div className="flex flex-col">
                                          <span className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.2em]">Panel Maestro</span>
                                          <span className="font-bold text-lg tracking-tight text-white">CONTROL DE TENANTS</span>
                                   </div>
                                   <div className="h-8 w-[1px] bg-white/10 hidden md:block"></div>
                                   <div className="relative w-full max-w-xl hidden md:block">
                                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                                          <input
                                                 className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-yellow-500/20 transition-all placeholder:text-slate-600 outline-none text-white font-medium [color-scheme:dark]"
                                                 placeholder="Buscar por ID de Tenant, Dominio o Email de Administrador..."
                                                 type="text"
                                                 value={searchTerm}
                                                 onChange={e => setSearchTerm(e.target.value)}
                                          />
                                   </div>
                            </div>
                            <div className="flex items-center gap-4">
                                   <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20">
                                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                          Core v3.5 Stable
                                   </div>
                                   <button className="p-2.5 bg-white/5 rounded-xl text-slate-500 hover:text-yellow-400 transition-colors group">
                                          <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                   </button>
                            </div>
                     </header>

                     <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
                            {/* KPI Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                   <StatCard
                                          title="Suscripciones Activas"
                                          value={stats.activeStores.toString()}
                                          subtext={`/ ${stats.storesCount} Instancias`}
                                          icon={<Shield className="text-yellow-400 w-6 h-6" />}
                                   />
                                   <StatCard
                                          title="MRR Estimado"
                                          value={formatCurrency(stats.mrr)}
                                          subtext="Ingreso Recurrente"
                                          icon={<CreditCard className="text-emerald-500 w-6 h-6" />}
                                          primary
                                   />
                                   <StatCard
                                          title="Total Usuarios SaaS"
                                          value={stats.usersCount.toString()}
                                          subtext="Usuarios Globales"
                                          icon={<Users className="text-blue-500 w-6 h-6" />}
                                   />
                                   <StatCard
                                          title="Carga del Sistema"
                                          value="0.2%"
                                          subtext="Low Usage"
                                          icon={<Activity className="text-purple-500 w-6 h-6" />}
                                   />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                   {/* Left Column: Provisioning Form */}
                                   <div className="lg:col-span-4">
                                          <div className="bg-[#161618] p-8 rounded-[2rem] border border-white/5 shadow-2xl sticky top-28">
                                                 <div className="flex items-center gap-3 mb-2">
                                                        <Building2 className="text-yellow-400 w-6 h-6 font-bold" />
                                                        <h2 className="text-xl font-black uppercase tracking-tight text-white">Provisionar Tenant</h2>
                                                 </div>
                                                 <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                                                        Cree una nueva instancia aislada para un nuevo cliente. Se generarán las bases de datos y el acceso administrativo automáticamente.
                                                 </p>

                                                 <form className="space-y-6" onSubmit={handleCreate}>
                                                        <div>
                                                               <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Nombre de la Organización</label>
                                                               <input
                                                                      required
                                                                      className="w-full bg-[#0A0A0B] border border-white/10 rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-yellow-500/50 outline-none transition-all text-sm text-white placeholder:text-slate-600 [color-scheme:dark]"
                                                                      placeholder="Ej: MegaKiosco del Este"
                                                                      type="text"
                                                                      value={formData.storeName}
                                                                      onChange={e => setFormData({ ...formData, storeName: e.target.value })}
                                                               />
                                                        </div>
                                                        <div>
                                                               <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Plan de Suscripción</label>
                                                               <select
                                                                      className="w-full bg-[#0A0A0B] border border-white/10 rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-yellow-500 transition-all text-sm outline-none text-white"
                                                                      value={formData.plan}
                                                                      onChange={e => setFormData({ ...formData, plan: e.target.value })}
                                                               >
                                                                      <option className="bg-[#161618]">SaaS Basic (Limitado)</option>
                                                                      <option className="bg-[#161618]">SaaS Professional (Recomendado)</option>
                                                                      <option className="bg-[#161618]">SaaS Enterprise (Ilimitado)</option>
                                                               </select>
                                                        </div>
                                                        <div className="space-y-4 pt-4 border-t border-white/5">
                                                               <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Credenciales del Administrador</label>
                                                               <input
                                                                      required
                                                                      className="w-full bg-[#0A0A0B] border border-white/10 rounded-2xl px-5 py-3.5 text-sm outline-none focus:border-yellow-500/50 text-white placeholder:text-slate-600 [color-scheme:dark]"
                                                                      placeholder="Nombre Completo"
                                                                      type="text"
                                                                      value={formData.ownerName}
                                                                      onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                                                               />
                                                               <input
                                                                      required
                                                                      className="w-full bg-[#0A0A0B] border border-white/10 rounded-2xl px-5 py-3.5 text-sm outline-none focus:border-yellow-500/50 text-white placeholder:text-slate-600 [color-scheme:dark]"
                                                                      placeholder="email@tenant-admin.com"
                                                                      type="email"
                                                                      value={formData.email}
                                                                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                               />
                                                               <input
                                                                      required
                                                                      className="w-full bg-[#0A0A0B] border border-white/10 rounded-2xl px-5 py-3.5 text-sm outline-none focus:border-yellow-500/50 text-white placeholder:text-slate-600 [color-scheme:dark]"
                                                                      placeholder="Contraseña Temporal"
                                                                      type="password"
                                                                      value={formData.password}
                                                                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                                                               />
                                                        </div>
                                                        <button
                                                               disabled={isCreating}
                                                               className="w-full bg-white text-black font-black py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-yellow-400 transition-all shadow-xl shadow-yellow-400/10 group disabled:opacity-50"
                                                               type="submit"
                                                        >
                                                               {isCreating ? (
                                                                      <Loader2 className="w-5 h-5 animate-spin" />
                                                               ) : (
                                                                      <>
                                                                             <Rocket className="text-purple-600 group-hover:text-black group-hover:scale-110 transition-transform w-5 h-5" />
                                                                             <span>DESPLEGAR NUEVO TENANT</span>
                                                                      </>
                                                               )}
                                                        </button>
                                                 </form>
                                          </div>
                                   </div>

                                   {/* Right Column: Active Tenants */}
                                   <div className="lg:col-span-8">
                                          <div className="flex items-center justify-between mb-8">
                                                 <div>
                                                        <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Negocios Activos</h2>
                                                        <p className="text-xs text-slate-500 font-medium">Listado de todas las instancias SaaS desplegadas actualmente.</p>
                                                 </div>
                                                 <div className="flex gap-2 p-1 bg-white/5 rounded-2xl">
                                                        <button
                                                               onClick={() => setViewMode('grid')}
                                                               className={cn("p-2.5 rounded-xl transition-all", viewMode === 'grid' ? "bg-white/10 text-yellow-500 shadow-sm" : "text-slate-500 hover:text-slate-100")}
                                                        >
                                                               <LayoutGrid className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                               onClick={() => setViewMode('list')}
                                                               className={cn("p-2.5 rounded-xl transition-all", viewMode === 'list' ? "bg-white/10 text-yellow-500 shadow-sm" : "text-slate-500 hover:text-slate-100")}
                                                        >
                                                               <List className="w-5 h-5" />
                                                        </button>
                                                 </div>
                                          </div>

                                          {loading ? (
                                                 <div className="py-20 text-center text-slate-600">
                                                        <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" />
                                                        <span>Consultando registros maestros...</span>
                                                 </div>
                                          ) : filteredTenants.length === 0 ? (
                                                 <div className="bg-[#161618] rounded-[2.5rem] border-2 border-dashed border-white/5 flex flex-col items-center justify-center py-32 px-8 text-center">
                                                        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8 relative border border-white/5">
                                                               <Building2 className="w-12 h-12 text-slate-700" />
                                                               <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-yellow-400 rounded-full border-4 border-[#161618] flex items-center justify-center">
                                                                      <Plus className="text-black w-4 h-4 font-bold" />
                                                               </div>
                                                        </div>
                                                        <h3 className="text-xl font-bold mb-3 tracking-tight text-white">Base de datos vacía</h3>
                                                        <p className="text-slate-500 max-w-sm mb-10 leading-relaxed text-sm">
                                                               No hemos detectado nunguna instancia SaaS configurada. Comienza por crear tu primer negocio.
                                                        </p>
                                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                                                               <Terminal className="w-3 h-3" />
                                                               Todos los despliegues son monitoreados en tiempo real
                                                        </div>
                                                 </div>
                                          ) : viewMode === 'grid' ? (
                                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        {filteredTenants.map(tenant => (
                                                               <TenantGridCard key={tenant.id} tenant={tenant} onDelete={() => handleDelete(tenant.id)} />
                                                        ))}
                                                 </div>
                                          ) : (
                                                 <div className="bg-[#161618] rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
                                                        <table className="w-full text-left">
                                                               <thead className="bg-white/5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                                                      <tr>
                                                                             <th className="px-6 py-4">Tenant / Dominio</th>
                                                                             <th className="px-6 py-4">Estado</th>
                                                                             <th className="px-6 py-4 text-center">Métricas</th>
                                                                             <th className="px-6 py-4 text-right">Acciones</th>
                                                                      </tr>
                                                               </thead>
                                                               <tbody className="divide-y divide-white/5">
                                                                      {filteredTenants.map(tenant => (
                                                                             <TenantListRow key={tenant.id} tenant={tenant} onDelete={() => handleDelete(tenant.id)} />
                                                                      ))}
                                                               </tbody>
                                                        </table>
                                                 </div>
                                          )}
                                   </div>
                            </div>
                     </div>
              </div>
       );
}

function StatCard({ title, value, subtext, icon, primary = false }: { title: string, value: string, subtext: string, icon: React.ReactNode, primary?: boolean }) {
       return (
              <div className="bg-[#161618] p-6 rounded-[2rem] border border-white/5 shadow-sm hover:border-white/10 transition-all group">
                     <div className="flex items-center justify-between mb-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{title}</p>
                            <div className="group-hover:scale-110 transition-transform">{icon}</div>
                     </div>
                     <div className="flex items-baseline gap-2">
                            <span className={cn("text-4xl font-black", primary ? "text-yellow-400" : "text-white")}>{value}</span>
                            <span className="text-xs text-slate-500 font-medium">{subtext}</span>
                     </div>
              </div>
       );
}

function TenantGridCard({ tenant, onDelete }: { tenant: Tenant, onDelete: () => void }) {
       return (
              <div className="bg-[#161618] p-6 rounded-[2rem] border border-white/5 hover:border-yellow-500/30 transition-all group relative overflow-hidden shadow-sm">
                     <div className="flex justify-between items-start mb-6">
                            <div className="flex-1">
                                   <div className="flex items-center gap-2 mb-1">
                                          <h4 className="text-xl font-black uppercase tracking-tight text-white group-hover:text-yellow-400 transition-colors uppercase">{tenant.name}</h4>
                                          <Circle className={cn("w-2 h-2 fill-current", tenant.isActive ? "text-emerald-500" : "text-red-500")} />
                                   </div>
                                   <p className="text-[10px] font-mono text-slate-500 bg-white/5 inline-block px-2 py-0.5 rounded uppercase tracking-tighter">
                                          /{tenant.slug}
                                   </p>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <button className="p-2 bg-white/5 rounded-xl hover:text-white transition-colors text-slate-400">
                                          <Edit3 className="w-4 h-4" />
                                   </button>
                                   <button onClick={onDelete} className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10">
                                          <Trash2 className="w-4 h-4" />
                                   </button>
                            </div>
                     </div>

                     <div className="grid grid-cols-3 gap-2 py-4 border-y border-white/5 mb-4 bg-[#0A0A0B]/30 rounded-xl px-2">
                            <div className="text-center">
                                   <p className="text-xl font-black text-white">{tenant._count.products}</p>
                                   <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Stock</p>
                            </div>
                            <div className="text-center">
                                   <p className="text-xl font-black text-white">{tenant._count.users}</p>
                                   <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Admins</p>
                            </div>
                            <div className="text-center">
                                   <p className="text-xl font-black text-white">{tenant._count.sales}</p>
                                   <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Ops</p>
                            </div>
                     </div>

                     <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            <div className="flex items-center gap-1.5 font-medium">
                                   <Users className="w-3 h-3 text-slate-600" />
                                   {tenant.users?.[0]?.email || "sin admin"}
                            </div>
                            <button className="flex items-center gap-1 text-yellow-400 hover:text-yellow-300 transition-colors">
                                   Acceder <ArrowRight className="w-3 h-3" />
                            </button>
                     </div>
              </div>
       );
}

function TenantListRow({ tenant, onDelete }: { tenant: Tenant, onDelete: () => void }) {
       return (
              <tr className="hover:bg-white/5 transition-colors group border-b border-white/5 last:border-0 text-white">
                     <td className="px-6 py-5">
                            <div className="flex flex-col">
                                   <span className="font-bold text-sm text-white uppercase tracking-tight">{tenant.name}</span>
                                   <span className="text-[10px] font-mono text-slate-500">/{tenant.slug}</span>
                            </div>
                     </td>
                     <td className="px-6 py-5">
                            <span className={cn(
                                   "px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                   tenant.isActive ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                            )}>
                                   {tenant.isActive ? 'Active' : 'Halted'}
                            </span>
                     </td>
                     <td className="px-6 py-5">
                            <div className="flex items-center justify-center gap-4 text-center">
                                   <div>
                                          <p className="text-xs font-bold text-white">{tenant._count.products}</p>
                                          <p className="text-[8px] text-slate-600 uppercase">Items</p>
                                   </div>
                                   <div className="w-[1px] h-4 bg-white/10"></div>
                                   <div>
                                          <p className="text-xs font-bold text-white">{tenant._count.sales}</p>
                                          <p className="text-[8px] text-slate-600 uppercase">Sales</p>
                                   </div>
                            </div>
                     </td>
                     <td className="px-6 py-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                                   <button className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-yellow-400 transition-all font-bold">
                                          <LogIn className="w-4 h-4" />
                                   </button>
                                   <button onClick={onDelete} className="p-2 hover:bg-red-500/10 rounded-xl text-slate-400 hover:text-red-500 transition-all font-bold">
                                          <Trash2 className="w-4 h-4" />
                                   </button>
                            </div>
                     </td>
              </tr>
       );
}
