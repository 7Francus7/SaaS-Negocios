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

              // Validación básica
              if (!formData.storeName.trim()) {
                     alert("El nombre del negocio es obligatorio");
                     return;
              }
              if (!formData.ownerName.trim()) {
                     alert("El nombre del administrador es obligatorio");
                     return;
              }
              if (!formData.email.trim()) {
                     alert("El email es obligatorio");
                     return;
              }
              if (!formData.password.trim()) {
                     alert("La contraseña es obligatoria");
                     return;
              }

              setIsCreating(true);
              try {
                     const res = await createTenant(formData);
                     if (res.success) {
                            alert(`✅ ¡Tenant creado exitosamente!\n\nNegocio: ${formData.storeName}\nEmail: ${formData.email}\nContraseña: ${formData.password}\n\nEl cliente ya puede iniciar sesión.`);
                            setFormData({ storeName: "", plan: "SaaS Professional (Recomendado)", ownerName: "", email: "", password: "" });
                            await loadData();
                     } else {
                            alert(`❌ Error: ${res.error}`);
                     }
              } catch (error) {
                     console.error("Error creating tenant:", error);
                     alert("❌ Error inesperado al crear el tenant. Revisá la consola.");
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
              <div className="min-h-screen bg-gray-50 text-slate-900 font-sans selection:bg-yellow-100">
                     {/* Masthead / Header */}
                     <header className="h-20 border-b border-gray-200 px-8 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-xl z-20">
                            <div className="flex items-center gap-6 flex-1">
                                   <div className="flex flex-col">
                                          <span className="text-[10px] font-black text-yellow-600 uppercase tracking-[0.2em] flex items-center gap-2">
                                                 <Zap className="w-3 h-3 fill-yellow-400 text-yellow-500" />
                                                 Panel Maestro
                                          </span>
                                          <span className="font-bold text-lg tracking-tight text-slate-900">CONTROL DE TENANTS</span>
                                   </div>
                                   <div className="h-8 w-[1px] bg-gray-200 hidden md:block"></div>
                                   <div className="relative w-full max-w-xl hidden md:block">
                                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                          <input
                                                 className="w-full bg-gray-100 border-2 border-transparent rounded-2xl py-3 pl-12 pr-4 text-sm focus:bg-white focus:border-yellow-400/50 transition-all placeholder:text-slate-400 outline-none text-slate-900 font-medium"
                                                 placeholder="Buscar por ID de Tenant, Dominio o Email de Administrador..."
                                                 type="text"
                                                 value={searchTerm}
                                                 onChange={e => setSearchTerm(e.target.value)}
                                          />
                                   </div>
                            </div>
                            <div className="flex items-center gap-4">
                                   <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-100">
                                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                          Core v3.5 Stable
                                   </div>
                                   <button className="p-2.5 bg-gray-100 rounded-xl text-slate-500 hover:text-yellow-600 hover:bg-yellow-50 transition-colors group">
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
                                          icon={<Shield className="text-yellow-500 w-6 h-6" />}
                                   />
                                   <StatCard
                                          title="MRR Estimado"
                                          value={formatCurrency(stats.mrr)}
                                          subtext="Ingreso Recurrente"
                                          icon={<CreditCard className="text-emerald-600 w-6 h-6" />}
                                          primary
                                   />
                                   <StatCard
                                          title="Total Usuarios SaaS"
                                          value={stats.usersCount.toString()}
                                          subtext="Usuarios Globales"
                                          icon={<Users className="text-blue-600 w-6 h-6" />}
                                   />
                                   <StatCard
                                          title="Carga del Sistema"
                                          value="0.2%"
                                          subtext="Low Usage"
                                          icon={<Activity className="text-purple-600 w-6 h-6" />}
                                   />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                   {/* Left Column: Provisioning Form */}
                                   <div className="lg:col-span-4">
                                          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-slate-200/50 sticky top-28">
                                                 <div className="flex items-center gap-3 mb-2">
                                                        <div className="p-2 bg-yellow-50 rounded-lg">
                                                               <Building2 className="text-yellow-600 w-6 h-6 font-bold" />
                                                        </div>
                                                        <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">Provisionar Tenant</h2>
                                                 </div>
                                                 <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                                                        Cree una nueva instancia aislada para un nuevo cliente. Se generarán las bases de datos y el acceso administrativo automáticamente.
                                                 </p>

                                                 <form className="space-y-6" onSubmit={handleCreate}>
                                                        <div>
                                                               <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Nombre de la Organización</label>
                                                               <input
                                                                      required
                                                                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3.5 focus:border-yellow-400 focus:bg-white outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400 font-medium"
                                                                      placeholder="Ej: MegaKiosco del Este"
                                                                      type="text"
                                                                      value={formData.storeName}
                                                                      onChange={e => setFormData({ ...formData, storeName: e.target.value })}
                                                               />
                                                        </div>
                                                        <div>
                                                               <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Plan de Suscripción</label>
                                                               <select
                                                                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3.5 focus:border-yellow-400 focus:bg-white transition-all text-sm outline-none text-slate-900 font-medium appearance-none"
                                                                      value={formData.plan}
                                                                      onChange={e => setFormData({ ...formData, plan: e.target.value })}
                                                               >
                                                                      <option>SaaS Basic (Limitado)</option>
                                                                      <option>SaaS Professional (Recomendado)</option>
                                                                      <option>SaaS Enterprise (Ilimitado)</option>
                                                               </select>
                                                        </div>
                                                        <div className="space-y-4 pt-4 border-t border-gray-100">
                                                               <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Credenciales del Administrador</label>
                                                               <input
                                                                      required
                                                                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3.5 text-sm outline-none focus:border-yellow-400 focus:bg-white text-slate-900 placeholder:text-slate-400 font-medium"
                                                                      placeholder="Nombre Completo"
                                                                      type="text"
                                                                      value={formData.ownerName}
                                                                      onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                                                               />
                                                               <input
                                                                      required
                                                                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3.5 text-sm outline-none focus:border-yellow-400 focus:bg-white text-slate-900 placeholder:text-slate-400 font-medium"
                                                                      placeholder="email@tenant-admin.com"
                                                                      type="email"
                                                                      value={formData.email}
                                                                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                               />
                                                               <input
                                                                      required
                                                                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3.5 text-sm outline-none focus:border-yellow-400 focus:bg-white text-slate-900 placeholder:text-slate-400 font-medium"
                                                                      placeholder="Contraseña Temporal"
                                                                      type="password"
                                                                      value={formData.password}
                                                                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                                                               />
                                                        </div>
                                                        <button
                                                               disabled={isCreating}
                                                               className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 group disabled:opacity-50"
                                                               type="submit"
                                                        >
                                                               {isCreating ? (
                                                                      <Loader2 className="w-5 h-5 animate-spin" />
                                                               ) : (
                                                                      <>
                                                                             <Rocket className="text-yellow-400 group-hover:scale-110 transition-transform w-5 h-5" />
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
                                                        <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Negocios Activos</h2>
                                                        <p className="text-xs text-slate-500 font-medium">Listado de todas las instancias SaaS desplegadas actualmente.</p>
                                                 </div>
                                                 <div className="flex gap-2 p-1 bg-white border border-gray-200 rounded-2xl shadow-sm">
                                                        <button
                                                               onClick={() => setViewMode('grid')}
                                                               className={cn("p-2.5 rounded-xl transition-all", viewMode === 'grid' ? "bg-slate-100 text-slate-900 font-bold" : "text-slate-400 hover:text-slate-600")}
                                                        >
                                                               <LayoutGrid className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                               onClick={() => setViewMode('list')}
                                                               className={cn("p-2.5 rounded-xl transition-all", viewMode === 'list' ? "bg-slate-100 text-slate-900 font-bold" : "text-slate-400 hover:text-slate-600")}
                                                        >
                                                               <List className="w-5 h-5" />
                                                        </button>
                                                 </div>
                                          </div>

                                          {loading ? (
                                                 <div className="py-20 text-center text-slate-400">
                                                        <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-yellow-500" />
                                                        <span>Consultando registros maestros...</span>
                                                 </div>
                                          ) : filteredTenants.length === 0 ? (
                                                 <div className="bg-white rounded-[2.5rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center py-32 px-8 text-center">
                                                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-8 relative border border-gray-100">
                                                               <Building2 className="w-12 h-12 text-slate-300" />
                                                               <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-yellow-400 rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                                                                      <Plus className="text-white w-4 h-4 font-bold" />
                                                               </div>
                                                        </div>
                                                        <h3 className="text-xl font-bold mb-3 tracking-tight text-slate-900">Base de datos vacía</h3>
                                                        <p className="text-slate-500 max-w-sm mb-10 leading-relaxed text-sm">
                                                               No hemos detectado nunguna instancia SaaS configurada. Comienza por crear tu primer negocio.
                                                        </p>
                                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
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
                                                 <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xl shadow-slate-200/50">
                                                        <table className="w-full text-left">
                                                               <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-gray-100">
                                                                      <tr>
                                                                             <th className="px-6 py-4">Tenant / Dominio</th>
                                                                             <th className="px-6 py-4">Estado</th>
                                                                             <th className="px-6 py-4 text-center">Métricas</th>
                                                                             <th className="px-6 py-4 text-right">Acciones</th>
                                                                      </tr>
                                                               </thead>
                                                               <tbody className="divide-y divide-gray-100">
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
              <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl shadow-slate-200/40 hover:scale-[1.02] transition-all group">
                     <div className="flex items-center justify-between mb-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{title}</p>
                            <div className="group-hover:scale-110 transition-transform p-2 bg-gray-50 rounded-lg">{icon}</div>
                     </div>
                     <div className="flex items-baseline gap-2">
                            <span className={cn("text-4xl font-black tracking-tight", primary ? "text-emerald-600" : "text-slate-900")}>{value}</span>
                            <span className="text-xs text-slate-500 font-medium">{subtext}</span>
                     </div>
              </div>
       );
}

function TenantGridCard({ tenant, onDelete }: { tenant: Tenant, onDelete: () => void }) {
       return (
              <div className="bg-white p-6 rounded-[2rem] border border-gray-100 hover:border-yellow-400 transition-all group relative overflow-hidden shadow-xl shadow-slate-200/50">
                     <div className="flex justify-between items-start mb-6">
                            <div className="flex-1">
                                   <div className="flex items-center gap-2 mb-1">
                                          <h4 className="text-xl font-black uppercase tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors uppercase">{tenant.name}</h4>
                                          <Circle className={cn("w-2 h-2 fill-current", tenant.isActive ? "text-emerald-500" : "text-red-500")} />
                                   </div>
                                   <p className="text-[10px] font-mono text-slate-500 bg-gray-100 inline-block px-2 py-0.5 rounded-lg uppercase tracking-tighter border border-gray-200">
                                          /{tenant.slug}
                                   </p>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <button className="p-2 bg-gray-100 rounded-xl hover:text-blue-600 transition-colors text-slate-400">
                                          <Edit3 className="w-4 h-4" />
                                   </button>
                                   <button onClick={onDelete} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10">
                                          <Trash2 className="w-4 h-4" />
                                   </button>
                            </div>
                     </div>

                     <div className="grid grid-cols-3 gap-2 py-4 border-y border-gray-100 mb-4 bg-gray-50/50 rounded-xl px-2">
                            <div className="text-center">
                                   <p className="text-xl font-black text-slate-900">{tenant._count.products}</p>
                                   <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Stock</p>
                            </div>
                            <div className="text-center">
                                   <p className="text-xl font-black text-slate-900">{tenant._count.users}</p>
                                   <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Admins</p>
                            </div>
                            <div className="text-center">
                                   <p className="text-xl font-black text-slate-900">{tenant._count.sales}</p>
                                   <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Ops</p>
                            </div>
                     </div>

                     <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            <div className="flex items-center gap-1.5 font-medium">
                                   <Users className="w-3 h-3 text-slate-400" />
                                   {tenant.users?.[0]?.email || "sin admin"}
                            </div>
                            <button className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors">
                                   Acceder <ArrowRight className="w-3 h-3" />
                            </button>
                     </div>
              </div>
       );
}

function TenantListRow({ tenant, onDelete }: { tenant: Tenant, onDelete: () => void }) {
       return (
              <tr className="hover:bg-gray-50 transition-colors group border-b border-gray-100 last:border-0 text-slate-900">
                     <td className="px-6 py-5">
                            <div className="flex flex-col">
                                   <span className="font-bold text-sm text-slate-900 uppercase tracking-tight">{tenant.name}</span>
                                   <span className="text-[10px] font-mono text-slate-400">/{tenant.slug}</span>
                            </div>
                     </td>
                     <td className="px-6 py-5">
                            <span className={cn(
                                   "px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                   tenant.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"
                            )}>
                                   {tenant.isActive ? 'Active' : 'Halted'}
                            </span>
                     </td>
                     <td className="px-6 py-5">
                            <div className="flex items-center justify-center gap-4 text-center">
                                   <div>
                                          <p className="text-xs font-bold text-slate-900">{tenant._count.products}</p>
                                          <p className="text-[8px] text-slate-400 uppercase">Items</p>
                                   </div>
                                   <div className="w-[1px] h-4 bg-gray-200"></div>
                                   <div>
                                          <p className="text-xs font-bold text-slate-900">{tenant._count.sales}</p>
                                          <p className="text-[8px] text-slate-400 uppercase">Sales</p>
                                   </div>
                            </div>
                     </td>
                     <td className="px-6 py-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                                   <button className="p-2 hover:bg-gray-100 rounded-xl text-slate-400 hover:text-blue-600 transition-all font-bold">
                                          <LogIn className="w-4 h-4" />
                                   </button>
                                   <button onClick={onDelete} className="p-2 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-500 transition-all font-bold">
                                          <Trash2 className="w-4 h-4" />
                                   </button>
                            </div>
                     </td>
              </tr>
       );
}
