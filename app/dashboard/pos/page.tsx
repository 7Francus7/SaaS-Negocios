"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Search, ShoppingCart, Trash2, CreditCard, RotateCcw, Plus, Minus, User, Printer, Check, ArrowRight, MessageSquare, Tag, QrCode } from "lucide-react";
import { getProducts, findProductByBarcode, type ProductFilter } from "@/app/actions/products";
import { processSale, type SaleItemInput } from "@/app/actions/sales";
import { getCustomers } from "@/app/actions/customers";
import { getOpenSession } from "@/app/actions/cash";
import { calculatePromotions } from "@/app/actions/promotions";
import { Modal } from "@/components/ui/modal";
import { Ticket } from "@/components/pos/ticket";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/providers/toast-provider";

// Sounds (Base64 for reliability/speed in demo)
const BEEP_SOUND = "data:audio/wav;base64,UklGRl9vT1BXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"; // Tiny placeholder, will replace better or use simple osc?
// Let's use a real beep base64 if possible, or just a simple function. 
// Actually, simple Oscillator is better for "Beep" without large strings.

const playBeep = () => {
       const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
       const osc = ctx.createOscillator();
       const gain = ctx.createGain();
       osc.connect(gain);
       gain.connect(ctx.destination);
       osc.frequency.setValueAtTime(1000, ctx.currentTime);
       osc.type = "sine";
       gain.gain.setValueAtTime(0.1, ctx.currentTime);
       osc.start();
       osc.stop(ctx.currentTime + 0.1);
};

const playCashSound = () => {
       // Simple "Cha-Ching" simulation with oscillators or just silent if complex.
       // Let's try a simple rising arpeggio for "Success"
       const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
       const now = ctx.currentTime;

       [440, 554, 659, 880].forEach((freq, i) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.frequency.setValueAtTime(freq, now + i * 0.1);
              osc.type = 'triangle';
              gain.gain.setValueAtTime(0.1, now + i * 0.1);
              gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3);
              osc.start(now + i * 0.1);
              osc.stop(now + i * 0.1 + 0.3);
       });
};

// Types
interface CartItem {
       variantId: number;
       productName: string;
       variantName: string;
       price: number;
       quantity: number;
       maxStock: number;
       isWeighable?: boolean;
}

export default function POSPage() {
       const [query, setQuery] = useState("");
       const [searchResults, setSearchResults] = useState<Awaited<ReturnType<typeof getProducts>>>([]);
       const [cart, setCart] = useState<CartItem[]>([]);
       const [loadingSearch, setLoadingSearch] = useState(false);
       const { toast } = useToast();
       const [isClient, setIsClient] = useState(false);
       // Mobile tab: "catalog" or "cart"
       const [mobileTab, setMobileTab] = useState<"catalog" | "cart">("catalog");

       // Persistence
       useEffect(() => {
              setIsClient(true);
              const saved = localStorage.getItem("pos-cart");
              if (saved) {
                     try {
                            setCart(JSON.parse(saved));
                     } catch (e) {
                            console.error("Error parsing cart", e);
                     }
              }
       }, []);

       useEffect(() => {
              if (isClient) {
                     localStorage.setItem("pos-cart", JSON.stringify(cart));
              }
       }, [cart, isClient]);

       const handleBarcodeScan = useCallback(async (code: string) => {
              if (loadingSearch) return;
              setLoadingSearch(true);
              try {
                     const product = await findProductByBarcode(code);
                     if (product) {
                            addToCart(product);
                            toast(`Agregado: ${product.product.name}`, "success");
                     } else {
                            toast(`Código no encontrado: ${code}`, "warning");
                     }
              } catch (error) {
                     console.error("Scan error:", error);
              } finally {
                     setLoadingSearch(false);
              }
       }, [loadingSearch, toast]);

       // Robust Barcode Scanner Listener
       useEffect(() => {
              let buffer = "";
              let lastTime = 0;

              const handleKeyDown = (e: KeyboardEvent) => {
                     // Ignore if it's a modifier key
                     if (["Shift", "Control", "Alt", "Meta"].includes(e.key)) return;

                     const now = Date.now();
                     const timeDiff = now - lastTime;
                     lastTime = now;

                     // If the delay between keys is very short (< 50ms), it's likely a scanner
                     const isScanner = timeDiff < 50;

                     if (e.key === 'Enter') {
                            if (buffer.length > 2) {
                                   handleBarcodeScan(buffer);
                                   buffer = "";
                                   e.preventDefault();
                                   e.stopPropagation();
                            } else {
                                   buffer = "";
                            }
                            return;
                     }

                     // Append characters to buffer
                     if (e.key.length === 1) {
                            if (!isScanner && buffer.length > 0 && timeDiff > 100) {
                                   // If it's a slow key and we had a buffer, it was probably manual typing, so reset
                                   buffer = "";
                            }
                            buffer += e.key;
                     }
              };

              window.addEventListener('keydown', handleKeyDown, true);
              return () => window.removeEventListener('keydown', handleKeyDown, true);
       }, [handleBarcodeScan]);

       // Weighable Modal State
       const [weighableProduct, setWeighableProduct] = useState<any>(null);
       const [weighablePrice, setWeighablePrice] = useState("");
       const [weighableQuantity, setWeighableQuantity] = useState("1");

       // Payment & Promotions State
       const [paymentMethod, setPaymentMethod] = useState("EFECTIVO");
       const [isSplitPayment, setIsSplitPayment] = useState(false);
       const [splitPayments, setSplitPayments] = useState<{ method: string, amount: number }[]>([
              { method: "EFECTIVO", amount: 0 },
              { method: "TRANSFERENCIA", amount: 0 }
       ]);
       const [tenderedAmount, setTenderedAmount] = useState("");
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
              customer?: any;
              store?: any;
       }
       const [lastSale, setLastSale] = useState<SaleReceipt | null>(null);

       // Debounce search
       useEffect(() => {
              const timer = setTimeout(() => {
                     if (query.trim().length > 1) {
                            handleSearch(query);
                     } else if (query.trim().length === 0) {
                            // Default state: Show all products
                            handleSearch("");
                     }
              }, 300);
              return () => clearTimeout(timer);
       }, [query]);

       const [storeSettings, setStoreSettings] = useState<any>(null);

       // Initial Data
       useEffect(() => {
              getCustomers().then(setCustomers);
              getOpenSession().then(setSession);
              import("@/app/actions/settings").then(mod => {
                     mod.getStoreSettings().then(setStoreSettings);
              });
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
                     const results = await getProducts({ searchQuery: q });
                     setSearchResults(results);
              } finally {
                     setLoadingSearch(false);
              }
       };

       const addToCart = (variant: any, customPrice?: number, customQuantity?: number) => {
              if (variant.isWeighable && customPrice === undefined) {
                     setWeighableProduct(variant);
                     setWeighablePrice("");
                     setWeighableQuantity("1");
                     return;
              }

              setCart((prev) => {
                     const existing = prev.find((item) => item.variantId === variant.id);
                     const qtyToAdd = customQuantity || 1;

                     if (existing && !variant.isWeighable) {
                            // Allow bypass stock check
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
                                   productName: variant.product?.name || variant.productName,
                                   variantName: variant.variantName,
                                   price: customPrice !== undefined ? customPrice : Number(variant.salePrice),
                                   quantity: qtyToAdd,
                                   maxStock: variant.isWeighable ? 999999 : variant.stockQuantity,
                                   isWeighable: variant.isWeighable,
                            },
                     ];
              });

              if (variant.isWeighable) setWeighableProduct(null);
              setQuery("");
              searchInputRef.current?.focus();
              playBeep();
       };

       const handleWeighableSubmit = (e: React.FormEvent) => {
              e.preventDefault();
              const price = Number(weighablePrice);
              const quantity = Number(weighableQuantity || 1);
              if (!weighableProduct || !weighablePrice || isNaN(price) || isNaN(quantity)) return;
              addToCart(weighableProduct, price, quantity);
       };

       const removeFromCart = (variantId: number) => {
              setCart((prev) => prev.filter((item) => item.variantId !== variantId));
       };

       const updateQuantity = (variantId: number, delta: number) => {
              setCart((prev) =>
                     prev.map((item) => {
                            if (item.variantId === variantId) {
                                   const newQty = item.quantity + delta;
                                   if (newQty <= 0) return item;
                                   if (!item.isWeighable && newQty > item.maxStock) return item;
                                   return { ...item, quantity: item.isWeighable ? Number(newQty.toFixed(2)) : newQty };
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
                     toast("Debe abrir la caja antes de realizar ventas.", "warning");
                     return;
              }

              let finalPayments: { method: string, amount: number }[] = [];

              if (isSplitPayment) {
                     finalPayments = splitPayments.filter(p => p.amount > 0);
                     const totalPaid = finalPayments.reduce((sum, p) => sum + p.amount, 0);
                     if (Math.abs(totalPaid - total) > 0.01) {
                            toast(`El total de los pagos (${formatCurrency(totalPaid)}) debe coincidir con el total de la venta (${formatCurrency(total)})`, "error");
                            return;
                     }
              } else {
                     finalPayments = [{ method: paymentMethod, amount: total }];
              }

              setProcessing(true);
              try {
                     const itemsInput: SaleItemInput[] = cart.map(i => ({
                            variantId: i.variantId,
                            quantity: i.quantity,
                            unitPrice: i.price
                     }));

                     await processSale(
                            itemsInput,
                            finalPayments,
                            selectedCustomerId || undefined,
                            promotionInfo.totalDiscount
                     );

                     setLastSale({
                            items: [...cart],
                            total,
                            date: new Date(),
                            paymentMethod: isSplitPayment ? "MIXTO" : paymentMethod,
                            store: {
                                   name: storeSettings?.name || session?.store?.name,
                                   address: storeSettings?.address || session?.store?.address,
                                   phone: storeSettings?.phone || session?.store?.phone,
                                   cuit: storeSettings?.cuit || session?.store?.cuit,
                                   ticketFooter: storeSettings?.ticketFooter,
                                   ticketInstagram: storeSettings?.ticketInstagram
                            }
                     });

                     setCart([]);
                     setShowPayModal(false);
                     setPaymentMethod("EFECTIVO");
                     setIsSplitPayment(false);
                     setSplitPayments([
                            { method: "EFECTIVO", amount: 0 },
                            { method: "TRANSFERENCIA", amount: 0 }
                     ]);
                     setTenderedAmount("");
                     setSelectedCustomerId(null);
                     setShowSuccessModal(true);
                     playCashSound();
              } catch (e: any) {
                     toast(e.message || "Error al procesar la venta", "error");
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

       // Colors for product cards
       const colors = [
              "bg-red-100 text-red-600", "bg-orange-100 text-orange-600", "bg-amber-100 text-amber-600",
              "bg-yellow-100 text-yellow-600", "bg-lime-100 text-lime-600", "bg-green-100 text-green-600",
              "bg-emerald-100 text-emerald-600", "bg-teal-100 text-teal-600", "bg-cyan-100 text-cyan-600",
              "bg-sky-100 text-sky-600", "bg-blue-100 text-blue-600", "bg-indigo-100 text-indigo-600",
              "bg-violet-100 text-violet-600", "bg-purple-100 text-purple-600", "bg-fuchsia-100 text-fuchsia-600",
              "bg-pink-100 text-pink-600", "bg-rose-100 text-rose-600"
       ];

       return (
              <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] lg:h-[calc(100vh-theme(spacing.24))] gap-0 lg:gap-6">
                     <Ticket data={lastSale} />

                     {/* ── MOBILE TAB BAR ── */}
                     <div className="lg:hidden flex border-b border-gray-200 bg-white shrink-0">
                            <button
                                   onClick={() => setMobileTab("catalog")}
                                   className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${mobileTab === "catalog" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`}
                            >
                                   <Search className="h-4 w-4" />
                                   Catálogo
                            </button>
                            <button
                                   onClick={() => setMobileTab("cart")}
                                   className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors relative ${mobileTab === "cart" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`}
                            >
                                   <ShoppingCart className="h-4 w-4" />
                                   Carrito
                                   {cart.length > 0 && (
                                          <span className="absolute top-2 right-[calc(50%-28px)] bg-blue-600 text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                                                 {cart.length}
                                          </span>
                                   )}
                            </button>
                     </div>

                     {/* ── LEFT COLUMN: Search & Catalog ── */}
                     <div className={`flex-1 flex flex-col gap-3 lg:gap-4 min-h-0 ${mobileTab === "cart" ? "hidden lg:flex" : "flex"}`}>
                            <div className="relative">
                                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                   <input
                                          ref={searchInputRef}
                                          type="text"
                                          placeholder="Buscar producto..."
                                          className="w-full pl-12 pr-4 py-3 lg:py-4 bg-white border-2 border-transparent focus:border-blue-500 rounded-2xl shadow-sm outline-none text-base lg:text-lg transition-all"
                                          value={query}
                                          onChange={(e) => setQuery(e.target.value)}
                                   />
                                   {loadingSearch && <div className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin"><RotateCcw className="h-5 w-5 text-blue-500" /></div>}
                            </div>

                            <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-0">
                                   <div className="p-3 lg:p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50 shrink-0">
                                          <h2 className="font-bold text-gray-700 text-sm lg:text-base">Resultados</h2>
                                          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">{searchResults.length} encontrados</span>
                                   </div>
                                   <div className="flex-1 overflow-y-auto p-3 lg:p-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 gap-2 lg:gap-3 content-start">
                                          {searchResults.length === 0 && !loadingSearch && (
                                                 <div className="col-span-full flex flex-col items-center justify-center text-gray-400 py-12">
                                                        <Search className="h-12 w-12 mb-3 opacity-20" />
                                                        {query ? (
                                                               <p>No se encontraron productos</p>
                                                        ) : (
                                                               <p>Cargando catálogo...</p>
                                                        )}
                                                 </div>
                                          )}
                                          {searchResults.map((variant: any) => {
                                                 const colorClass = colors[variant.product.name.length % colors.length];
                                                 const initials = variant.product.name.slice(0, 2).toUpperCase();

                                                 return (
                                                        <button
                                                               key={variant.id}
                                                               onClick={() => {
                                                                      addToCart(variant);
                                                                      // On mobile, switch to cart after adding
                                                                      if (window.innerWidth < 1024 && !variant.isWeighable) {
                                                                             setMobileTab("cart");
                                                                      }
                                                               }}
                                                               className="group bg-white p-2.5 lg:p-3 rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md hover:bg-blue-50/10 transition-all text-left flex items-center gap-2 lg:gap-3 disabled:opacity-50 disabled:hover:shadow-none disabled:hover:border-gray-200 active:scale-95"
                                                        >
                                                               {/* Icon / Avatar */}
                                                               <div className={`h-10 w-10 lg:h-12 lg:w-12 shrink-0 rounded-lg flex items-center justify-center text-xs lg:text-sm font-black tracking-tighter ${colorClass}`}>
                                                                      {initials}
                                                               </div>

                                                               {/* Content */}
                                                               <div className="flex-1 min-w-0">
                                                                      <p className="font-bold text-gray-800 group-hover:text-blue-700 transition-colors truncate text-xs lg:text-sm">
                                                                             {variant.product.name}
                                                                      </p>
                                                                      <p className="text-[10px] text-gray-500 font-medium truncate mb-1">
                                                                             {variant.variantName}
                                                                      </p>
                                                                      <div className="flex items-center gap-1.5 lg:gap-2 flex-wrap">
                                                                             <span className="text-blue-600 font-black text-xs lg:text-sm">
                                                                                    {formatCurrency(variant.salePrice)}
                                                                             </span>
                                                                             <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${variant.stockQuantity <= 5 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-gray-50 text-gray-500 border border-gray-100'}`}>
                                                                                    {variant.stockQuantity}
                                                                             </span>
                                                                      </div>
                                                               </div>
                                                        </button>
                                                 );
                                          })}
                                   </div>
                            </div>
                     </div>

                     {/* ── RIGHT COLUMN: Cart ── */}
                     <div className={`lg:w-96 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden min-h-0 ${mobileTab === "catalog" ? "hidden lg:flex" : "flex flex-1"}`}>
                            <div className="p-3 lg:p-4 bg-gray-900 text-white flex items-center gap-3 shrink-0">
                                   <ShoppingCart className="h-5 w-5 lg:h-6 lg:w-6 text-blue-400" />
                                   <h2 className="font-bold text-base lg:text-lg">Carrito Actual</h2>
                                   <span className="ml-auto bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded text-xs font-bold uppercase">{cart.length} items</span>
                            </div>

                            <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-2 lg:space-y-3 min-h-0">
                                   {cart.length === 0 ? (
                                          <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-3">
                                                 <ShoppingCart className="h-12 w-12 opacity-10" />
                                                 <p className="text-sm font-medium">El carrito está vacío</p>
                                          </div>
                                   ) : (
                                          cart.map((item) => (
                                                 <div key={item.variantId} className="group p-2.5 lg:p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                                                        <div className="flex justify-between items-start mb-2">
                                                               <div className="flex-1 min-w-0">
                                                                      <p className="text-sm font-bold text-gray-900 truncate">{item.productName}</p>
                                                                      <p className="text-[10px] text-gray-500 uppercase font-medium">{item.variantName}</p>
                                                               </div>
                                                               <p className="text-sm font-bold text-blue-600 ml-2 shrink-0">{formatCurrency(item.price * (item.isWeighable ? 1 : item.quantity))}</p>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                               <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                                                                      {item.isWeighable ? (
                                                                             <span className="text-xs font-semibold px-2 text-gray-500">Precio Variable</span>
                                                                      ) : (
                                                                             <>
                                                                                    <button onClick={() => updateQuantity(item.variantId, -1)} className="p-1.5 hover:bg-gray-200 rounded text-gray-500 active:scale-90">
                                                                                           <Minus className="h-3 w-3" />
                                                                                    </button>
                                                                                    <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                                                                                    <button onClick={() => updateQuantity(item.variantId, 1)} className="p-1.5 hover:bg-gray-200 rounded text-gray-500 active:scale-90">
                                                                                           <Plus className="h-3 w-3" />
                                                                                    </button>
                                                                             </>
                                                                      )}
                                                               </div>
                                                               <button onClick={() => removeFromCart(item.variantId)} className="p-2 text-gray-300 hover:text-red-500 transition-colors active:scale-90">
                                                                      <Trash2 className="h-4 w-4" />
                                                               </button>
                                                        </div>
                                                 </div>
                                          ))
                                   )}
                            </div>

                            <div className="p-3 lg:p-4 border-t border-gray-100 bg-gray-50 space-y-3 lg:space-y-4 shrink-0">
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
                                                        <span>-{formatCurrency(promotionInfo.totalDiscount)}</span>
                                                 </div>
                                          </div>
                                   )}

                                   <div className="flex justify-between items-center text-xl lg:text-2xl font-black text-gray-900">
                                          <span>Total</span>
                                          <span>{formatCurrency(total)}</span>
                                   </div>

                                   {!session && (
                                          <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-xs text-center font-bold uppercase tracking-tight">
                                                 ⚠️ Atención: La caja está cerrada
                                          </div>
                                   )}

                                   <button
                                          disabled={cart.length === 0}
                                          onClick={() => setShowPayModal(true)}
                                          className="w-full py-3.5 lg:py-4 text-base lg:text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2 active:scale-95"
                                   >
                                          <CreditCard className="h-5 w-5 lg:h-6 lg:w-6" />
                                          Cobrar
                                   </button>
                            </div>
                     </div>

                     {/* Payment Modal */}
                     <Modal isOpen={showPayModal} onClose={() => setShowPayModal(false)} title="Finalizar Venta">
                            <div className="space-y-5 lg:space-y-6">
                                   <div className="bg-gray-50 p-5 lg:p-6 rounded-2xl text-center border border-gray-100">
                                          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Total a Pagar</p>
                                          <p className="text-4xl lg:text-5xl font-black text-gray-900">{formatCurrency(total)}</p>
                                   </div>

                                   <div className="space-y-3">
                                          <div className="flex items-center justify-between mb-2">
                                           <label className="text-sm font-bold text-gray-700 uppercase tracking-tight">Método de Pago</label>
                                           <button 
                                                  onClick={() => setIsSplitPayment(!isSplitPayment)}
                                                  className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${isSplitPayment ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                                           >
                                                  {isSplitPayment ? "Dividir: SÍ" : "Dividir Pago?"}
                                           </button>
                                    </div>

                                    {!isSplitPayment ? (
                                           <div className="grid grid-cols-2 gap-2 lg:gap-3">
                                                  {[
                                                         { id: "EFECTIVO", label: "Efectivo", icon: <CreditCard className="h-5 w-5 lg:h-6 lg:w-6" />, color: "blue" },
                                                         { id: "TRANSFERENCIA", label: "Transferencia", icon: <QrCode className="h-5 w-5 lg:h-6 lg:w-6" />, color: "purple" },
                                                         { id: "TARJETA", label: "Tarjeta", icon: <CreditCard className="h-5 w-5 lg:h-6 lg:w-6" />, color: "orange" },
                                                         { id: "CTA_CTE", label: "Cuenta Corriente", icon: <User className="h-5 w-5 lg:h-6 lg:w-6" />, color: "blue" },
                                                  ].map((m) => (
                                                         <button
                                                                key={m.id}
                                                                onClick={() => setPaymentMethod(m.id)}
                                                                className={`p-3 lg:p-4 rounded-xl border-2 text-sm font-bold transition-all flex flex-col items-center gap-1.5 lg:gap-2 active:scale-95
                                    ${paymentMethod === m.id ? `border-${m.color}-600 bg-${m.color}-50 text-${m.color}-700 shadow-sm` : "border-gray-100 hover:border-gray-200 hover:bg-gray-50 text-gray-500"}`}
                                                         >
                                                                {m.icon}
                                                                {m.label}
                                                         </button>
                                                  ))}
                                           </div>
                                    ) : (
                                           <div className="space-y-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                                  {[
                                                         { id: "EFECTIVO", label: "Efectivo" },
                                                         { id: "TRANSFERENCIA", label: "Transferencia" },
                                                         { id: "TARJETA", label: "Tarjeta" },
                                                         { id: "CTA_CTE", label: "Cta. Cte." },
                                                  ].map((m) => {
                                                         const current = splitPayments.find(p => p.method === m.id) || { method: m.id, amount: 0 };
                                                         return (
                                                                <div key={m.id} className="flex items-center gap-3">
                                                                       <span className="text-sm font-bold text-gray-600 w-24 shrink-0">{m.label}</span>
                                                                       <div className="relative flex-1">
                                                                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                                                              <input 
                                                                                     type="number"
                                                                                     className="w-full pl-7 p-2 border border-gray-200 rounded-lg text-sm font-bold focus:border-blue-500 outline-none"
                                                                                     value={current.amount || ""}
                                                                                     onChange={(e) => {
                                                                                            const val = parseFloat(e.target.value) || 0;
                                                                                            setSplitPayments(prev => {
                                                                                                   const exists = prev.find(p => p.method === m.id);
                                                                                                   if (exists) {
                                                                                                          return prev.map(p => p.method === m.id ? { ...p, amount: val } : p);
                                                                                                   }
                                                                                                   return [...prev, { method: m.id, amount: val }];
                                                                                            });
                                                                                     }}
                                                                                     placeholder="0.00"
                                                                              />
                                                                       </div>
                                                                       {m.id === "EFECTIVO" && current.amount > 0 && (
                                                                              <button 
                                                                                     onClick={() => setSplitPayments(prev => prev.map(p => p.method === "EFECTIVO" ? { ...p, amount: total - prev.filter(x => x.method !== "EFECTIVO").reduce((s, x) => s + x.amount, 0) } : p))}
                                                                                     className="text-[10px] bg-blue-100 text-blue-600 px-2 py-1 rounded font-bold"
                                                                              >
                                                                                     RESTO
                                                                              </button>
                                                                       )}
                                                                </div>
                                                         );
                                                  })}
                                                  <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                                                         <span className="text-xs font-bold text-gray-400 uppercase">Suma Ingresada</span>
                                                         <span className={`text-sm font-black ${Math.abs(splitPayments.reduce((s, p) => s + p.amount, 0) - total) < 0.1 ? "text-emerald-600" : "text-amber-500"}`}>
                                                                {formatCurrency(splitPayments.reduce((s, p) => s + p.amount, 0))}
                                                         </span>
                                                  </div>
                                           </div>
                                    )}

                                    {(paymentMethod === "CTA_CTE" || (isSplitPayment && splitPayments.find(p => p.method === "CTA_CTE" && p.amount > 0))) && (
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

                                    {paymentMethod === "EFECTIVO" && !isSplitPayment && (
                                           <div className="space-y-2 animate-in fade-in slide-in-from-top-2 bg-blue-50 p-4 border border-blue-100 rounded-xl">
                                                  <label className="block text-sm font-black text-gray-700 uppercase tracking-widest">Monto Recibido</label>
                                                  <div className="relative">
                                                         <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">$</span>
                                                         <input
                                                                type="number"
                                                                style={{ fontSize: '1.5rem' }}
                                                                className="w-full pl-8 py-3 pr-4 border-2 border-white rounded-xl focus:border-blue-500 outline-none transition-all font-black text-gray-900 shadow-sm"
                                                                value={tenderedAmount}
                                                                onChange={(e) => setTenderedAmount(e.target.value)}
                                                                placeholder="0.00"
                                                         />
                                                  </div>
                                                  {(() => {
                                                         const received = Number(tenderedAmount);
                                                         if (tenderedAmount && received > 0) {
                                                                const change = received - total;
                                                                if (change < 0) {
                                                                       return <p className="text-red-500 font-bold text-sm uppercase tracking-widest mt-1">Falta: {formatCurrency(Math.abs(change))}</p>;
                                                                } else {
                                                                       return <p className="text-emerald-600 font-black text-xl uppercase tracking-widest mt-1">Vuelto: {formatCurrency(change)}</p>;
                                                                }
                                                         }
                                                         return null;
                                                  })()}
                                                  {!session && (
                                                         <div className="mt-3 bg-red-100 border border-red-200 text-red-600 p-3 rounded-lg text-xs text-center font-bold uppercase tracking-tight">
                                                                ⚠️ Debe abrir la caja (en la sección Caja) para cobrar en efectivo.
                                                         </div>
                                                  )}
                                           </div>
                                    )}

                                   </div>

                                   <button
                                           onClick={handleCheckout}
                                           disabled={processing || 
                                                  (!isSplitPayment && paymentMethod === "CTA_CTE" && !selectedCustomerId) || 
                                                  (!isSplitPayment && paymentMethod === "EFECTIVO" && Number(tenderedAmount) > 0 && Number(tenderedAmount) < total) || 
                                                  (!isSplitPayment && paymentMethod === "EFECTIVO" && !session) ||
                                                  (isSplitPayment && Math.abs(splitPayments.reduce((s, p) => s + p.amount, 0) - total) > 0.01) ||
                                                  (isSplitPayment && splitPayments.find(p => p.method === "CTA_CTE" && p.amount > 0) && !selectedCustomerId)
                                           }
                                           className="w-full py-4 lg:py-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg lg:text-xl rounded-2xl shadow-xl shadow-emerald-100 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
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
                                          <p className="text-sm text-gray-500 font-medium">Monto total: <span className="text-lg font-bold text-gray-900">{formatCurrency(lastSale?.total || 0)}</span></p>
                                   </div>
                                   <div className="flex flex-col gap-3 mt-8">
                                          <button onClick={handlePrint} className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-white border-2 border-gray-100 text-gray-700 font-bold rounded-xl hover:border-gray-200 transition-all">
                                                 <Printer className="h-5 w-5" /> Imprimir Comprobante
                                          </button>
                                          <button onClick={handleNewSale} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100">
                                                 Nueva Venta <ArrowRight className="h-5 w-5" />
                                          </button>
                                   </div>
                            </div>
                     </Modal>

                     {/* Weighable Product Modal */}
                     <Modal isOpen={!!weighableProduct} onClose={() => setWeighableProduct(null)} title="Producto de Precio Variable">
                            {weighableProduct && (
                                   <form onSubmit={handleWeighableSubmit} className="space-y-4">
                                          <div className="bg-gray-50 p-4 rounded-xl">
                                                 <p className="font-bold text-gray-900 text-lg">{weighableProduct.product?.name}</p>
                                                 <p className="text-sm text-gray-500">{weighableProduct.variantName}</p>
                                          </div>
                                          <div>
                                                 <label className="block text-sm font-bold text-gray-700 mb-1">Precio Cobrado ($)</label>
                                                 <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        required
                                                        autoFocus
                                                        className="w-full border-2 border-gray-200 p-3 rounded-xl font-bold text-2xl outline-none focus:border-blue-500"
                                                        placeholder="Ej: 1500"
                                                        value={weighablePrice}
                                                        onChange={e => setWeighablePrice(e.target.value)}
                                                 />
                                                 <p className="text-xs text-gray-400 mt-1">Este producto no tiene precio fijo. Ingresa cuánto cobrar.</p>
                                          </div>
                                          <div className="pt-4 flex justify-end gap-2">
                                                 <button type="button" onClick={() => setWeighableProduct(null)} className="px-4 py-2 border border-gray-200 rounded-lg font-bold text-gray-600 hover:bg-gray-50">Cancelar</button>
                                                 <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">Agregar al Carrito</button>
                                          </div>
                                   </form>
                            )}
                     </Modal>
              </div>
       );
}
