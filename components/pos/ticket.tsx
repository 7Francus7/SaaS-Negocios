import React from 'react';

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
                     {/* Container for 58mm/80mm Paper */}
                     <div className="w-full bg-white text-black font-mono text-[12px] leading-tight select-none p-1">

                            {/* HEADER */}
                            <div className="text-center lowercase mb-2">
                                   <div className="font-bold text-sm uppercase mb-1">{data.store?.name || "DESPENSA DEMO"}</div>
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
                            <div className="flex text-[10px] font-bold mb-1">
                                   <span className="w-8">CANT</span>
                                   <span className="flex-1">DESCRIPCION</span>
                                   <span className="w-12 text-right">TOTAL</span>
                            </div>

                            {/* ITEMS LIST */}
                            <div className="flex flex-col gap-1 mb-2">
                                   {data.items.map((item, i) => (
                                          <div key={i} className="flex flex-col">
                                                 <div className="flex justify-between font-bold">
                                                        <span>{item.productName}</span>
                                                 </div>
                                                 <div className="flex justify-between text-[11px] pl-2">
                                                        <div className="flex gap-2">
                                                               <span>{item.quantity} x ${item.price.toFixed(2)}</span>
                                                               {item.variantName !== "Estándar" && item.variantName !== "Unidad" && (
                                                                      <span className="italic">({item.variantName})</span>
                                                               )}
                                                        </div>
                                                        <span className="font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                                                 </div>
                                          </div>
                                   ))}
                            </div>

                            <div className="border-b border-black border-dashed my-2"></div>

                            {/* TOTALS */}
                            <div className="flex justify-between font-bold text-lg my-2">
                                   <span>TOTAL</span>
                                   <span>${data.total.toFixed(2)}</span>
                            </div>

                            {/* PAYMENT INFO */}
                            <div className="text-right text-[11px] mb-4">
                                   <p>FORMA DE PAGO: <span className="font-bold uppercase">{data.paymentMethod || "EFECTIVO"}</span></p>
                                   {/* Placeholder for change calculation if we had it */}
                                   {/* <p>SU VUELTO: $0.00</p> */}
                            </div>

                            {/* FOOTER */}
                            <div className="text-center mt-4">
                                   <p className="font-bold text-[11px] uppercase">{data.store?.ticketFooter || "¡GRACIAS POR SU COMPRA!"}</p>
                                   {data.store?.ticketInstagram && (
                                          <p className="text-[10px] font-bold mt-1">IG: @{data.store.ticketInstagram}</p>
                                   )}
                                   <p className="text-[9px] mt-1 text-gray-500 lowercase">sistema: saas-negocios.com</p>

                                   {/* FAKE BARCODE */}
                                   <div className="mt-2 h-8 bg-black w-2/3 mx-auto opacity-80" style={{ maskImage: "repeating-linear-gradient(90deg, black, transparent 2px)" }}></div>
                                   <p className="text-[9px] mt-1">982374982374</p>
                            </div>
                     </div>
              </div>
       );
}
