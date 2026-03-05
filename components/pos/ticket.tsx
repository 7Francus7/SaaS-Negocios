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
                            className="bg-white text-black font-sans leading-tight mx-auto print:mx-0 w-full print:w-[52mm] px-2 py-4 print:p-0"
                            style={{
                                   WebkitPrintColorAdjust: 'exact',
                                   printColorAdjust: 'exact'
                            }}
                     >
                            {/* HEADER */}
                            <div className="text-center pb-2 border-b-2 border-black mb-2">
                                   <h1 className="font-black text-xl sm:text-2xl print:text-lg tracking-tight uppercase mb-0.5">
                                          {data.store?.name || "DESPENSA"}
                                   </h1>
                                   <div className="text-gray-800 text-[10px] font-medium leading-tight">
                                          {data.store?.address && <p>{data.store.address}</p>}
                                          {data.store?.phone && <p>Tel: {data.store.phone}</p>}
                                          {data.store?.cuit && <p>CUIT: {data.store.cuit}</p>}
                                   </div>
                            </div>

                            {/* TICKET INFO */}
                            <div className="flex justify-between items-start mb-3 text-[10px] font-medium border-b border-black pb-2">
                                   <div className="flex flex-col gap-0.5">
                                          <p><span className="font-bold uppercase">FECHA:</span><br />{formatDate(data.date)}</p>
                                          <p className="font-mono text-[9px] mt-0.5 text-gray-800">{ticketTitle}</p>
                                   </div>
                                   <div className="text-right flex-shrink-0">
                                          <div className="inline-block px-1.5 py-0.5 bg-black text-white font-bold text-[9px] rounded uppercase tracking-widest">
                                                 RECIBO
                                          </div>
                                   </div>
                            </div>

                            {/* ITEMS TABLE */}
                            <div className="w-full mb-3">
                                   <div className="flex justify-between font-bold border-b border-black pb-1 mb-1.5 text-[9px] uppercase tracking-wider">
                                          <span className="w-3/5">Descripción</span>
                                          <span className="w-2/5 text-right">Importe</span>
                                   </div>

                                   <div className="flex flex-col gap-1.5">
                                          {data.items.map((item, i) => (
                                                 <div key={i} className="flex flex-col text-[10px]">
                                                        <div className="flex justify-between font-bold items-start">
                                                               <span className="w-[65%] pr-1 break-words leading-tight uppercase">{item.productName}</span>
                                                               <span className="w-[35%] text-right tabular-nums">{formatCurrency(item.price * item.quantity)}</span>
                                                        </div>
                                                        <div className="flex text-gray-800 mt-0.5 tabular-nums text-[9px] font-medium leading-none">
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
                            <div className="border-t-2 border-black pt-1.5 mb-3">
                                   <div className="flex justify-end">
                                          <div className="w-full flex flex-col gap-1 text-[10px]">
                                                 <div className="flex justify-between text-gray-900 pb-0.5">
                                                        <span className="uppercase font-bold">Medio de Pago:</span>
                                                        <span className="uppercase font-black">{data.paymentMethod || "EFECTIVO"}</span>
                                                 </div>
                                                 <div className="flex justify-between items-end font-black text-sm pt-1 border-t border-black">
                                                        <span className="uppercase tracking-widest">TOTAL</span>
                                                        <span className="tabular-nums">{formatCurrency(data.total)}</span>
                                                 </div>
                                          </div>
                                   </div>
                            </div>

                            {/* FOOTER */}
                            <div className="text-center text-[10px] text-gray-900 mt-4 mb-1">
                                   <p className="font-black uppercase mb-0.5 tracking-wide">{data.store?.ticketFooter || "¡Gracias por su compra!"}</p>
                                   {data.store?.ticketInstagram && (
                                          <p className="mb-1 font-medium text-[9px]">IG: @{data.store.ticketInstagram}</p>
                                   )}

                                   {/* FAKE BARCODE */}
                                   <div className="mt-2 mb-1 h-8 bg-black w-3/4 mx-auto opacity-90" style={{ maskImage: "repeating-linear-gradient(90deg, black, transparent 2px)" }}></div>
                                   <p className="font-mono text-[8px] tracking-[0.2em] text-gray-800">{ticketTitle.replace(/\D/g, '')}</p>

                                   <p className="text-[8px] text-gray-500 mt-3 lowercase tracking-widest font-mono line-clamp-1">saas-negocios.com</p>
                            </div>
                     </div>
              </div>
       );
}
