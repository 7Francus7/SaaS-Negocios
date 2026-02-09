"use client";

import { useState, useEffect, useCallback } from "react";
import { Receipt, Search, XCircle, ChevronDown, ChevronUp, Filter } from "lucide-react";
import { getSalesHistory, voidSale } from "@/app/actions/sales-history";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";

interface SaleItem {
       id: number;
       productNameSnapshot: string;
       quantity: number;
       unitPrice: number;
       subtotal: number;
}

interface Sale {
       id: number;
       timestamp: string;
       paymentMethod: string;
       subtotal: number;
       discountAmount: number;
       totalAmount: number;
       items: SaleItem[];
       customer?: { name: string } | null;
}

const PAYMENT_LABELS: Record<string, string> = {
       EFECTIVO: "Efectivo",
       TARJETA: "Tarjeta",
       TRANSFERENCIA: "Transferencia",
       CTA_CTE: "Cuenta Corriente",
       DEBITO: "Débito",
       CREDITO: "Crédito",
};

export default function SalesHistoryPage() {
       const [sales, setSales] = useState<Sale[]>([]);
       const [loading, setLoading] = useState(true);
       const [expandedSale, setExpandedSale] = useState<number | null>(null);
       const [filterMethod, setFilterMethod] = useState<string>("");
       const [dateFrom, setDateFrom] = useState("");
       const [dateTo, setDateTo] = useState("");

       const fetchSales = useCallback(async () => {
              setLoading(true);
              try {
                     const data = await getSalesHistory({
                            limit: 100,
                            ...(filterMethod ? { paymentMethod: filterMethod } : {}),
                            ...(dateFrom ? { from: new Date(dateFrom) } : {}),
                            ...(dateTo ? { to: new Date(dateTo + "T23:59:59") } : {}),
                     });
                     setSales(data as any);
              } catch (e) {
                     console.error(e);
              } finally {
                     setLoading(false);
              }
       }, [filterMethod, dateFrom, dateTo]);

       useEffect(() => { fetchSales(); }, [fetchSales]);

       const handleVoid = async (saleId: number) => {
              if (!confirm(`¿Estás seguro de ANULAR la venta #${saleId}? Esto revertirá el stock y los pagos asociados.`)) return;
              try {
                     await voidSale(saleId);
                     fetchSales();
              } catch (e: any) {
                     alert(e.message);
              }
       };

       const totalSales = sales.reduce((acc, s) => acc + Number(s.totalAmount), 0);

       return (
              <div className="space-y-6">
                     <div className="flex justify-between items-center">
                            <div>
                                   <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                          <Receipt className="h-6 w-6 text-blue-600" />
                                          Historial de Ventas
                                   </h1>
                                   <p className="text-sm text-gray-500">Consultá, revisá y anulá ventas pasadas</p>
                            </div>
                            <div className="bg-blue-50 px-6 py-3 rounded-xl border border-blue-100">
                                   <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Total Filtrado</p>
                                   <p className="text-xl font-black text-blue-700">{formatCurrency(totalSales)}</p>
                            </div>
                     </div>

                     {/* Filters */}
                     <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-4 items-end">
                            <div className="flex-1 min-w-[150px]">
                                   <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Desde</label>
                                   <input
                                          type="date"
                                          value={dateFrom}
                                          onChange={e => setDateFrom(e.target.value)}
                                          className="w-full border border-gray-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                   />
                            </div>
                            <div className="flex-1 min-w-[150px]">
                                   <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Hasta</label>
                                   <input
                                          type="date"
                                          value={dateTo}
                                          onChange={e => setDateTo(e.target.value)}
                                          className="w-full border border-gray-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                   />
                            </div>
                            <div className="flex-1 min-w-[150px]">
                                   <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Método de Pago</label>
                                   <select
                                          value={filterMethod}
                                          onChange={e => setFilterMethod(e.target.value)}
                                          className="w-full border border-gray-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                   >
                                          <option value="">Todos</option>
                                          <option value="EFECTIVO">Efectivo</option>
                                          <option value="TARJETA">Tarjeta</option>
                                          <option value="TRANSFERENCIA">Transferencia</option>
                                          <option value="CTA_CTE">Cuenta Corriente</option>
                                   </select>
                            </div>
                            <button
                                   onClick={() => { setDateFrom(""); setDateTo(""); setFilterMethod(""); }}
                                   className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
                            >
                                   Limpiar
                            </button>
                     </div>

                     {/* Sales Table */}
                     <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                   <thead className="bg-gray-50">
                                          <tr>
                                                 <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-500">ID</th>
                                                 <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-500">Fecha</th>
                                                 <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-500">Cliente</th>
                                                 <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-500">Pago</th>
                                                 <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-500">Items</th>
                                                 <th className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-widest text-gray-500">Total</th>
                                                 <th className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-widest text-gray-500">Acciones</th>
                                          </tr>
                                   </thead>
                                   <tbody className="bg-white divide-y divide-gray-100">
                                          {loading ? (
                                                 <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400">Cargando ventas...</td></tr>
                                          ) : sales.length === 0 ? (
                                                 <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400">No hay ventas para este período.</td></tr>
                                          ) : sales.map(sale => (
                                                 <>
                                                        <tr key={sale.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setExpandedSale(expandedSale === sale.id ? null : sale.id)}>
                                                               <td className="px-6 py-4 text-sm font-mono font-bold text-gray-700">#{sale.id}</td>
                                                               <td className="px-6 py-4">
                                                                      <div className="text-sm font-bold text-gray-900">{formatDate(sale.timestamp)}</div>
                                                                      <div className="text-[10px] text-gray-400">{formatTime(sale.timestamp)}</div>
                                                               </td>
                                                               <td className="px-6 py-4 text-sm text-gray-700">{sale.customer?.name || "—"}</td>
                                                               <td className="px-6 py-4">
                                                                      <span className="px-2 py-1 text-[10px] font-bold uppercase rounded-full bg-gray-100 text-gray-600">
                                                                             {PAYMENT_LABELS[sale.paymentMethod] || sale.paymentMethod}
                                                                      </span>
                                                               </td>
                                                               <td className="px-6 py-4 text-sm text-gray-500">
                                                                      {sale.items.length} producto{sale.items.length !== 1 ? 's' : ''}
                                                               </td>
                                                               <td className="px-6 py-4 text-right text-sm font-black text-gray-900">
                                                                      {formatCurrency(sale.totalAmount)}
                                                               </td>
                                                               <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                                                      <button className="text-gray-400 hover:text-blue-600">
                                                                             {expandedSale === sale.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                                      </button>
                                                                      <button
                                                                             onClick={(e) => { e.stopPropagation(); handleVoid(sale.id); }}
                                                                             className="text-red-400 hover:text-red-600 text-xs font-bold uppercase"
                                                                             title="Anular venta"
                                                                      >
                                                                             <XCircle className="h-4 w-4" />
                                                                      </button>
                                                               </td>
                                                        </tr>
                                                        {expandedSale === sale.id && (
                                                               <tr key={`detail-${sale.id}`}>
                                                                      <td colSpan={7} className="px-6 py-4 bg-blue-50/50">
                                                                             <div className="space-y-2">
                                                                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Detalle de venta #{sale.id}</p>
                                                                                    {sale.items.map((item) => (
                                                                                           <div key={item.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100 text-sm">
                                                                                                  <div>
                                                                                                         <span className="font-bold text-gray-900">{item.productNameSnapshot}</span>
                                                                                                         <span className="text-gray-400 ml-2">x{item.quantity}</span>
                                                                                                  </div>
                                                                                                  <span className="font-bold text-gray-700">{formatCurrency(item.subtotal)}</span>
                                                                                           </div>
                                                                                    ))}
                                                                                    {Number(sale.discountAmount) > 0 && (
                                                                                           <div className="flex justify-between text-sm text-emerald-600 font-bold pt-2">
                                                                                                  <span>Descuento aplicado</span>
                                                                                                  <span>-{formatCurrency(sale.discountAmount)}</span>
                                                                                           </div>
                                                                                    )}
                                                                             </div>
                                                                      </td>
                                                               </tr>
                                                        )}
                                                 </>
                                          ))}
                                   </tbody>
                            </table>
                     </div>
              </div>
       );
}
