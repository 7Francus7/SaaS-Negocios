"use client";

import { useState, useCallback, useEffect } from "react";
import { Plus, Search, Truck, Pencil, Trash2, X } from "lucide-react";
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

                     {/* Table */}
                     <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                   <thead className="bg-gray-50">
                                          <tr>
                                                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
                                                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                                                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono / Email</th>
                                                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notas</th>
                                                 <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                          </tr>
                                   </thead>
                                   <tbody className="bg-white divide-y divide-gray-200">
                                          {loading ? (
                                                 <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">Cargando proveedores...</td></tr>
                                          ) : suppliers.length === 0 ? (
                                                 <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No hay proveedores registrados.</td></tr>
                                          ) : (
                                                 suppliers.map((supplier) => (
                                                        <tr key={supplier.id} className="hover:bg-gray-50 transition-colors">
                                                               <td className="px-6 py-4 whitespace-nowrap">
                                                                      <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                                                                      <div className="text-xs text-gray-500">{supplier.address}</div>
                                                               </td>
                                                               <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                      {supplier.contact || "-"}
                                                               </td>
                                                               <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                      <div>{supplier.phone}</div>
                                                                      <div className="text-xs text-blue-500">{supplier.email}</div>
                                                               </td>
                                                               <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                                                      {supplier.notes}
                                                               </td>
                                                               <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                                      <button
                                                                             onClick={() => openEdit(supplier)}
                                                                             className="text-blue-600 hover:text-blue-900 mr-3 inline-flex items-center gap-1"
                                                                      >
                                                                             <Pencil className="h-3.5 w-3.5" />
                                                                             Editar
                                                                      </button>
                                                                      <button
                                                                             onClick={() => handleDelete(supplier.id)}
                                                                             className="text-red-600 hover:text-red-900 inline-flex items-center gap-1"
                                                                      >
                                                                             <Trash2 className="h-3.5 w-3.5" />
                                                                             Eliminar
                                                                      </button>
                                                               </td>
                                                        </tr>
                                                 ))
                                          )}
                                   </tbody>
                            </table>
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
