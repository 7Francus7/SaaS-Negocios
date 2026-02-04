"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { createSupplier } from "@/app/actions/suppliers";

interface CreateSupplierModalProps {
       isOpen: boolean;
       onClose: () => void;
       onSuccess: () => void;
}

export function CreateSupplierModal({ isOpen, onClose, onSuccess }: CreateSupplierModalProps) {
       const [loading, setLoading] = useState(false);
       const [error, setError] = useState("");

       const [formData, setFormData] = useState({
              name: "",
              contact: "",
              phone: "",
              email: "",
              address: "",
              notes: ""
       });

       const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
              setFormData({ ...formData, [e.target.name]: e.target.value });
       };

       const handleSubmit = async (e: React.FormEvent) => {
              e.preventDefault();
              setLoading(true);
              setError("");

              try {
                     await createSupplier(formData);
                     setFormData({
                            name: "",
                            contact: "",
                            phone: "",
                            email: "",
                            address: "",
                            notes: ""
                     });
                     onSuccess();
                     onClose();
              } catch {
                     setError("Error al crear el proveedor.");
              } finally {
                     setLoading(false);
              }
       };

       return (
              <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Proveedor">
                     <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                   <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">{error}</div>
                            )}

                            <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-1">Empresa / Nombre *</label>
                                   <input
                                          name="name"
                                          required
                                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                                          value={formData.name}
                                          onChange={handleChange}
                                          placeholder="Ej. Distribuidora del Norte"
                                   />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                   <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">Contacto</label>
                                          <input
                                                 name="contact"
                                                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                 value={formData.contact}
                                                 onChange={handleChange}
                                                 placeholder="Nombre del vendedor"
                                          />
                                   </div>
                                   <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono / WhatsApp</label>
                                          <input
                                                 name="phone"
                                                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                 value={formData.phone}
                                                 onChange={handleChange}
                                                 placeholder="+54 9 11..."
                                          />
                                   </div>
                            </div>

                            <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                   <input
                                          name="email"
                                          type="email"
                                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                                          value={formData.email}
                                          onChange={handleChange}
                                   />
                            </div>

                            <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                                   <input
                                          name="address"
                                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                                          value={formData.address}
                                          onChange={handleChange}
                                   />
                            </div>

                            <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                                   <textarea
                                          name="notes"
                                          rows={2}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                                          value={formData.notes}
                                          onChange={handleChange}
                                          placeholder="Días de visita, CBU, etc."
                                   />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                   <button
                                          type="button"
                                          onClick={onClose}
                                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                          disabled={loading}
                                   >
                                          Cancelar
                                   </button>
                                   <button
                                          type="submit"
                                          disabled={loading}
                                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                                   >
                                          {loading ? "Guardando..." : "Guardar Proveedor"}
                                   </button>
                            </div>
                     </form>
              </Modal>
       );
}
