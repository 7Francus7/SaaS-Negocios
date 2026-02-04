"use client";

import { useEffect, useState, useCallback } from "react";
import { Tag, Plus, Trash2, Edit2, Play, Pause, AlertCircle, ShoppingBag, CreditCard, Percent } from "lucide-react";
import { getPromotions, createPromotion, togglePromotion, deletePromotion, type PromotionInput } from "@/app/actions/promotions";
import { getCategories } from "@/app/actions/products";
import { Modal } from "@/components/modal"; // Assuming Modal exists, if not I'll create it or use simple div

export default function PromotionsPage() {
       const [promotions, setPromotions] = useState<any[]>([]);
       const [loading, setLoading] = useState(true);
       const [isModalOpen, setIsModalOpen] = useState(false);
       const [categories, setCategories] = useState<any[]>([]);

       const fetchPromos = useCallback(async () => {
              setLoading(true);
              try {
                     const data = await getPromotions();
                     setPromotions(data);
                     const cats = await getCategories();
                     setCategories(cats);
              } catch (e) {
                     console.error(e);
              } finally {
                     setLoading(false);
              }
       }, []);

       useEffect(() => {
              fetchPromos();
       }, [fetchPromos]);

       const [newPromo, setNewPromo] = useState<PromotionInput>({
              name: "",
              type: "PERCENTAGE",
              value: 0,
              allProducts: true,
              itemVariants: [],
              itemCategories: []
       });

       const handleCreate = async () => {
              try {
                     await createPromotion(newPromo);
                     setIsModalOpen(false);
                     fetchPromos();
                     setNewPromo({
                            name: "",
                            type: "PERCENTAGE",
                            value: 0,
                            allProducts: true,
                            itemVariants: [],
                            itemCategories: []
                     });
              } catch (e) {
                     alert("Error al crear promoción");
              }
       };

       const handleToggle = async (id: number, active: boolean) => {
              try {
                     await togglePromotion(id, active);
                     fetchPromos();
              } catch (e) {
                     alert("Error");
              }
       };

       const handleDelete = async (id: number) => {
              if (confirm("¿Eliminar esta promoción?")) {
                     try {
                            await deletePromotion(id);
                            fetchPromos();
                     } catch (e) {
                            alert("Error");
                     }
              }
       };

       return (
              <div className="space-y-6">
                     <div className="flex items-center justify-between">
                            <div>
                                   <h1 className="text-2xl font-bold text-gray-900">Promociones</h1>
                                   <p className="text-gray-500">Configura descuentos automáticos y ofertas.</p>
                            </div>
                            <button
                                   onClick={() => setIsModalOpen(true)}
                                   className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                            >
                                   <Plus className="h-4 w-4" />
                                   Nueva Promo
                            </button>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {loading ? (
                                   <div className="col-span-full py-12 text-center text-gray-500 text-lg">Cargando promociones...</div>
                            ) : promotions.length === 0 ? (
                                   <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
                                          <Tag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                          <p className="text-gray-500">No hay promociones activas.</p>
                                          <button onClick={() => setIsModalOpen(true)} className="text-blue-600 font-medium hover:underline mt-2">Crea la primera ahora</button>
                                   </div>
                            ) : (
                                   promotions.map((promo) => (
                                          <div key={promo.id} className={`bg-white rounded-xl border p-6 shadow-sm transition-all hover:shadow-md ${!promo.active ? 'opacity-75 grayscale-[0.5]' : 'border-blue-100'}`}>
                                                 <div className="flex justify-between items-start mb-4">
                                                        <div className={`p-3 rounded-lg ${promo.active ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                                               {promo.type === 'MULTIBUY' ? <ShoppingBag className="h-6 w-6" /> : promo.type === 'PAYMENT_METHOD' ? <CreditCard className="h-6 w-6" /> : <Percent className="h-6 w-6" />}
                                                        </div>
                                                        <div className="flex gap-2">
                                                               <button onClick={() => handleToggle(promo.id, !promo.active)} className={`p-2 rounded-lg hover:bg-gray-100 ${promo.active ? 'text-orange-600' : 'text-green-600'}`}>
                                                                      {promo.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                                               </button>
                                                               <button onClick={() => handleDelete(promo.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500">
                                                                      <Trash2 className="h-4 w-4" />
                                                               </button>
                                                        </div>
                                                 </div>

                                                 <h3 className="font-bold text-gray-900 text-lg mb-1">{promo.name}</h3>
                                                 <p className="text-sm text-gray-500 mb-4 h-10 line-clamp-2">{promo.description || "Sin descripción"}</p>

                                                 <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                                                        <div className="flex justify-between text-sm">
                                                               <span className="text-gray-500 font-medium">Tipo:</span>
                                                               <span className="text-gray-900 font-bold">{promo.type}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                               <span className="text-gray-500 font-medium">Beneficio:</span>
                                                               <span className="text-blue-600 font-bold">
                                                                      {promo.type === 'MULTIBUY' ? `${promo.buyQuantity}x${promo.payQuantity}` : promo.type === 'FIXED' ? `$${promo.value}` : `${promo.value}%`}
                                                               </span>
                                                        </div>
                                                        {promo.type === 'PAYMENT_METHOD' && (
                                                               <div className="flex justify-between text-sm">
                                                                      <span className="text-gray-500 font-medium">Método:</span>
                                                                      <span className="text-gray-900 font-bold">{promo.paymentMethod}</span>
                                                               </div>
                                                        )}
                                                 </div>
                                          </div>
                                   ))
                            )}
                     </div>

                     {/* Creation Modal */}
                     <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nueva Promoción">
                            <div className="space-y-4 py-2">
                                   <div className="space-y-2">
                                          <label className="text-sm font-medium text-gray-700">Nombre de la Promo</label>
                                          <input
                                                 type="text"
                                                 className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                                 placeholder="Ej: 2x1 en Bebidas o 10% Efectivo"
                                                 value={newPromo.name}
                                                 onChange={e => setNewPromo({ ...newPromo, name: e.target.value })}
                                          />
                                   </div>

                                   <div className="grid grid-cols-2 gap-4">
                                          <div className="space-y-2">
                                                 <label className="text-sm font-medium text-gray-700">Tipo</label>
                                                 <select
                                                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                                        value={newPromo.type}
                                                        onChange={e => setNewPromo({ ...newPromo, type: e.target.value as any })}
                                                 >
                                                        <option value="PERCENTAGE">Porcentaje %</option>
                                                        <option value="FIXED">Monto Fijo $</option>
                                                        <option value="MULTIBUY">Multi-compra (pxq)</option>
                                                        <option value="PAYMENT_METHOD">Por Medio de Pago</option>
                                                 </select>
                                          </div>
                                          <div className="space-y-2">
                                                 <label className="text-sm font-medium text-gray-700">Valor / Beneficio</label>
                                                 <input
                                                        type="number"
                                                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                                        value={newPromo.value}
                                                        onChange={e => setNewPromo({ ...newPromo, value: Number(e.target.value) })}
                                                 />
                                          </div>
                                   </div>

                                   {newPromo.type === 'MULTIBUY' && (
                                          <div className="grid grid-cols-2 gap-4 p-3 bg-blue-50 rounded-lg animate-in fade-in slide-in-from-top-2">
                                                 <div className="space-y-2">
                                                        <label className="text-xs font-bold text-blue-700 uppercase">Lleva (cant.)</label>
                                                        <input type="number" className="w-full border-blue-200 rounded-lg p-2" value={newPromo.buyQuantity || 0} onChange={e => setNewPromo({ ...newPromo, buyQuantity: Number(e.target.value) })} />
                                                 </div>
                                                 <div className="space-y-2">
                                                        <label className="text-xs font-bold text-blue-700 uppercase">Paga (cant.)</label>
                                                        <input type="number" className="w-full border-blue-200 rounded-lg p-2" value={newPromo.payQuantity || 0} onChange={e => setNewPromo({ ...newPromo, payQuantity: Number(e.target.value) })} />
                                                 </div>
                                          </div>
                                   )}

                                   {newPromo.type === 'PAYMENT_METHOD' && (
                                          <div className="space-y-2 p-3 bg-green-50 rounded-lg animate-in fade-in slide-in-from-top-2">
                                                 <label className="text-xs font-bold text-green-700 uppercase">Método de Pago</label>
                                                 <select className="w-full border-green-200 rounded-lg p-2" value={newPromo.paymentMethod} onChange={e => setNewPromo({ ...newPromo, paymentMethod: e.target.value })}>
                                                        <option value="EFECTIVO">Efectivo</option>
                                                        <option value="TRANSFERENCIA">Transferencia</option>
                                                        <option value="TARJETA">Tarjeta</option>
                                                        <option value="CTA_CTE">Cuenta Corriente</option>
                                                 </select>
                                          </div>
                                   )}

                                   <div className="space-y-2 border-t pt-4">
                                          <label className="text-sm font-medium text-gray-700 mb-2 block">Alcance</label>
                                          <div className="flex gap-4">
                                                 <label className="flex items-center gap-2 cursor-pointer">
                                                        <input type="radio" checked={newPromo.allProducts} onChange={() => setNewPromo({ ...newPromo, allProducts: true, itemCategories: [] })} />
                                                        <span className="text-sm">Todos los productos</span>
                                                 </label>
                                                 <label className="flex items-center gap-2 cursor-pointer">
                                                        <input type="radio" checked={!newPromo.allProducts} onChange={() => setNewPromo({ ...newPromo, allProducts: false })} />
                                                        <span className="text-sm">Específico</span>
                                                 </label>
                                          </div>
                                   </div>

                                   {!newPromo.allProducts && (
                                          <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                                 <label className="text-sm font-medium text-gray-700">Seleccionar Categorías</label>
                                                 <div className="flex flex-wrap gap-2">
                                                        {categories.map(cat => (
                                                               <button
                                                                      key={cat.id}
                                                                      onClick={() => {
                                                                             const exists = newPromo.itemCategories?.includes(cat.id);
                                                                             setNewPromo({
                                                                                    ...newPromo,
                                                                                    itemCategories: exists
                                                                                           ? newPromo.itemCategories?.filter(id => id !== cat.id)
                                                                                           : [...(newPromo.itemCategories || []), cat.id]
                                                                             });
                                                                      }}
                                                                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${newPromo.itemCategories?.includes(cat.id) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-blue-400'}`}
                                                               >
                                                                      {cat.name}
                                                               </button>
                                                        ))}
                                                 </div>
                                          </div>
                                   )}

                                   <div className="pt-4">
                                          <button
                                                 onClick={handleCreate}
                                                 className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                                          >
                                                 Guardar Promoción
                                          </button>
                                   </div>
                            </div>
                     </Modal>
              </div>
       );
}
