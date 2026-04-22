"use client";

import { useEffect, useState } from "react";
import { getSystemUsers, createSystemUser, updateSystemUser, deleteSystemUser, getSystemStores } from "@/app/actions/admin";
import { Plus, Search, Edit2, Trash2, Shield, Store, User as UserIcon, Loader2, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";

type User = {
       id: string;
       name: string | null;
       email: string;
       role: string;
       storeId: string | null;
       store?: { name: string } | null;
       createdAt: string;
};

type StoreType = {
       id: string;
       name: string;
};

export function AdminUsersClient() {
       const [users, setUsers] = useState<User[]>([]);
       const [stores, setStores] = useState<StoreType[]>([]);
       const [loading, setLoading] = useState(true);
       const [searchTerm, setSearchTerm] = useState("");
       const [isModalOpen, setIsModalOpen] = useState(false);
       const [editingUser, setEditingUser] = useState<User | null>(null);

       // Form State
       const [formData, setFormData] = useState({
              name: "",
              email: "",
              password: "",
              role: "EMPLOYEE",
              storeId: ""
       });
       const [formLoading, setFormLoading] = useState(false);

       const router = useRouter();

       useEffect(() => {
              loadData();
       }, []);

       async function loadData() {
              try {
                     setLoading(true);
                     const [usersRes, storesRes] = await Promise.all([
                            getSystemUsers(),
                            getSystemStores()
                     ]);

                     if (usersRes.success && usersRes.data) setUsers(usersRes.data as any);
                     if (storesRes.success && storesRes.data) setStores(storesRes.data as any);
              } catch (error) {
                     console.error("Error loading admin data", error);
              } finally {
                     setLoading(false);
              }
       }

       const handleOpenModal = (user?: User) => {
              if (user) {
                     setEditingUser(user);
                     setFormData({
                            name: user.name || "",
                            email: user.email,
                            password: "", // Leave blank to keep unchanged
                            role: user.role,
                            storeId: user.storeId || ""
                     });
              } else {
                     setEditingUser(null);
                     setFormData({
                            name: "",
                            email: "",
                            password: "",
                            role: "EMPLOYEE",
                            storeId: ""
                     });
              }
              setIsModalOpen(true);
       };

       const handleSubmit = async (e: React.FormEvent) => {
              e.preventDefault();
              setFormLoading(true);

              try {
                     if (formData.role === 'OWNER' && !formData.storeId) {
                            if (!confirm("⚠️ Estás creando un DUEÑO sin tienda asignada. Esto puede causar que el usuario no vea sus datos correctamente. ¿Deseas continuar?")) {
                                   setFormLoading(false);
                                   return;
                            }
                     }
                     let res;
                     if (editingUser) {
                            const updateData: any = {
                                   name: formData.name,
                                   email: formData.email,
                                   role: formData.role,
                                   storeId: formData.storeId || null
                            };
                            if (formData.password) updateData.password = formData.password;

                            res = await updateSystemUser(editingUser.id, updateData);
                     } else {
                            res = await createSystemUser({
                                   name: formData.name,
                                   email: formData.email,
                                   password: formData.password,
                                   role: formData.role,
                                   storeId: formData.storeId || undefined
                            });
                     }

                     if (res.success) {
                            setIsModalOpen(false);
                            loadData(); // Refresh list
                     } else {
                            alert(res.error || "Error al guardar");
                     }
              } catch (err) {
                     console.error(err);
                     alert("Ocurrió un error inesperado");
              } finally {
                     setFormLoading(false);
              }
       };

       const handleDelete = async (id: string) => {
              if (!confirm("¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.")) return;

              const res = await deleteSystemUser(id);
              if (res.success) {
                     loadData();
              } else {
                     alert("Error al eliminar");
              }
       };

       const filteredUsers = users.filter(user =>
              user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              user.email.toLowerCase().includes(searchTerm.toLowerCase())
       );

       return (
              <div className="space-y-6">
                     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                   <h1 className="text-3xl font-bold tracking-tight text-gray-900">Gestión de Usuarios</h1>
                                   <p className="text-gray-500">Administra todos los usuarios del sistema (God Mode).</p>
                            </div>
                            <button
                                   onClick={() => handleOpenModal()}
                                   className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
                            >
                                   <Plus className="w-4 h-4" />
                                   Nuevo Usuario
                            </button>
                     </div>

                     <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                                   <div className="relative max-w-md">
                                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                          <input
                                                 type="text"
                                                 placeholder="Buscar por nombre o email..."
                                                 value={searchTerm}
                                                 onChange={(e) => setSearchTerm(e.target.value)}
                                                 className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                                          />
                                   </div>
                            </div>

                            <div className="overflow-x-auto">
                                   <table className="w-full text-left text-sm">
                                          <thead className="bg-gray-50 text-gray-600 font-medium">
                                                 <tr>
                                                        <th className="px-6 py-3">Usuario</th>
                                                        <th className="px-6 py-3">Rol</th>
                                                        <th className="px-6 py-3">Tienda Asignada</th>
                                                        <th className="px-6 py-3">Fecha Registro</th>
                                                        <th className="px-6 py-3 text-right">Acciones</th>
                                                 </tr>
                                          </thead>
                                          <tbody className="divide-y divide-gray-100">
                                                 {loading ? (
                                                        <tr>
                                                               <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                                                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                                                      Cargando usuarios...
                                                               </td>
                                                        </tr>
                                                 ) : filteredUsers.length === 0 ? (
                                                        <tr>
                                                               <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                                                      No se encontraron usuarios.
                                                               </td>
                                                        </tr>
                                                 ) : (
                                                        filteredUsers.map((user) => (
                                                               <tr key={user.id} className="hover:bg-gray-50/80 transition-colors group">
                                                                      <td className="px-6 py-3">
                                                                             <div className="flex items-center gap-3">
                                                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 font-bold">
                                                                                           {user.name?.charAt(0).toUpperCase() || <UserIcon className="w-4 h-4" />}
                                                                                    </div>
                                                                                    <div>
                                                                                           <div className="font-medium text-gray-900">{user.name || "Sin nombre"}</div>
                                                                                           <div className="text-gray-500 text-xs">{user.email}</div>
                                                                                    </div>
                                                                             </div>
                                                                      </td>
                                                                      <td className="px-6 py-3">
                                                                             <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${user.role === 'OWNER'
                                                                                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                                                                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                                                                                    }`}>
                                                                                    {user.role === 'OWNER' ? <Shield className="w-3 h-3 mr-1" /> : <UserIcon className="w-3 h-3 mr-1" />}
                                                                                    {user.role}
                                                                             </span>
                                                                      </td>
                                                                      <td className="px-6 py-3">
                                                                             {user.store ? (
                                                                                    <div className="flex items-center gap-1.5 text-gray-700">
                                                                                           <Store className="w-3.5 h-3.5 text-gray-400" />
                                                                                           {user.store.name}
                                                                                    </div>
                                                                             ) : (
                                                                                    <span className="text-gray-400 italic">-- Sin asignar --</span>
                                                                             )}
                                                                      </td>
                                                                      <td className="px-6 py-3 text-gray-500">
                                                                             {new Date(user.createdAt).toLocaleDateString()}
                                                                      </td>
                                                                      <td className="px-6 py-3 text-right">
                                                                             <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                    <button
                                                                                           onClick={() => handleOpenModal(user)}
                                                                                           className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                                                                           title="Editar"
                                                                                    >
                                                                                           <Edit2 className="w-4 h-4" />
                                                                                    </button>
                                                                                    <button
                                                                                           onClick={() => handleDelete(user.id)}
                                                                                           className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                                                           title="Eliminar"
                                                                                    >
                                                                                           <Trash2 className="w-4 h-4" />
                                                                                    </button>
                                                                             </div>
                                                                      </td>
                                                               </tr>
                                                        ))
                                                 )}
                                          </tbody>
                                   </table>
                            </div>
                     </div>

                     {/* MODAL */}
                     {isModalOpen && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                                   <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                                                 <h3 className="font-semibold text-lg text-gray-900">
                                                        {editingUser ? "Editar Usuario" : "Crear Nuevo Usuario"}
                                                 </h3>
                                                 <button
                                                        onClick={() => setIsModalOpen(false)}
                                                        className="text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 rounded-lg p-1 transition-colors"
                                                 >
                                                        <X className="w-5 h-5" />
                                                 </button>
                                          </div>

                                          <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                                 <div className="space-y-2">
                                                        <label className="text-sm font-medium text-gray-700">Nombre Completo</label>
                                                        <input
                                                               type="text"
                                                               required
                                                               value={formData.name}
                                                               onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                               className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                               placeholder="Ej: Juan Pérez"
                                                        />
                                                 </div>

                                                 <div className="space-y-2">
                                                        <label className="text-sm font-medium text-gray-700">Correo Electrónico</label>
                                                        <input
                                                               type="email"
                                                               required
                                                               value={formData.email}
                                                               onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                               className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                               placeholder="juan@ejemplo.com"
                                                        />
                                                 </div>

                                                 <div className="space-y-2">
                                                        <label className="text-sm font-medium text-gray-700">
                                                               {editingUser ? "Nueva Contraseña (Opcional)" : "Contraseña"}
                                                        </label>
                                                        <input
                                                               type="password"
                                                               required={!editingUser}
                                                               value={formData.password}
                                                               onChange={e => setFormData({ ...formData, password: e.target.value })}
                                                               className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                               placeholder={editingUser ? "Dejar en blanco para no cambiar" : "••••••••"}
                                                        />
                                                 </div>

                                                 <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                               <label className="text-sm font-medium text-gray-700">Rol</label>
                                                               <select
                                                                      value={formData.role}
                                                                      onChange={e => setFormData({ ...formData, role: e.target.value })}
                                                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                               >
                                                                      <option value="EMPLOYEE">Empleado</option>
                                                                      <option value="OWNER">Dueño (Owner)</option>
                                                               </select>
                                                        </div>

                                                        <div className="space-y-2">
                                                               <label className="text-sm font-medium text-gray-700">Tienda</label>
                                                               <select
                                                                      value={formData.storeId}
                                                                      onChange={e => setFormData({ ...formData, storeId: e.target.value })}
                                                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                               >
                                                                      <option value="">-- Ninguna --</option>
                                                                      {stores.map(store => (
                                                                             <option key={store.id} value={store.id}>{store.name}</option>
                                                                      ))}
                                                               </select>
                                                        </div>
                                                 </div>

                                                 <div className="pt-4 flex gap-3">
                                                        <button
                                                               type="button"
                                                               onClick={() => setIsModalOpen(false)}
                                                               className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                                        >
                                                               Cancelar
                                                        </button>
                                                        <button
                                                               type="submit"
                                                               disabled={formLoading}
                                                               className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-black transition-colors flex items-center justify-center gap-2"
                                                        >
                                                               {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                                               {editingUser ? "Guardar Cambios" : "Crear Usuario"}
                                                        </button>
                                                 </div>
                                          </form>
                                   </div>
                            </div>
                     )}
              </div>
       );
}
