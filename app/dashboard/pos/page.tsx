"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Search, ShoppingCart, Trash2, CreditCard, RotateCcw, Plus, Minus, User, Printer, Check, ArrowRight, MessageSquare, Tag } from "lucide-react";
import { getProducts, findProductByBarcode, type ProductFilter } from "@/app/actions/products";
import { processSale, type SaleItemInput } from "@/app/actions/sales";
import { getCustomers } from "@/app/actions/customers";
import { getOpenSession } from "@/app/actions/cash";
import { calculatePromotions } from "@/app/actions/promotions";
import { Modal } from "@/components/ui/modal";
import { Ticket } from "@/components/pos/ticket";

// Types
interface CartItem {
       variantId: number;
       productName: string;
       variantName: string;
       price: number;
       quantity: number;
       maxStock: number;
}

export default function POSPage() {
       const [query, setQuery] = useState("");
       const [searchResults, setSearchResults] = useState<Awaited<ReturnType<typeof getProducts>>>([]);
       const [cart, setCart] = useState<CartItem[]>([]);
       const [loadingSearch, setLoadingSearch] = useState(false);

       // Barcode Scanner State
       const lastKeyTime = useRef<number>(0);
       const barcodeBuffer = useRef<string>("");

       // Barcode Scanner Listener
       useEffect(() => {
              const handleGlobalKeyDown = async (e: KeyboardEvent) => {
                     const isInputFocused = document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA';
                     const now = Date.now();
                     const timeDiff = now - lastKeyTime.current;
                     lastKeyTime.current = now;

                     if (e.key === 'Enter') {
                            if (barcodeBuffer.current.length > 3 && !isInputFocused) {
                                   const code = barcodeBuffer.current;
                                   barcodeBuffer.current = "";
                                   await handleBarcodeScan(code);
                            } else {
                                   barcodeBuffer.current = "";
                            }
                            return;
                     }

                     if (e.key.length === 1) {
                            if (timeDiff > 100 && barcodeBuffer.current.length > 0) {
                                   barcodeBuffer.current = "";
                            }
                            barcodeBuffer.current += e.key;
                     }
              };

              window.addEventListener('keydown', handleGlobalKeyDown);
              return () => window.removeEventListener('keydown', handleGlobalKeyDown);
       }, []);

       const handleBarcodeScan = async (code: string) => {
              setLoadingSearch(true);
              try {
                     const product = await findProductByBarcode(code);
                     if (product) {
                            if (product.stockQuantity > 0) {
                                   addToCart(product);
                            } else {
                                   alert(`Producto sin stock: ${product.product.name}`);
                            }
                     }
              } finally {
                     setLoadingSearch(false);
              }
       };

       // Payment & Promotions State
       const [paymentMethod, setPaymentMethod] = useState("EFECTIVO");
       const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
       const [promotionInfo, setPromotionInfo] = useState<{ totalDiscount: number, appliedPromos: string[] }>({
              totalDiscount: 0,
              appliedPromos: []
       });
       const [customers, setCustomers] = useState<Awaited<ReturnType<typeof getCustomers>>>([]);
       const [session, setSession] = useState<any>(null);

       // UI State
       const [showPayModal, setShowPayModal] = useState(false);
       const searchInputRef = useRef<HTMLInputElement>(null);
       const [processing, setProcessing] = useState(false);
       const [showSuccessModal, setShowSuccessModal] = useState(false);

       interface SaleReceipt {
              items: CartItem[];
              total: number;
              date: Date;
              paymentMethod: string;
              store?: any;
       }
       const [lastSale, setLastSale] = useState<SaleReceipt | null>(null);

       // Debounce search
       useEffect(() => {
              const timer = setTimeout(() => {
                     if (query.trim().length > 1) {
                            handleSearch(query);
                     } else {
                            setSearchResults([]);
                     }
              }, 300);
              return () => clearTimeout(timer);
       }, [query]);

       // Initial Data
       useEffect(() => {
              getCustomers().then(setCustomers);
              getOpenSession().then(setSession);
       }, []);

       // Re-calculate promotions
       useEffect(() => {
              const updatePromos = async () => {
                     if (cart.length === 0) {
                            setPromotionInfo({ totalDiscount: 0, appliedPromos: [] });
                            return;
                     }
                     try {
                            const result = await calculatePromotions(cart, paymentMethod);
                            setPromotionInfo({
                                   totalDiscount: result.totalDiscount,
                                   appliedPromos: result.appliedPromos
                            });
                     } catch (e) {
                            console.error("Promo calc error:", e);
                     }
              };
              updatePromos();
       }, [cart, paymentMethod]);

       const handleSearch = async (q: string) => {
              setLoadingSearch(true);
              try {
                     const results = await getProducts({ query: q });
                     setSearchResults(results);
              } finally {
                     setLoadingSearch(false);
              }
       };

       const addToCart = (variant: any) => {
              setCart((prev) => {
                     const existing = prev.find((item) => item.variantId === variant.id);
                     if (existing) {
                            if (existing.quantity >= variant.stockQuantity) return prev;
                            return prev.map((item) =>
                                   item.variantId === variant.id
                                          ? { ...item, quantity: item.quantity + 1 }
                                          : item
                            );
                     }
                     return [
                            ...prev,
                            {
                                   variantId: variant.id,
                                   productName: variant.product.name,
                                   variantName: variant.variantName,
                                   price: Number(variant.salePrice),
                                   quantity: 1,
                                   maxStock: variant.stockQuantity,
                            },
                     ];
              });
              setQuery("");
              setSearchResults([]);
              searchInputRef.current?.focus();
       };

       const removeFromCart = (variantId: number) => {
              setCart((prev) => prev.filter((item) => item.variantId !== variantId));
       };

       const updateQuantity = (variantId: number, delta: number) => {
              setCart((prev) =>
                     prev.map((item) => {
                            if (item.variantId === variantId) {
                                   const newQty = item.quantity + delta;
                                   if (newQty < 1) return item;
                                   if (newQty > item.maxStock) return item;
                                   return { ...item, quantity: newQty };
                            }
                            return item;
                     })
              );
       };

       const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
       const total = Math.max(0, subtotal - promotionInfo.totalDiscount);

       const handleCheckout = async () => {
              if (cart.length === 0) return;
              if (!session) {
                     alert("Debe abrir la caja antes de realizar ventas.");
                     return;
              }
              setProcessing(true);
              try {
                     const itemsInput: SaleItemInput[] = cart.map(i => ({
                            variantId: i.variantId,
                            quantity: i.quantity
                     }));

                     await processSale(
                            itemsInput,
                            paymentMethod,
                            selectedCustomerId || undefined,
                            promotionInfo.totalDiscount
                     );

                     setLastSale({
                            items: [...cart],
                            total,
                            date: new Date(),
                            paymentMethod,
                            store: session.store
                     });

                     setCart([]);
                     setShowPayModal(false);
                     setPaymentMethod("EFECTIVO");
                     setSelectedCustomerId(null);
                     setShowSuccessModal(true);
              } catch (e: any) {
                     alert(e.message || "Error al procesar la venta");
              } finally {
                     setProcessing(false);
              }
       };

       const handlePrint = () => { window.print(); };

       const handleNewSale = () => {
              setShowSuccessModal(false);
              setLastSale(null);
              searchInputRef.current?.focus();
       };

       return (
              <div className="flex h-[calc(100vh-theme(spacing.24))] gap-6">
                     <Ticket data={lastSale} />

                     {/* Left Column: Search & Catalog */}
                     <div className="flex-1 flex flex-col gap-4">
                            <div className="relative">
                                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                   <input
                                          ref={searchInputRef}
                                          type="text"
                                          placeholder="Buscar producto (F2)..."
                                          className="w-full pl-12 pr-4 py-4 bg-white border-2 border-transparent focus:border-blue-500 rounded-2xl shadow-sm outline-none text-lg transition-all"
                                          value={query}
                                          onChange={(e) => setQuery(e.target.value)}
                                   />
                                   {loadingSearch && <div className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin"><RotateCcw className="h-5 w-5 text-blue-500" /></div>}
                            </div>

                            <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                                   <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                                          <h2 className="font-bold text-gray-700">Resultados</h2>
                                          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">{searchResults.length} encontrados</span>
                                   </div>
                                   <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 lg:grid-cols-3 gap-4">
                                          {searchResults.length === 0 && !loadingSearch && (
                                                 <div className="col-span-full flex flex-col items-center justify-center text-gray-400 py-12">
                                                        <Search className="h-12 w-12 mb-3 opacity-20" />
                                                        <p>Empieza a escribir para buscar productos</p>
                                                 </div>
                                          )}
                                          {searchResults.map((variant: any) => (
                                                 <button
                                                        key={variant.id}
                                                        onClick={() => addToCart(variant)}
                                                        disabled={variant.stockQuantity <= 0}
                                                        className="group p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all text-left flex flex-col justify-between disabled:opacity-50"
                                                 >
                                                        <div>
                                                               <p className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors line-clamp-1">{variant.product.name}</p>
                                                               <p className="text-xs text-gray-500 mb-2">{variant.variantName}</p>
                                                        </div>
                                                        <div className="flex items-center justify-between mt-2">
                                                               <span className="text-blue-600 font-bold">${Number(variant.salePrice).toFixed(2)}</span>
                                                               <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${variant.stockQuantity <= 5 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                                                                      Stk: {variant.stockQuantity}
                                                               </span>
                                                        </div>
                                                 </button>
                                          ))}
                                   </div>
                            </div>
                     </div>

                     {/* Right Column: Cart */}
                     <div className="w-96 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
                            <div className="p-4 bg-gray-900 text-white flex items-center gap-3">
                                   <ShoppingCart className="h-6 w-6 text-blue-400" />
                                   <h2 className="font-bold text-lg">Carrito Actual</h2>
                                   <span className="ml-auto bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded text-xs font-bold uppercase">{cart.length} items</span>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                   {cart.length === 0 ? (
                                          <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-3">
                                                 <ShoppingCart className="h-12 w-12 opacity-10" />
                                                 <p className="text-sm font-medium">El carrito está vacío</p>
                                          </div>
                                   ) : (
                                          cart.map((item) => (
                                                 <div key={item.variantId} className="group p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                                                        <div className="flex justify-between items-start mb-2">
                                                               <div className="flex-1 min-w-0">
                                                                      <p className="text-sm font-bold text-gray-900 truncate">{item.productName}</p>
                                                                      <p className="text-[10px] text-gray-500 uppercase font-medium">{item.variantName}</p>
                                                               </div>
                                                               <p className="text-sm font-bold text-blue-600 ml-2">${(item.price * item.quantity).toFixed(2)}</p>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                               <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                                                                      <button onClick={() => updateQuantity(item.variantId, -1)} className="p-1 hover:bg-gray-200 rounded text-gray-500">
                                                                             <Minus className="h-3 w-3" />
                                                                      </button>
                                                                      <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                                                                      <button onClick={() => updateQuantity(item.variantId, 1)} className="p-1 hover:bg-gray-200 rounded text-gray-500">
                                                                             <Plus className="h-3 w-3" />
                                                                      </button>
                                                               </div>
                                                               <button onClick={() => removeFromCart(item.variantId)} className="p-1 text-gray-300 hover:text-red-500 transition-colors">
                                                                      <Trash2 className="h-4 w-4" />
                                                               </button>
                                                        </div>
                                                 </div>
                                          ))
                                   )}
                            </div>

                            <div className="p-4 border-t border-gray-100 bg-gray-50 space-y-4">
                                   {promotionInfo.appliedPromos.length > 0 && (
                                          <div className="space-y-1">
                                                 {promotionInfo.appliedPromos.map((p, idx) => (
                                                        <div key={idx} className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold uppercase tracking-tight">
                                                               <Tag className="h-3 w-3" />
                                                               <span>{p}</span>
                                                        </div>
                                                 ))}
                                                 <div className="flex justify-between text-sm text-emerald-600 font-bold border-t border-emerald-100 pt-1 mt-1">
                                                        <span>Descuento Aplicado</span>
                                                        <span>-${promotionInfo.totalDiscount.toFixed(2)}</span>
                                                 </div>
                                          </div>
                                   )}

                                   <div className="flex justify-between items-center text-2xl font-black text-gray-900">
                                          <span>Total</span>
                                          <span>${total.toFixed(2)}</span>
                                   </div>

                                   {!session && (
                                          <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-xs text-center font-bold uppercase tracking-tight">
                                                 ⚠️ La caja está cerrada
                                          </div>
                                   )}

                                   <button
                                          disabled={cart.length === 0 || !session}
                                          onClick={() => setShowPayModal(true)}
                                          className="w-full py-4 text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                                   >
                                          <CreditCard className="h-6 w-6" />
                                          Cobrar
                                   </button>
                            </div>
                     </div>

                     {/* Payment Modal */}
                     <Modal isOpen={showPayModal} onClose={() => setShowPayModal(false)} title="Finalizar Venta">
                            <div className="space-y-6">
                                   <div className="bg-gray-50 p-6 rounded-2xl text-center border border-gray-100">
                                          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Total a Pagar</p>
                                          <p className="text-5xl font-black text-gray-900">${total.toFixed(2)}</p>
                                   </div>

                                   <div className="space-y-3">
                                          <label className="block text-sm font-bold text-gray-700 uppercase tracking-tight">Método de Pago</label>
                                          <div className="grid grid-cols-2 gap-3">
                                                 <button
                                                        onClick={() => setPaymentMethod("EFECTIVO")}
                                                        className={`p-4 rounded-xl border-2 text-sm font-bold transition-all flex flex-col items-center gap-2
                             ${paymentMethod === "EFECTIVO" ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm" : "border-gray-100 hover:border-gray-200 hover:bg-gray-50 text-gray-500"}`}
                                                 >
                                                        <CreditCard className="h-6 w-6" />
                                                        Efectivo
                                                 </button>
                                                 <button
                                                        onClick={() => setPaymentMethod("CTA_CTE")}
                                                        className={`p-4 rounded-xl border-2 text-sm font-bold transition-all flex flex-col items-center gap-2
                             ${paymentMethod === "CTA_CTE" ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm" : "border-gray-100 hover:border-gray-200 hover:bg-gray-50 text-gray-500"}`}
                                                 >
                                                        <User className="h-6 w-6" />
                                                        Cuenta Corriente
                                                 </button>
                                          </div>
                                   </div>

                                   {paymentMethod === "CTA_CTE" && (
                                          <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                                 <label className="block text-sm font-bold text-gray-700 uppercase">Seleccionar Cliente</label>
                                                 <select
                                                        className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none transition-all font-medium"
                                                        value={selectedCustomerId || ""}
                                                        onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                                                 >
                                                        <option value="">Seleccione un cliente...</option>
                                                        {customers.map(c => (
                                                               <option key={c.id} value={c.id}>{c.name}</option>
                                                        ))}
                                                 </select>
                                          </div>
                                   )}

                                   <button
                                          onClick={handleCheckout}
                                          disabled={processing || (paymentMethod === "CTA_CTE" && !selectedCustomerId)}
                                          className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xl rounded-2xl shadow-xl shadow-emerald-100 disabled:opacity-50 disabled:shadow-none transition-all"
                                   >
                                          {processing ? "Procesando..." : "CONFIRMAR VENTA"}
                                   </button>
                            </div>
                     </Modal>

                     {/* Success Modal */}
                     <Modal isOpen={showSuccessModal} onClose={handleNewSale} title="¡Venta Exitosa!">
                            <div className="text-center space-y-6 py-4">
                                   <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4 animate-bounce">
                                          <Check className="h-10 w-10" />
                                   </div>
                                   <div className="space-y-1">
                                          <p className="text-2xl font-black text-gray-900">Venta Registrada</p>
                                          <p className="text-sm text-gray-500 font-medium">Monto total: <span className="text-lg font-bold text-gray-900">${lastSale?.total.toFixed(2) || "0.00"}</span></p>
                                   </div>
                                   <div className="flex flex-col gap-3 mt-8">
                                          <div className="grid grid-cols-2 gap-3">
                                                 <button onClick={handlePrint} className="flex items-center justify-center gap-2 px-4 py-4 bg-white border-2 border-gray-100 text-gray-700 font-bold rounded-xl hover:border-gray-200 transition-all">
                                                        <Printer className="h-5 w-5" /> Imprimir
                                                 </button>
                                                 <button onClick={() => {
                                                        if (!lastSale) return;
                                                        const text = `📋 *Detalle de Venta*\n\n` + lastSale.items.map(i => `• ${i.productName}: $${i.price.toFixed(2)} x ${i.quantity}`).join('\n') + `\n\n💰 *Total: $${lastSale.total.toFixed(2)}*\n\nGracias por su compra en *${lastSale.store?.name || 'nuestro negocio'}*!`;
                                                        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                                                 }} className="flex items-center justify-center gap-2 px-4 py-4 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100">
                                                        <MessageSquare className="h-5 w-5" /> WhatsApp
                                                 </button>
                                          </div>
                                          <button onClick={handleNewSale} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100">
                                                 Nueva Venta <ArrowRight className="h-5 w-5" />
                                          </button>
                                   </div>
                            </div>
                     </Modal>
              </div>
       );
}
