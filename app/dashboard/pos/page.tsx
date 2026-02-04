"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Search, ShoppingCart, Trash2, CreditCard, RotateCcw, Plus, Minus, User, Printer, Check, ArrowRight } from "lucide-react";
import { getProducts, type ProductFilter } from "@/app/actions/products";
import { processSale, type SaleItemInput } from "@/app/actions/sales";
import { getCustomers } from "@/app/actions/customers";
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

       // Payment State
       const [paymentMethod, setPaymentMethod] = useState("EFECTIVO");
       const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
       const [customers, setCustomers] = useState<Awaited<ReturnType<typeof getCustomers>>>([]);

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
       }
       const [lastSale, setLastSale] = useState<SaleReceipt | null>(null);

       // Debounce search
       useEffect(() => {
              const timer = setTimeout(() => {
                     if (query.trim().length > 1) { // Search after 2 chars
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
       }, []);

       const handleSearch = async (q: string) => {
              setLoadingSearch(true);
              try {
                     const results = await getProducts({ searchQuery: q, activeOnly: true });
                     setSearchResults(results);
              } catch (error) {
                     console.error(error);
              } finally {
                     setLoadingSearch(false);
              }
       };

       const addToCart = (variant: any) => {
              setCart((prev) => {
                     const existing = prev.find((item) => item.variantId === variant.id);
                     if (existing) {
                            if (existing.quantity >= variant.stockQuantity) return prev; // prevent overstock
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

       const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

       const handleCheckout = async () => {
              if (cart.length === 0) return;
              setProcessing(true);
              try {
                     const itemsInput: SaleItemInput[] = cart.map(i => ({
                            variantId: i.variantId,
                            quantity: i.quantity
                     }));

                     await processSale(
                            itemsInput,
                            paymentMethod,
                            selectedCustomerId || undefined
                     );

                     // Success
                     setLastSale({
                            items: [...cart],
                            total,
                            date: new Date(),
                            paymentMethod
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

       const handlePrint = () => {
              window.print();
       };

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
                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                   <div className="relative">
                                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                          <input
                                                 ref={searchInputRef}
                                                 className="w-full pl-10 pr-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                                 placeholder="Buscar producto (nombre, código)..."
                                                 value={query}
                                                 onChange={(e) => setQuery(e.target.value)}
                                                 autoFocus
                                          />
                                          {loadingSearch && (
                                                 <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                        <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                                                 </div>
                                          )}
                                   </div>
                            </div>

                            {/* Search Results */}
                            {searchResults.length > 0 ? (
                                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto content-start p-1">
                                          {searchResults.map((variant) => (
                                                 <button
                                                        key={variant.id}
                                                        onClick={() => addToCart(variant)}
                                                        disabled={variant.stockQuantity <= 0}
                                                        className={`flex flex-col p-4 bg-white rounded-lg border text-left transition-all
                        ${variant.stockQuantity <= 0 ? 'opacity-50 cursor-not-allowed border-gray-200' : 'hover:border-blue-500 hover:shadow-md border-gray-200'}`}
                                                 >
                                                        <span className="font-semibold text-gray-900 line-clamp-1">{variant.product.name}</span>
                                                        <span className="text-sm text-gray-500">{variant.variantName}</span>
                                                        <div className="mt-2 flex justify-between items-end">
                                                               <span className="text-lg font-bold text-blue-600">${Number(variant.salePrice)}</span>
                                                               <span className={`text-xs px-2 py-1 rounded-full ${variant.stockQuantity > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                      Stock: {variant.stockQuantity}
                                                               </span>
                                                        </div>
                                                 </button>
                                          ))}
                                   </div>
                            ) : (
                                   <div className="flex-1 flex items-center justify-center text-gray-400 flex-col">
                                          <Search className="h-12 w-12 mb-2 opacity-50" />
                                          <p>Usa el buscador para agregar productos</p>
                                   </div>
                            )}
                     </div>

                     {/* Right Column: Cart & Checkout */}
                     <div className="w-96 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm h-full">
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
                                   <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                                          <ShoppingCart className="h-5 w-5" />
                                          Carrito
                                   </h2>
                                   <button
                                          onClick={() => setCart([])}
                                          className="text-gray-400 hover:text-red-500 transition-colors"
                                          title="Vaciar carrito"
                                   >
                                          <Trash2 className="h-5 w-5" />
                                   </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                   {cart.length === 0 ? (
                                          <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                                 <p className="text-sm">El carrito está vacío</p>
                                          </div>
                                   ) : (
                                          cart.map((item) => (
                                                 <div key={item.variantId} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg group border border-gray-100">
                                                        <div className="flex-1 min-w-0">
                                                               <p className="text-sm font-medium text-gray-900 truncate">{item.productName}</p>
                                                               <p className="text-xs text-gray-500">{item.variantName}</p>
                                                               <p className="text-xs text-blue-600 font-semibold mt-1">${item.price * item.quantity}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2 ml-2">
                                                               <button onClick={() => updateQuantity(item.variantId, -1)} className="p-1 hover:bg-gray-200 rounded text-gray-500">
                                                                      <Minus className="h-3 w-3" />
                                                               </button>
                                                               <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                                                               <button onClick={() => updateQuantity(item.variantId, 1)} className="p-1 hover:bg-gray-200 rounded text-gray-500">
                                                                      <Plus className="h-3 w-3" />
                                                               </button>
                                                               <button onClick={() => removeFromCart(item.variantId)} className="p-1 text-gray-300 hover:text-red-500 ml-1">
                                                                      <Trash2 className="h-4 w-4" />
                                                               </button>
                                                        </div>
                                                 </div>
                                          ))
                                   )}
                            </div>

                            <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl space-y-4">
                                   <div className="flex justify-between items-center text-xl font-bold text-gray-900">
                                          <span>Total</span>
                                          <span>${total.toFixed(2)}</span>
                                   </div>

                                   <button
                                          disabled={cart.length === 0}
                                          onClick={() => setShowPayModal(true)}
                                          className="w-full py-4 text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                                   >
                                          <CreditCard className="h-6 w-6" />
                                          Cobrar
                                   </button>
                            </div>
                     </div>

                     {/* Payment Modal */}
                     <Modal
                            isOpen={showPayModal}
                            onClose={() => setShowPayModal(false)}
                            title="Finalizar Venta"
                     >
                            <div className="space-y-6">
                                   <div className="bg-gray-50 p-4 rounded-lg text-center">
                                          <p className="text-sm text-gray-500 mb-1">Total a Pagar</p>
                                          <p className="text-4xl font-bold text-gray-900">${total.toFixed(2)}</p>
                                   </div>

                                   <div className="space-y-3">
                                          <label className="block text-sm font-medium text-gray-700">Método de Pago</label>
                                          <div className="grid grid-cols-2 gap-3">
                                                 <button
                                                        onClick={() => setPaymentMethod("EFECTIVO")}
                                                        className={`p-3 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2
                            ${paymentMethod === "EFECTIVO" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 hover:bg-gray-50"}`}
                                                 >
                                                        <CreditCard className="h-4 w-4" />
                                                        Efectivo
                                                 </button>
                                                 <button
                                                        onClick={() => setPaymentMethod("CTA_CTE")}
                                                        className={`p-3 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2
                            ${paymentMethod === "CTA_CTE" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 hover:bg-gray-50"}`}
                                                 >
                                                        <User className="h-4 w-4" />
                                                        Cuenta Corriente
                                                 </button>
                                          </div>
                                   </div>

                                   {paymentMethod === "CTA_CTE" && (
                                          <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                                 <label className="block text-sm font-medium text-gray-700">Seleccionar Cliente</label>
                                                 <select
                                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                                                        value={selectedCustomerId || ""}
                                                        onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                                                 >
                                                        <option value="">Seleccione un cliente...</option>
                                                        {customers.map(c => (
                                                               <option key={c.id} value={c.id}>{c.name}</option>
                                                        ))}
                                                 </select>
                                                 {selectedCustomerId === null && (
                                                        <p className="text-xs text-red-500">Debe seleccionar un cliente.</p>
                                                 )}
                                          </div>
                                   )}

                                   <button
                                          onClick={handleCheckout}
                                          disabled={processing || (paymentMethod === "CTA_CTE" && !selectedCustomerId)}
                                          className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                                   >
                                          {processing ? "Procesando..." : "Confirmar Venta"}
                                   </button>
                            </div>
                     </Modal>

                     {/* Success Modal */}
                     <Modal
                            isOpen={showSuccessModal}
                            onClose={handleNewSale}
                            title="¡Venta Exitosa!"
                     >
                            <div className="text-center space-y-6 py-4">
                                   <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                                          <Check className="h-8 w-8" />
                                   </div>

                                   <div className="space-y-1">
                                          <p className="text-lg font-medium text-gray-900">Venta registrada correctamente</p>
                                          <p className="text-sm text-gray-500">Monto total: <span className="font-bold text-gray-900">${lastSale?.total.toFixed(2) || "0.00"}</span></p>
                                   </div>

                                   <div className="grid grid-cols-2 gap-3 mt-8">
                                          <button
                                                 onClick={handlePrint}
                                                 className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                                          >
                                                 <Printer className="h-5 w-5" />
                                                 Imprimir Ticket
                                          </button>
                                          <button
                                                 onClick={handleNewSale}
                                                 className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                          >
                                                 <span className="whitespace-nowrap">Nueva Venta</span>
                                                 <ArrowRight className="h-5 w-5" />
                                          </button>
                                   </div>
                            </div>
                     </Modal>
              </div>
       );
}
