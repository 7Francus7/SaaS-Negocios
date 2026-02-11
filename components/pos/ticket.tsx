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
                     day: "2-digit", month: "2-digit", year: "2-digit",
                     hour: "2-digit", minute: "2-digit"
              });
       };

       return (
              <div id="printable-ticket" className="hidden">
                     {/* Container for 80mm Paper (approx 72-76mm printable area) 
                         Using fixed 76mm width ensures it doesn't stretch if print dialog defaults to A4 
                     */}
                     <div className="bg-white text-black font-mono text-[11px] leading-tight select-none p-1" style={{ width: '76mm' }}>

                            {/* HEADER */}
                            <div className="text-center mb-3">
                                   <div className="font-black text-base uppercase mb-1">{data.store?.name || "DESPENSA"}</div>
                                   {data.store?.address && <p>{data.store.address}</p>}
                                   {data.store?.phone && <p>Tel: {data.store.phone}</p>}
                                   {data.store?.cuit && <p>CUIT: {data.store.cuit}</p>}
                            </div>

                            {/* TICKET INFO */}
                            <div className="border-b border-black border-dashed my-2"></div>
                            <div className="flex justify-between text-[10px]">
                                   <span>FECHA: {formatDate(data.date)}</span>
                            </div>
                            <div className="flex justify-between text-[10px] mb-1">
                                   <span>TICKET Nro: 000-012345</span>
                            </div>
                            <div className="border-b border-black border-dashed my-2"></div>

                            {/* ITEMS HEADERS */}
                            {/* Simplified headers since we use a 2-line layout for items */}
                            <div className="flex justify-between text-[10px] font-bold mb-1">
                                   <span>DESCRIPCION</span>
                                   <span>IMPORTE</span>
                            </div>

                            {/* ITEMS LIST */}
                            <div className="flex flex-col gap-2 mb-2">
                                   {data.items.map((item, i) => (
                                          <div key={i} className="flex flex-col">
                                                 {/* Line 1: Product Name */}
                                                 <div className="font-bold text-[11px] mb-0.5">
                                                        {item.productName}
                                                 </div>
                                                 {/* Line 2: Qty x Unit Price | Total */}
                                                 <div className="flex justify-between pl-2 text-[11px]">
                                                        <div className="flex gap-1 text-gray-800">
                                                               <span>{item.quantity} x {formatCurrency(item.price)}</span>
                                                               {item.variantName !== "Estándar" && item.variantName !== "Unidad" && (
                                                                      <span className="italic text-[10px] self-center">({item.variantName})</span>
                                                               )}
                                                        </div>
                                                        <span className="font-bold">{formatCurrency(item.price * item.quantity)}</span>
                                                 </div>
                                          </div>
                                   ))}
                            </div>

                            <div className="border-b border-black border-dashed my-2"></div>

                            {/* TOTALS */}
                            <div className="flex justify-between font-black text-xl my-3">
                                   <span>TOTAL</span>
                                   <span>{formatCurrency(data.total)}</span>
                            </div>

                            {/* PAYMENT INFO */}
                            <div className="text-right text-[11px] mb-4">
                                   <p>FORMA DE PAGO: <span className="font-bold uppercase">{data.paymentMethod || "EFECTIVO"}</span></p>
                            </div>

                            {/* FOOTER */}
                            <div className="text-center mt-4 space-y-1">
                                   <p className="font-bold text-[11px] uppercase">{data.store?.ticketFooter || "¡GRACIAS POR SU COMPRA!"}</p>
                                   {data.store?.ticketInstagram && (
                                          <p className="text-[10px] font-bold">IG: @{data.store.ticketInstagram}</p>
                                   )}
                                   <p className="text-[9px] text-gray-500 lowercase pt-2">sistema: saas-negocios.com</p>

                                   {/* FAKE BARCODE */}
                                   <div className="mt-2 h-8 bg-black w-2/3 mx-auto opacity-80" style={{ maskImage: "repeating-linear-gradient(90deg, black, transparent 2px)" }}></div>
                                   <p className="text-[9px]">982374982374</p>
                            </div>
                     </div>
              </div>
       );
}
