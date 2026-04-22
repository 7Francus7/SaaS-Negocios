"use client";

import { useState, useCallback, useEffect } from "react";
import { Plus, Search, Truck, Pencil, Trash2, X, MessageSquare, MapPin, Hash } from "lucide-react";
import { getSuppliers, deleteSupplier, updateSupplier } from "@/app/actions/suppliers";
import { CreateSupplierModal } from "@/components/suppliers/create-supplier-modal";
import { Modal } from "@/components/ui/modal";

export default function SuppliersPage() {
       const [suppliers, setSuppliers] = useState<any[]>([]);
       const [loading, setLoading] = useState(true);
       const [isModalOpen, setIsModalOpen] = useState(false);
       const [isEditOpen, setIsEditOpen] = useState(false);
       const [searchTerm, setSearchTerm] = useState("");
       const [editForm, setEditForm] = useState({
              id: 0,
              name: "",
              contact: "",
              phone: "",
              email: "",
              address: "",
              notes: ""
       });

       const fetchSuppliers = useCallback(async () => {
              setLoading(true);
              try {
                     const data = await getSuppliers(searchTerm);
                     setSuppliers(data);
              } catch (e) {
                     console.error(e);
              } finally {
                     setLoading(false);
              }
       }, [searchTerm]);

       useEffect(() => {
              const timeout = setTimeout(() => {
                     fetchSuppliers();
              }, 300);
              return () => clearTimeout(timeout);
       }, [fetchSuppliers]);

       const handleDelete = async (id: number) => {
              if (!confirm("¿Estás seguro de eliminar este proveedor?")) return;
              await deleteSupplier(id);
              fetchSuppliers();
       };

       const openEdit = (supplier: any) => {
              setEditForm({
                     id: supplier.id,
                     name: supplier.name || "",
                     contact: supplier.contact || "",
                     phone: supplier.phone || "",
                     email: supplier.email || "",
                     address: supplier.address || "",
                     notes: supplier.notes || ""
              });
              setIsEditOpen(true);
       };

       const handleEdit = async () => {
              try {
                     const { id, ...data } = editForm;
                     await updateSupplier(id, data);
                     setIsEditOpen(false);
                     fetchSuppliers();
              } catch (e: any) {
                     alert(e.message);
              }
       };

       return (
              <div className="space-y-6">
                     <CreateSupplierModal
                            isOpen={isModalOpen}
                            onClose={() => setIsModalOpen(false)}
                            onSuccess={() => {
                                   fetchSuppliers();
                            }}
                     />

                     <div className="flex items-center justify-between">
                            <div>
                                   <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                                          <Truck className="h-6 w-6 text-gray-600" />
                                          Proveedores
                                   </h1>
                                   <p className="text-sm text-gray-500 mt-1">Administra tus proveedores y compras.</p>
                            </div>
                            <button
                                   onClick={() => setIsModalOpen(true)}
                                   className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
                            >
                                   <Plus className="h-4 w-4 mr-2" />
                                   Nuevo Proveedor
                            </button>
                     </div>

                     {/* Filters */}
                     <div className="flex gap-4 items-center bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                            <div className="relative flex-1">
                                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                   <input
                                          type="text"
                                          placeholder="Buscar empresa, contacto..."
                                          className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                          value={searchTerm}
                                          onChange={(e) => setSearchTerm(e.target.value)}
                                   />
                            </div>
                     </div>

                     {/* Grid of Cards */}
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {loading ? (
                                   <div className="col-span-full py-20 text-center text-gray-400 font-medium">Cargando proveedores...</div>
                            ) : suppliers.length === 0 ? (
                                   <div className="col-span-full py-20 text-center text-gray-400 font-medium">
                                          {searchTerm ? "No se encontraron proveedores con esa búsqueda." : "No hay proveedores registrados."}
                                   </div>
                            ) : (
                                   suppliers.map((supplier) => (
                                          <div key={supplier.id} className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
                                                 <div className="flex justify-between items-start mb-4">
                                                        <div className="space-y-1 w-full">
                                                               <div className="flex items-center justify-between w-full">
                                                                      <h3 className="font-black text-xl text-gray-900 uppercase tracking-tight group-hover:text-blue-600 transition-colors truncate max-w-[80%]">{supplier.name}</h3>
                                                                      {/* Edit & Delete buttons */}
                                                                      <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                                             <button
                                                                                    onClick={() => openEdit(supplier)}
                                                                                    className="p-1.5 rounded-lg bg-blue-50/50 text-blue-600 hover:bg-blue-100 transition-colors"
                                                                                    title="Editar proveedor"
                                                                             >
                                                                                    <Pencil className="h-4 w-4" />
                                                                             </button>
                                                                             <button
                                                                                    onClick={() => handleDelete(supplier.id)}
                                                                                    className="p-1.5 rounded-lg bg-red-50/50 text-red-600 hover:bg-red-100 transition-colors"
                                                                                    title="Eliminar proveedor"
                                                                             >
                                                                                    <Trash2 className="h-4 w-4" />
                                                                             </button>
                                                                      </div>
                                                               </div>
                                                               <p className="text-sm font-bold text-gray-400 capitalize">{supplier.contact || "Sin contacto"}</p>
                                                        </div>
                                                 </div>

                                                 <div className="space-y-3 mb-6 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                                        <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                                                               <Hash className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                                               <span className="truncate">{supplier.phone || "Sin teléfono"}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                                                               <svg className="h-3.5 w-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                                               <span className="truncate text-blue-500 hover:underline cursor-pointer">{supplier.email || "Sin email"}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                                                               <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                                               <span className="truncate">{supplier.address || "Sin dirección"}</span>
                                                        </div>
                                                 </div>

                                                 {supplier.notes && (
                                                        <div className="mb-6">
                                                               <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Notas</p>
                                                               <p className="text-xs text-gray-500 line-clamp-2 italic">{supplier.notes}</p>
                                                        </div>
                                                 )}

                                                 <div className="pt-4 border-t border-gray-50 mt-auto">
                                                        <button
                                                               onClick={() => {
                                                                      const text = `Hola *${supplier.contact || supplier.name}*,\n\nTe escribimos de *${"nuestro local"}* para hacerte un pedido de mercadería.\n\nPor favor, confírmanos disponibilidad. ¡Gracias!`;
                                                                      let url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                                                                      if (supplier.phone) {
                                                                             const cleanPhone = supplier.phone.replace(/[^0-9]/g, '');
                                                                             if (cleanPhone) url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
                                                                      }
                                                                      window.open(url, '_blank');
                                                               }}
                                                               className="w-full bg-[#25D366]/10 text-[#25D366] py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-[#25D366]/20 transition-colors flex items-center justify-center gap-2"
                                                        >
                                                               <MessageSquare className="h-4 w-4" />
                                                               PEDIR STOCK POR WHATSAPP
                                                        </button>
                                                 </div>
                                          </div>
                                   ))
                            )}
                     </div>

                     {/* Edit Modal */}
                     <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="EDITAR PROVEEDOR">
                            <div className="space-y-4">
                                   <div>
                                          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Nombre de empresa *</label>
                                          <input
                                                 className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                                                 value={editForm.name}
                                                 onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                          />
                                   </div>
                                   <div className="grid grid-cols-2 gap-4">
                                          <div>
                                                 <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Contacto</label>
                                                 <input
                                                        className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-sm font-bold outline-none"
                                                        value={editForm.contact}
                                                        onChange={e => setEditForm({ ...editForm, contact: e.target.value })}
                                                 />
                                          </div>
                                          <div>
                                                 <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Teléfono</label>
                                                 <input
                                                        className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-sm font-bold outline-none"
                                                        value={editForm.phone}
                                                        onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                                 />
                                          </div>
                                   </div>
                                   <div className="grid grid-cols-2 gap-4">
                                          <div>
                                                 <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Email</label>
                                                 <input
                                                        className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-sm font-bold outline-none"
                                                        value={editForm.email}
                                                        onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                                 />
                                          </div>
                                          <div>
                                                 <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Dirección</label>
                                                 <input
                                                        className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-sm font-bold outline-none"
                                                        value={editForm.address}
                                                        onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                                                 />
                                          </div>
                                   </div>
                                   <div>
                                          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Notas</label>
                                          <textarea
                                                 className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-sm font-bold outline-none resize-none h-20"
                                                 value={editForm.notes}
                                                 onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                                          />
                                   </div>
                                   <button
                                          onClick={handleEdit}
                                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-100 transition-all uppercase tracking-tight"
                                   >
                                          Guardar Cambios
                                   </button>
                            </div>
                     </Modal>
              </div>
       );
}
