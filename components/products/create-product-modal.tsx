"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { createProduct } from "@/app/actions/products";
import { searchProductByBarcode } from "@/app/actions/external-products";
import { Search } from "lucide-react";

interface CreateProductModalProps {
       isOpen: boolean;
       onClose: () => void;
       onSuccess: () => void;
}

export function CreateProductModal({ isOpen, onClose, onSuccess }: CreateProductModalProps) {
       const [loading, setLoading] = useState(false);
       const [searching, setSearching] = useState(false);
       const [error, setError] = useState("");

       const [formData, setFormData] = useState({
              name: "",
              variantName: "Unidad",
              barcode: "",
              costPrice: "",
              salePrice: "",
              marginPercentage: "",
              stock: "0",
              minStock: "5",
              isWeighable: false,
       });

       const [additionalBarcodes, setAdditionalBarcodes] = useState<string[]>([]);
       const [newBarcode, setNewBarcode] = useState("");

       const addBarcode = () => {
              if (newBarcode && !additionalBarcodes.includes(newBarcode) && newBarcode !== formData.barcode) {
                     setAdditionalBarcodes(prev => [...prev, newBarcode]);
                     setNewBarcode("");
              }
       };

       const removeBarcode = (barcodeToRemove: string) => {
              setAdditionalBarcodes(prev => prev.filter(bc => bc !== barcodeToRemove));
       };

       const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
              const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
              const { name } = e.target;

              if (name === "costPrice" || name === "marginPercentage") {
                     const newCost = name === "costPrice" ? value : formData.costPrice;
                     const newMargin = name === "marginPercentage" ? value : formData.marginPercentage;

                     let newSalePrice = formData.salePrice;
                     if (newCost && newMargin) {
                            const costNum = Number(newCost);
                            const marginNum = Number(newMargin);
                            if (!isNaN(costNum) && !isNaN(marginNum)) {
                                   newSalePrice = String(Math.ceil(costNum + (costNum * marginNum / 100)));
                            }
                     }
                     setFormData({ ...formData, [name]: value, salePrice: newSalePrice });
              } else if (name === "salePrice") {
                     setFormData({ ...formData, salePrice: String(value), marginPercentage: "" });
              } else {
                     setFormData({ ...formData, [name]: value });
              }
       };

       const handleBarcodeSearch = async () => {
              if (!formData.barcode) return;
              setSearching(true);
              setError("");
              try {
                     const product = await searchProductByBarcode(formData.barcode);
                     if (product) {
                            setFormData(prev => ({
                                   ...prev,
                                   name: product.name,
                                   variantName: product.variantName,
                            }));
                     } else {
                            setError("Producto no encontrado en la base de datos global.");
                     }
              } catch (e) {
                     setError("Error al buscar el producto.");
              } finally {
                     setSearching(false);
              }
       };

       const handleSubmit = async (e: React.FormEvent) => {
              e.preventDefault();
              setLoading(true);
              setError("");

              try {
                     const res = await createProduct({
                            name: formData.name,
                            variantName: formData.variantName,
                            barcode: formData.barcode || undefined,
                            barcodes: additionalBarcodes,
                            costPrice: Number(formData.costPrice) || 0,
                            salePrice: Number(formData.salePrice) || 0,
                            stock: Number(formData.stock),
                            minStock: Number(formData.minStock),
                            isWeighable: formData.isWeighable,
                     });

                     if (res.error) {
                            setError(res.error);
                            setLoading(false);
                            return;
                     }

                     // Clear form & close
                     setFormData({
                            name: "",
                            variantName: "Unidad",
                            barcode: "",
                            costPrice: "",
                            salePrice: "",
                            marginPercentage: "",
                            stock: "0",
                            minStock: "5",
                            isWeighable: false,
                     });
                     setAdditionalBarcodes([]);
                     setNewBarcode("");

                     onSuccess();
                     onClose();
              } catch (err: any) {
                     setError(err.message || "Error al crear el producto.");
              } finally {
                     setLoading(false);
              }
       };

       return (
              <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Producto">
                     <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                   <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-100">
                                          {error}
                                   </div>
                            )}

                            <div className="grid grid-cols-1 gap-4">
                                   {/* Barcode Field First for easy scanning */}
                                   <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">Código de Barras Principal</label>
                                          <div className="flex gap-2">
                                                 <input
                                                        name="barcode"
                                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                        placeholder="Ej: 779123456789"
                                                        value={formData.barcode}
                                                        onChange={handleChange}
                                                        autoFocus
                                                 />
                                                 <button
                                                        type="button"
                                                        onClick={handleBarcodeSearch}
                                                        disabled={searching || !formData.barcode}
                                                        className="bg-blue-50 text-blue-600 px-3 py-2 rounded-md border border-blue-200 hover:bg-blue-100 disabled:opacity-50"
                                                        title="Buscar en base de datos global"
                                                 >
                                                        {searching ? <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" /> : <Search className="h-4 w-4" />}
                                                 </button>
                                          </div>
                                   </div>

                                   {/* Additional Barcodes */}
                                   <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">Códigos Adicionales (Ej: otros sabores)</label>
                                          <div className="flex gap-2 mb-2">
                                                 <input
                                                        type="text"
                                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                        placeholder="Escanear otro código..."
                                                        value={newBarcode}
                                                        onChange={(e) => setNewBarcode(e.target.value)}
                                                        onKeyDown={(e) => {
                                                               if (e.key === "Enter") {
                                                                      e.preventDefault();
                                                                      addBarcode();
                                                               }
                                                        }}
                                                 />
                                                 <button
                                                        type="button"
                                                        onClick={addBarcode}
                                                        className="bg-gray-100 text-gray-600 px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-200 text-sm font-medium"
                                                 >
                                                        Agregar
                                                 </button>
                                          </div>
                                          <div className="flex flex-wrap gap-2">
                                                 {additionalBarcodes.map(bc => (
                                                        <span key={bc} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs border border-blue-100">
                                                               {bc}
                                                               <button
                                                                      type="button"
                                                                      onClick={() => removeBarcode(bc)}
                                                                      className="hover:text-red-600 font-bold ml-1"
                                                               >
                                                                      &times;
                                                               </button>
                                                        </span>
                                                 ))}
                                          </div>
                                          {additionalBarcodes.length === 0 && (
                                                 <p className="text-xs text-gray-400">No hay códigos adicionales.</p>
                                          )}
                                   </div>

                                   <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Producto</label>
                                          <input
                                                 name="name"
                                                 required
                                                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                 placeholder="Ej. Coca Cola 1.5L"
                                                 value={formData.name}
                                                 onChange={handleChange}
                                          />
                                   </div>
                                   <div className="grid grid-cols-2 gap-4">
                                          <div>
                                                 <label className="block text-sm font-medium text-gray-700 mb-1">Variedad</label>
                                                 <input
                                                        name="variantName"
                                                        required
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                        value={formData.variantName}
                                                        onChange={handleChange}
                                                 />
                                          </div>
                                          <div className="flex items-end pb-2">
                                                 <span className="text-xs text-gray-400">Variedad por defecto: &quot;Unidad&quot;, o ej. &quot;Pack x6&quot;, &quot;1.5L&quot;</span>
                                          </div>
                                   </div>

                                   <div className="grid grid-cols-3 gap-4">
                                          <div>
                                                 <label className="block text-sm font-medium text-gray-700 mb-1">Precio Costo</label>
                                                 <div className="relative">
                                                        <span className="absolute left-3 top-2 text-gray-500">$</span>
                                                        <input
                                                               name="costPrice"
                                                               type="number"
                                                               step="0.01"
                                                               required
                                                               className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                               placeholder="0.00"
                                                               value={formData.costPrice}
                                                               onChange={handleChange}
                                                        />
                                                 </div>
                                          </div>
                                          <div>
                                                 <label className="block text-sm font-medium text-gray-700 mb-1">Ganancia %</label>
                                                 <div className="relative">
                                                        <span className="absolute left-3 top-2 text-gray-500">%</span>
                                                        <input
                                                               name="marginPercentage"
                                                               type="number"
                                                               step="0.01"
                                                               className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                               placeholder="0"
                                                               value={formData.marginPercentage}
                                                               onChange={handleChange}
                                                        />
                                                 </div>
                                          </div>
                                          <div>
                                                 <label className="block text-sm font-medium text-gray-700 mb-1">Precio Final</label>
                                                 <div className="relative">
                                                        <span className="absolute left-3 top-2 text-gray-500">$</span>
                                                        <input
                                                               name="salePrice"
                                                               type="number"
                                                               step="0.01"
                                                               required
                                                               className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                               placeholder="0.00"
                                                               value={formData.salePrice}
                                                               onChange={handleChange}
                                                        />
                                                 </div>
                                          </div>
                                   </div>

                                   <div className="grid grid-cols-2 gap-4">
                                          <div>
                                                 <label className="block text-sm font-medium text-gray-700 mb-1">Stock Inicial</label>
                                                 <input
                                                        name="stock"
                                                        type="number"
                                                        required
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                        value={formData.stock}
                                                        onChange={handleChange}
                                                 />
                                          </div>
                                          <div>
                                                 <label className="block text-sm font-medium text-gray-700 mb-1">Min. Alerta</label>
                                                 <input
                                                        name="minStock"
                                                        type="number"
                                                        required
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                        value={formData.minStock}
                                                        onChange={handleChange}
                                                 />
                                          </div>
                                   </div>
                                   <div className="flex items-center gap-2 mt-2">
                                          <input
                                                 type="checkbox"
                                                 id="isWeighable"
                                                 name="isWeighable"
                                                 checked={formData.isWeighable}
                                                 onChange={handleChange}
                                                 className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                          />
                                          <label htmlFor="isWeighable" className="text-sm font-medium text-gray-700">
                                                 Se vende por peso (Precio variable en Caja)
                                          </label>
                                   </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                                   <button
                                          type="button"
                                          onClick={onClose}
                                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                          disabled={loading}
                                   >
                                          Cancelar
                                   </button>
                                   <button
                                          type="submit"
                                          disabled={loading}
                                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center shadow-lg"
                                   >
                                          {loading ? "Guardando..." : "Guardar Producto"}
                                   </button>
                            </div>
                     </form>
              </Modal>
       );
}
