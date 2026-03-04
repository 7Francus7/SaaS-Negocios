import React from 'react';
import { formatCurrency } from '@/lib/utils';

interface TicketItem {
       quantity: number;
       productName: string;
       variantName: string;
       price: number;
}

interface TicketData {
       date: Date | string;
       items: TicketItem[];
       total: number;
       paymentMethod?: string;
       store?: {
              name: string;
              address?: string | null;
              phone?: string | null;
              cuit?: string | null;
              ticketFooter?: string;
              ticketInstagram?: string;
       }
}

export function Ticket({ data }: { data: TicketData | null }) {
       if (!data) return null;

       const formatDate = (date: Date | string) => {
              const d = new Date(date);
              return d.toLocaleString("es-AR", {
                     day: "2-digit", month: "2-digit", year: "numeric",
                     hour: "2-digit", minute: "2-digit"
              });
       };

       const ticketTitle = "TICKET Nro: 000-012345";

       return (
              <div id="printable-ticket" className="hidden">
                     {/* 
                         Responsive Container:
                         Scales beautifully on both small thermal printers (58mm/80mm) 
                         and large formats (A4/Letter) thanks to CSS flex and fluid widths. 
                     */}
                     <div
                            className="bg-white text-black font-sans leading-relaxed w-full px-2 py-4 print:px-4 print:py-6"
                            style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact', minWidth: '250px' }}
                     >
                            {/* HEADER */}
                            <div className="text-center pb-4 border-b-2 border-black mb-4">
                                   <h1 className="font-black text-xl sm:text-2xl md:text-3xl tracking-tight uppercase mb-1">
                                          {data.store?.name || "DESPENSA"}
                                   </h1>
                                   <div className="text-gray-800 text-[11px] sm:text-xs md:text-sm font-medium">
                                          {data.store?.address && <p>{data.store.address}</p>}
                                          {data.store?.phone && <p>Tel: {data.store.phone}</p>}
                                          {data.store?.cuit && <p>CUIT: {data.store.cuit}</p>}
                                   </div>
                            </div>

                            {/* TICKET INFO */}
                            <div className="flex justify-between items-start mb-5 text-[11px] sm:text-xs md:text-sm font-medium border-b border-black pb-4">
                                   <div className="flex flex-col gap-0.5">
                                          <p><span className="font-bold uppercase">FECHA:</span> {formatDate(data.date)}</p>
                                          <p className="font-mono text-[10px] sm:text-[11px] md:text-xs mt-1 text-gray-600">{ticketTitle}</p>
                                   </div>
                                   <div className="text-right">
                                          <div className="inline-block px-2 py-1 bg-black text-white font-bold text-[10px] sm:text-xs rounded uppercase tracking-widest">
                                                 RECIBO
                                          </div>
                                   </div>
                            </div>

                            {/* ITEMS TABLE */}
                            <div className="w-full mb-6">
                                   <div className="flex justify-between font-bold border-b border-black pb-2 mb-3 text-[11px] sm:text-xs md:text-sm uppercase tracking-wider">
                                          <span className="w-2/3">Descripción</span>
                                          <span className="w-1/3 text-right">Importe</span>
                                   </div>

                                   <div className="flex flex-col gap-3">
                                          {data.items.map((item, i) => (
                                                 <div key={i} className="flex flex-col text-[11px] sm:text-xs md:text-sm">
                                                        <div className="flex justify-between font-bold items-start">
                                                               <span className="w-2/3 pr-2 break-words leading-tight uppercase">{item.productName}</span>
                                                               <span className="w-1/3 text-right tabular-nums">{formatCurrency(item.price * item.quantity)}</span>
                                                        </div>
                                                        <div className="flex text-gray-600 mt-1 tabular-nums font-medium">
                                                               <span>{item.quantity} un. x {formatCurrency(item.price)}</span>
                                                               {item.variantName && item.variantName !== "Estándar" && item.variantName !== "Unidad" && (
                                                                      <span className="italic ml-1">({item.variantName})</span>
                                                               )}
                                                        </div>
                                                 </div>
                                          ))}
                                   </div>
                            </div>

                            {/* TOTALS & PAYMENT INFO */}
                            <div className="border-t-2 border-black pt-4 mb-6">
                                   <div className="flex justify-end">
                                          <div className="w-full sm:w-2/3 md:w-1/2 flex flex-col gap-1">
                                                 <div className="flex justify-between text-[11px] sm:text-xs md:text-sm text-gray-700 pb-2">
                                                        <span className="uppercase font-bold">Medio de Pago:</span>
                                                        <span className="uppercase font-black">{data.paymentMethod || "EFECTIVO"}</span>
                                                 </div>
                                                 <div className="flex justify-between items-end font-black text-lg sm:text-xl md:text-2xl pt-2 border-t border-black">
                                                        <span className="uppercase tracking-widest">TOTAL</span>
                                                        <span className="tabular-nums">{formatCurrency(data.total)}</span>
                                                 </div>
                                          </div>
                                   </div>
                            </div>

                            {/* FOOTER */}
                            <div className="text-center text-[11px] sm:text-xs md:text-sm text-gray-800 mt-10 mb-2">
                                   <p className="font-black uppercase mb-1 tracking-wide">{data.store?.ticketFooter || "¡Gracias por su compra!"}</p>
                                   {data.store?.ticketInstagram && (
                                          <p className="mb-2 font-medium">IG: @{data.store.ticketInstagram}</p>
                                   )}

                                   {/* FAKE BARCODE */}
                                   <div className="mt-4 mb-1 h-10 md:h-12 bg-black w-3/4 sm:w-1/2 mx-auto opacity-90" style={{ maskImage: "repeating-linear-gradient(90deg, black, transparent 2px)" }}></div>
                                   <p className="font-mono text-[9px] sm:text-[10px] md:text-xs tracking-[0.3em] text-gray-600">{ticketTitle.replace(/\D/g, '')}</p>

                                   <p className="text-[9px] sm:text-[10px] text-gray-400 mt-6 lowercase tracking-widest font-mono">saas-negocios.com</p>
                            </div>
                     </div>
              </div>
       );
}
