"use client";

import { useState, useCallback, useEffect } from "react";
import { Plus, Search, Filter, Truck } from "lucide-react";
import { getSuppliers, deleteSupplier } from "@/app/actions/suppliers";
import { CreateSupplierModal } from "@/components/suppliers/create-supplier-modal";

// Minimal button UI
function Button({ children, onClick, variant = "primary" }: any) {
       const base = "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
       const styles = {
              primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
              secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500",
              danger: "bg-white text-red-600 border border-gray-200 hover:bg-red-50 focus:ring-red-500"
       };
       return <button onClick={onClick} className={`${base} ${styles[variant as keyof typeof styles]}`}>{children}</button>;
}

export default function SuppliersPage() {
       const [suppliers, setSuppliers] = useState<any[]>([]);
       const [loading, setLoading] = useState(true);
       const [isModalOpen, setIsModalOpen] = useState(false);
       const [searchTerm, setSearchTerm] = useState("");

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
                            <Button onClick={() => setIsModalOpen(true)}>
                                   <Plus className="h-4 w-4 mr-2" />
                                   Nuevo Proveedor
                            </Button>
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

                     {/* Grid of Cards (Better for Suppliers than a table usually, or Table is fine) - Let's use Table */}
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
                                                                      <button className="text-blue-600 hover:text-blue-900 mr-3">Editar</button>
                                                                      <button onClick={() => handleDelete(supplier.id)} className="text-red-600 hover:text-red-900">Eliminar</button>
                                                               </td>
                                                        </tr>
                                                 ))
                                          )}
                                   </tbody>
                            </table>
                     </div>
              </div>
       );
}
