import React, { useEffect, useState } from 'react';
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

const PAPER_PROFILES: Record<number, { width: number, fontSize: number, showLogo: boolean }> = {
       30: { width: 30, fontSize: 9, showLogo: false },
       50: { width: 50, fontSize: 10, showLogo: false },
       58: { width: 58, fontSize: 11, showLogo: true },
       80: { width: 80, fontSize: 12, showLogo: true }
};

export function Ticket({ data }: { data: TicketData | null }) {
       const [paperWidthMm, setPaperWidthMm] = useState<number>(58);

       useEffect(() => {
              const savedItem = localStorage.getItem("paperWidthMm");
              if (savedItem) {
                     setPaperWidthMm(Number(savedItem));
              }
       }, []);

       if (!data) return null;

       const formatDate = (date: Date | string) => {
              const d = new Date(date);
              return d.toLocaleString("es-AR", {
                     day: "2-digit", month: "2-digit", year: "numeric",
                     hour: "2-digit", minute: "2-digit"
              });
       };

       const ticketTitle = "TICKET Nro: 000-012345";
       const profile = PAPER_PROFILES[paperWidthMm] || PAPER_PROFILES[58];

       return (
              <>
                     <style>{`
                            @media print {
                                   @page { 
                                          margin: 0; 
                                   }
                                   html, body {
                                          margin: 0 !important;
                                          padding: 0 !important;
                                          width: 100% !important;
                                          background: white !important;
                                          font-family: Arial, sans-serif !important;
                                          font-size: ${profile.fontSize}px !important;
                                   }
                                   body * {
                                          visibility: hidden;
                                   }
                                   #printable-ticket, #printable-ticket * {
                                          visibility: visible;
                                   }
                                   #printable-ticket {
                                          position: absolute;
                                          left: 0;
                                          top: 0;
                                          margin: 0 !important;
                                          width: 100% !important;
                                          max-width: 100% !important;
                                          box-sizing: border-box !important;
                                          padding: 2mm !important;
                                          background: white !important;
                                          -webkit-print-color-adjust: exact !important;
                                          print-color-adjust: exact !important;
                                          overflow: hidden !important;
                                   }
                            }
                     `}</style>
                     <div id="printable-ticket" className="hidden print:block text-black font-sans leading-tight">
                            {/* HEADER */}
                            <div className="text-center pb-2 border-b-2 border-black mb-2">
                                   <h1 style={{ fontSize: `${profile.fontSize + 6}px` }} className="font-black tracking-tight uppercase mb-0.5">
                                          {data.store?.name || "DESPENSA"}
                                   </h1>
                                   <div className="text-gray-800 font-medium leading-tight" style={{ fontSize: `${profile.fontSize - 1}px` }}>
                                          {data.store?.address && <p>{data.store.address}</p>}
                                          {data.store?.phone && <p>Tel: {data.store.phone}</p>}
                                          {data.store?.cuit && <p>CUIT: {data.store.cuit}</p>}
                                   </div>
                            </div>

                            {/* TICKET INFO */}
                            <div className="flex justify-between items-start mb-3 font-medium border-b border-black pb-2" style={{ fontSize: `${profile.fontSize - 1}px` }}>
                                   <div className="flex flex-col gap-0.5">
                                          <p><span className="font-bold uppercase">FECHA:</span><br />{formatDate(data.date)}</p>
                                          <p className="font-mono mt-0.5 text-gray-800" style={{ fontSize: `${profile.fontSize - 2}px` }}>{ticketTitle}</p>
                                   </div>
                                   <div className="text-right flex-shrink-0">
                                          <div className="inline-block px-1.5 py-0.5 bg-black text-white font-bold rounded uppercase tracking-widest" style={{ fontSize: `${profile.fontSize - 2}px` }}>
                                                 RECIBO
                                          </div>
                                   </div>
                            </div>

                            {/* ITEMS TABLE */}
                            <div className="w-full mb-3">
                                   <div className="flex justify-between font-bold border-b border-black pb-1 mb-1.5 uppercase tracking-wider" style={{ fontSize: `${profile.fontSize - 2}px` }}>
                                          <span className="w-3/5">Descripción</span>
                                          <span className="w-2/5 text-right">Importe</span>
                                   </div>

                                   <div className="flex flex-col gap-1.5">
                                          {data.items.map((item, i) => (
                                                 <div key={i} className="flex flex-col">
                                                        <div className="flex justify-between font-bold items-start" style={{ fontSize: `${profile.fontSize}px` }}>
                                                               <span className="w-[65%] pr-1 break-words leading-tight uppercase">{item.productName}</span>
                                                               <span className="w-[35%] text-right tabular-nums">{formatCurrency(item.price * item.quantity)}</span>
                                                        </div>
                                                        <div className="flex text-gray-800 mt-0.5 tabular-nums font-medium leading-none" style={{ fontSize: `${profile.fontSize - 1}px` }}>
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
                                          <div className="w-full flex flex-col gap-1">
                                                 <div className="flex justify-between text-gray-900 pb-0.5" style={{ fontSize: `${profile.fontSize}px` }}>
                                                        <span className="uppercase font-bold">Medio de Pago:</span>
                                                        <span className="uppercase font-black">{data.paymentMethod || "EFECTIVO"}</span>
                                                 </div>
                                                 <div className="flex justify-between items-end font-black pt-1 border-t border-black" style={{ fontSize: `${profile.fontSize + 2}px` }}>
                                                        <span className="uppercase tracking-widest">TOTAL</span>
                                                        <span className="tabular-nums">{formatCurrency(data.total)}</span>
                                                 </div>
                                          </div>
                                   </div>
                            </div>

                            {/* FOOTER */}
                            <div className="text-center text-gray-900 mt-4 mb-1" style={{ fontSize: `${profile.fontSize}px` }}>
                                   <p className="font-black uppercase mb-0.5 tracking-wide">{data.store?.ticketFooter || "¡Gracias por su compra!"}</p>
                                   {data.store?.ticketInstagram && (
                                          <p className="mb-1 font-medium" style={{ fontSize: `${profile.fontSize - 1}px` }}>IG: @{data.store.ticketInstagram}</p>
                                   )}

                                   {/* FAKE BARCODE */}
                                   <div className="mt-2 mb-1 h-8 bg-black w-3/4 mx-auto opacity-90" style={{ maskImage: "repeating-linear-gradient(90deg, black, transparent 2px)" }}></div>
                                   <p className="font-mono tracking-[0.2em] text-gray-800" style={{ fontSize: `${profile.fontSize - 2}px` }}>{ticketTitle.replace(/\D/g, '')}</p>

                                   <p className="text-gray-500 mt-3 lowercase tracking-widest font-mono line-clamp-1" style={{ fontSize: `${profile.fontSize - 2}px` }}>saas-negocios.com</p>
                            </div>
                     </div>
              </>
       );
}
