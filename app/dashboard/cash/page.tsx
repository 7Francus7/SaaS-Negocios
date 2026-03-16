"use client";

import { useState, useEffect } from "react";
import { DollarSign, Lock, History, AlertTriangle, ArrowUpCircle, ArrowDownCircle, Plus, Minus, TrendingUp } from "lucide-react";
import { getOpenSession, openSession, closeSession, getSessionHistory, registerCashMovement, getUserRole } from "@/app/actions/cash";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";

export default function CashPage() {
       const [status, setStatus] = useState<"LOADING" | "OPEN" | "CLOSED">("LOADING");
       const [currentSession, setCurrentSession] = useState<any>(null);
       const [history, setHistory] = useState<any[]>([]);
       const [userRole, setUserRole] = useState<string>("EMPLOYEE");

       // Modal controls
       const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
       const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
       const [movementModal, setMovementModal] = useState({ open: false, type: 'IN' as 'IN' | 'OUT' });
       const [summaryModal, setSummaryModal] = useState({ open: false, session: null as any });

       // Form inputs
       const [amountInput, setAmountInput] = useState("");
       const [descInput, setDescInput] = useState("");
       const [loadingAction, setLoadingAction] = useState(false);

       const refreshData = async () => {
              const [session, hist] = await Promise.all([
                     getOpenSession(),
                     getSessionHistory()
              ]);
              setCurrentSession(session);
              setStatus(session ? "OPEN" : "CLOSED");
              setHistory(hist);
       };

       useEffect(() => {
              refreshData();
              getUserRole().then(role => setUserRole(role));
       }, []);

       const handleOpen = async () => {
              try {
                     setLoadingAction(true);
                     await openSession(Number(amountInput));
                     setIsOpenModalOpen(false);
                     setAmountInput("");
                     await refreshData();
              } catch (e: any) {
                     alert(e.message);
              } finally {
                     setLoadingAction(false);
              }
       };

       const handleClose = async () => {
              try {
                     setLoadingAction(true);
                     if (!currentSession) return;
                     const result = await closeSession(currentSession.id, Number(amountInput));
                     
                     const diff = Number(result.difference);
                     const absDiff = Math.abs(diff);
                     
                     if (absDiff < 1) {
                            alert(`✅ Caja Cerrada Correctamente.\n\nEl monto reportado coincide con el sistema.`);
                     } else {
                            const message = diff > 0 
                                   ? `⚠️ Caja Cerrada con SOBRANTE de ${formatCurrency(absDiff)}`
                                   : `❌ Caja Cerrada con FALTANTE de ${formatCurrency(absDiff)}`;
                            
                            alert(`${message}\n\nReportado: ${formatCurrency(amountInput)}\nEsperado: ${formatCurrency(result.expected)}`);
                     }

                     setIsCloseModalOpen(false);
                     setAmountInput("");
                     await refreshData();
              } catch (e: any) {
                     alert(e.message);
              } finally {
                     setLoadingAction(false);
              }
       };

       const handleMovement = async () => {
              try {
                     setLoadingAction(true);
                     await registerCashMovement(Number(amountInput), movementModal.type, descInput);
                     setMovementModal({ ...movementModal, open: false });
                     setAmountInput("");
                     setDescInput("");
                     await refreshData();
              } catch (e: any) {
                     alert(e.message);
              } finally {
                     setLoadingAction(false);
              }
       };

       if (status === "LOADING") return <div className="p-8">Cargando caja...</div>;

       const expectedTotal = currentSession ? Number(currentSession.expectedCash || 0) : 0;

       return (
              <div className="space-y-6 max-w-5xl mx-auto">
                     <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Gestión de Caja</h1>

                     {/* Active Status Card */}
                     <div className={`p-4 lg:p-6 rounded-xl border-l-4 shadow-sm bg-white border ${status === "OPEN" ? "border-l-green-500 border-gray-200" : "border-l-red-500 border-gray-200"}`}>
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                                   <div className="flex-1">
                                          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                                 {status === "OPEN" ? <span className="text-green-600">● Caja Abierta</span> : <span className="text-red-600">● Caja Cerrada</span>}
                                          </h2>
                                          {status === "OPEN" && (
                                                 <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                                        <div className="p-3 bg-gray-50 rounded-lg">
                                                               <p className="text-gray-500 mb-1 text-xs">Caja Inicial</p>
                                                               <span className="font-mono font-medium text-base lg:text-lg text-gray-900">{formatCurrency(currentSession.initialCash)}</span>
                                                        </div>
                                                        <div className="p-3 bg-blue-50 rounded-lg">
                                                               <p className="text-blue-500 mb-1 text-xs">Ventas (Efvo)</p>
                                                               <span className="font-mono font-medium text-base lg:text-lg text-blue-700">+{formatCurrency(currentSession.currentSales || 0)}</span>
                                                        </div>
                                                        <div className="p-3 bg-green-50 rounded-lg">
                                                               <p className="text-green-600 mb-1 text-xs">Ingresos</p>
                                                               <span className="font-mono font-medium text-base lg:text-lg text-green-700">+{formatCurrency(currentSession.totalIn || 0)}</span>
                                                        </div>
                                                        <div className="p-3 bg-red-50 rounded-lg">
                                                               <p className="text-red-500 mb-1 text-xs">Egresos / Gastos</p>
                                                               <span className="font-mono font-medium text-base lg:text-lg text-red-700">-{formatCurrency(currentSession.totalOut || 0)}</span>
                                                        </div>
                                                 </div>
                                          )}

                                          {status === "OPEN" && (
                                                 <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                                        <div>
                                                               <p className="text-sm text-gray-500">Saldo Esperado en Caja</p>
                                                               <p className="text-2xl lg:text-3xl font-bold text-gray-900">
                                                                      {userRole === 'OWNER' ? formatCurrency(expectedTotal) : '***'}
                                                               </p>
                                                        </div>
                                                        <div className="flex gap-2 w-full sm:w-auto">
                                                               <button
                                                                      onClick={() => setMovementModal({ open: true, type: 'IN' })}
                                                                      className="flex-1 sm:flex-none px-3 py-2 text-sm font-medium bg-green-100 text-green-700 hover:bg-green-200 rounded-lg flex items-center justify-center gap-2 transition-colors"
                                                               >
                                                                      <Plus className="w-4 h-4" /> Ingreso
                                                               </button>
                                                               <button
                                                                      onClick={() => setMovementModal({ open: true, type: 'OUT' })}
                                                                      className="flex-1 sm:flex-none px-3 py-2 text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 rounded-lg flex items-center justify-center gap-2 transition-colors"
                                                               >
                                                                      <Minus className="w-4 h-4" /> Gasto / Retiro
                                                               </button>
                                                        </div>
                                                 </div>
                                          )}

                                          {status === "CLOSED" && (
                                                 <p className="text-gray-500 mt-2">No se pueden realizar ventas hasta abrir la caja.</p>
                                          )}
                                   </div>

                                   <div className="sm:ml-6 sm:border-l sm:pl-6 border-gray-100 flex items-center">
                                          {status === "CLOSED" ? (
                                                 <button
                                                        onClick={() => setIsOpenModalOpen(true)}
                                                        className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-green-500/20 transition-all"
                                                 >
                                                        <DollarSign className="h-5 w-5" />
                                                        ABRIR CAJA
                                                 </button>
                                          ) : (
                                                 <button
                                                        onClick={() => setIsCloseModalOpen(true)}
                                                        className="w-full sm:w-auto px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-black font-bold flex items-center justify-center gap-2 shadow-lg transition-all"
                                                 >
                                                        <Lock className="h-5 w-5" />
                                                        CERRAR CAJA
                                                 </button>
                                          )}
                                   </div>
                            </div>

                            {/* Movements List */}
                            {status === "OPEN" && currentSession.movements && currentSession.movements.length > 0 && (
                                   <div className="mt-6 border-t pt-4">
                                          <h4 className="text-sm font-medium text-gray-500 mb-3">Movimientos Recientes</h4>
                                          <div className="space-y-2 max-h-40 overflow-y-auto">
                                                 {currentSession.movements.map((m: any) => (
                                                        <div key={m.id} className="flex justify-between items-center text-sm p-2 rounded hover:bg-gray-50">
                                                               <div className="flex items-center gap-3 min-w-0">
                                                                      {m.type === 'IN' ? <ArrowUpCircle className="w-4 h-4 text-green-500 shrink-0" /> : <ArrowDownCircle className="w-4 h-4 text-red-500 shrink-0" />}
                                                                      <span className="text-gray-900 font-medium truncate">{m.description || 'Sin descripción'}</span>
                                                                      <span className="text-xs text-gray-400 shrink-0">{formatTime(m.timestamp)}</span>
                                                               </div>
                                                               <span className={`font-mono font-medium shrink-0 ml-2 ${m.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                                                                      {m.type === 'IN' ? '+' : '-'}{formatCurrency(m.amount)}
                                                               </span>
                                                        </div>
                                                 ))}
                                          </div>
                                   </div>
                            )}
                     </div>

                     {/* History Table */}
                     <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-4 lg:px-6 py-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
                                   <History className="h-5 w-5 text-gray-500" />
                                   <h3 className="font-semibold text-gray-900">Historial de Cierres</h3>
                            </div>
                            <div className="overflow-x-auto">
                                   <table className="w-full text-sm text-left min-w-[500px]">
                                          <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                                                 <tr>
                                                        <th className="px-4 lg:px-6 py-3">Fecha Inicio</th>
                                                        <th className="px-4 lg:px-6 py-3 hidden sm:table-cell">Fecha Cierre</th>
                                                        <th className="px-4 lg:px-6 py-3 text-right">Inicial</th>
                                                        {userRole === 'OWNER' && <th className="px-4 lg:px-6 py-3 text-right hidden md:table-cell">Sistema</th>}
                                                        <th className="px-4 lg:px-6 py-3 text-right">Real</th>
                                                        <th className="px-4 lg:px-6 py-3 text-center">Estado</th>
                                                        <th className="px-4 lg:px-6 py-3 text-center">Acciones</th>
                                                 </tr>
                                          </thead>
                                          <tbody className="divide-y divide-gray-100">
                                                 {history.map(s => {
                                                        const diff = Number(s.finalCashReal || 0) - (Number(s.finalCashSystem || 0));
                                                        const isBalanced = Math.abs(diff) < 1;

                                                        return (
                                                               <tr key={s.id} className="hover:bg-gray-50">
                                                                      <td className="px-4 lg:px-6 py-3">{formatDate(s.startTime)} {formatTime(s.startTime)}</td>
                                                                      <td className="px-4 lg:px-6 py-3 hidden sm:table-cell">{s.endTime ? formatTime(s.endTime) : "-"}</td>
                                                                      <td className="px-4 lg:px-6 py-3 text-right text-gray-500">{formatCurrency(s.initialCash)}</td>
                                                                      {userRole === 'OWNER' && (
                                                                             <td className="px-4 lg:px-6 py-3 text-right font-medium hidden md:table-cell">{formatCurrency(s.finalCashSystem || 0)}</td>
                                                                      )}
                                                                      <td className="px-4 lg:px-6 py-3 text-right font-bold text-gray-900">
                                                                             {s.status === 'CLOSED' ? formatCurrency(s.finalCashReal) : '-'}
                                                                      </td>
                                                                       <td className="px-4 lg:px-6 py-3 text-center">
                                                                              {s.status === 'OPEN' ? (
                                                                                     <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">ACTIVA</span>
                                                                              ) : (
                                                                                     <div className="flex flex-col items-center">
                                                                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">CERRADA</span>
                                                                                            {userRole === 'OWNER' && !isBalanced && (
                                                                                                   <span className={`text-[10px] font-bold mt-1 ${diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                                                          {diff > 0 ? '+' : ''}{diff.toFixed(0)}
                                                                                                   </span>
                                                                                            )}
                                                                                     </div>
                                                                              )}
                                                                       </td>
                                                                       <td className="px-4 lg:px-6 py-3 text-center">
                                                                              {s.summary && (
                                                                                     <button 
                                                                                            onClick={() => setSummaryModal({ open: true, session: s })}
                                                                                            className="px-2 py-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded border border-blue-200 transition-colors font-medium"
                                                                                     >
                                                                                            RESUMEN
                                                                                     </button>
                                                                              )}
                                                                       </td>
                                                                </tr>
                                                        );
                                                 })}
                                          </tbody>
                                   </table>
                            </div>
                     </div>

                     {/* Modals */}
                     <Modal isOpen={isOpenModalOpen} onClose={() => setIsOpenModalOpen(false)} title="Abrir Nueva Caja">
                            <div className="space-y-4">
                                   <p className="text-gray-600 text-sm">Ingrese el monto de efectivo inicial en la caja (cambio).</p>
                                   <div>
                                          <label className="block text-sm font-medium text-gray-700">Monto Inicial ($)</label>
                                          <input
                                                 type="number"
                                                 className="w-full mt-1 p-2 border rounded-md"
                                                 value={amountInput}
                                                 onChange={e => setAmountInput(e.target.value)}
                                                 autoFocus
                                          />
                                   </div>
                                   <button onClick={handleOpen} disabled={loadingAction} className="w-full bg-green-600 text-white py-2 rounded-md font-medium hover:bg-green-700">
                                          {loadingAction ? "Abriendo..." : "Confirmar Apertura"}
                                   </button>
                            </div>
                     </Modal>

                     <Modal isOpen={isCloseModalOpen} onClose={() => setIsCloseModalOpen(false)} title="Cerrar Caja (Corte)">
                            <div className="space-y-4">
                                   {userRole === 'OWNER' && (
                                          <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
                                                 <div className="flex justify-between items-center mb-2">
                                                        <span className="text-sm text-yellow-800 font-medium">Saldo Esperado (Sistema)</span>
                                                        <span className="text-lg font-bold text-yellow-900">{formatCurrency(expectedTotal)}</span>
                                                 </div>
                                                 <p className="text-xs text-yellow-700">
                                                        Incluye: Inicial + Ventas Efvo + Ingresos - Egresos
                                                 </p>
                                          </div>
                                   )}

                                   <p className="text-gray-600 text-sm">Cuente el dinero real en la caja e ingréselo abajo.</p>
                                   <div>
                                          <label className="block text-sm font-medium text-gray-700">Monto Real Encontrado ($)</label>
                                          <input
                                                 type="number"
                                                 className="w-full mt-1 p-2 border rounded-md text-3xl font-bold tracking-tight text-center"
                                                 value={amountInput}
                                                 onChange={e => setAmountInput(e.target.value)}
                                                 placeholder="0.00"
                                                 autoFocus
                                          />
                                   </div>
                                   <button onClick={handleClose} disabled={loadingAction} className="w-full bg-slate-900 text-white py-3 rounded-md font-bold hover:bg-black">
                                          {loadingAction ? "Cerrando..." : "Finalizar Turno"}
                                   </button>
                            </div>
                     </Modal>

                     <Modal isOpen={movementModal.open} onClose={() => setMovementModal({ ...movementModal, open: false })} title={movementModal.type === 'IN' ? 'Registrar Ingreso de Dinero' : 'Registrar Gasto / Retiro'}>
                            <div className="space-y-4">
                                   <p className="text-sm text-gray-500">
                                          {movementModal.type === 'IN'
                                                 ? 'Agregue dinero a la caja (ej: cambio extra, pago de deuda).'
                                                 : 'Retire dinero de la caja (ej: pago a proveedor, retiro de dueño).'}
                                   </p>
                                   <div>
                                          <label className="block text-sm font-medium text-gray-700">Monto ($)</label>
                                          <input
                                                 type="number"
                                                 className="w-full mt-1 p-2 border rounded-md font-bold text-lg"
                                                 value={amountInput}
                                                 onChange={e => setAmountInput(e.target.value)}
                                                 autoFocus
                                          />
                                   </div>
                                   <div>
                                          <label className="block text-sm font-medium text-gray-700">Descripción / Motivo</label>
                                          <input
                                                 type="text"
                                                 className="w-full mt-1 p-2 border rounded-md"
                                                 value={descInput}
                                                 onChange={e => setDescInput(e.target.value)}
                                                 placeholder={movementModal.type === 'IN' ? "Ej: Aporte de cambio" : "Ej: Pago Coca-Cola"}
                                          />
                                          {movementModal.type === 'OUT' && (
                                                 <div className="flex gap-2 mt-2 flex-wrap">
                                                        {['Pago Proveedor', 'Retiro Dueño', 'Gastos de Limpieza', 'Servicios'].map(tag => (
                                                               <button
                                                                      key={tag}
                                                                      onClick={() => setDescInput(tag)}
                                                                      className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full border border-gray-200 transition-colors"
                                                               >
                                                                      {tag}
                                                               </button>
                                                        ))}
                                                 </div>
                                          )}
                                   </div>
                                   <button
                                          onClick={handleMovement}
                                          disabled={loadingAction}
                                          className={`w-full py-2 rounded-md font-medium text-white ${movementModal.type === 'IN' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                                   >
                                          {loadingAction ? "Registrando..." : "Registrar Movimiento"}
                                   </button>
                            </div>
                     </Modal>

                     {/* Summary Modal */}
                     <Modal 
                            isOpen={summaryModal.open} 
                            onClose={() => setSummaryModal({ ...summaryModal, open: false })} 
                            title={summaryModal.session ? `Resumen de Caja - ${formatDate(summaryModal.session.startTime)}` : "Resumen de Caja"}
                     >
                            {summaryModal.session?.summary ? (
                                   <div className="space-y-6">
                                          <div className="grid grid-cols-2 gap-4">
                                                 <div className="p-3 bg-gray-50 rounded-lg">
                                                        <p className="text-gray-500 text-xs mb-1">Monto Inicial</p>
                                                        <p className="font-bold text-lg">{formatCurrency(summaryModal.session.initialCash)}</p>
                                                 </div>
                                                 <div className="p-3 bg-gray-50 rounded-lg">
                                                        <p className="text-gray-500 text-xs mb-1">Total Ventas</p>
                                                        <p className="font-bold text-lg text-blue-600">{formatCurrency(summaryModal.session.summary.totalSales)}</p>
                                                 </div>
                                          </div>

                                          <div>
                                                 <h4 className="text-sm font-semibold text-gray-700 mb-2 border-b pb-1">Ventas por Medio de Pago</h4>
                                                 <div className="space-y-2">
                                                        {Object.entries(summaryModal.session.summary.salesByMethod || {}).map(([method, amount]: [string, any]) => (
                                                               <div key={method} className="flex justify-between text-sm">
                                                                      <span className="text-gray-600">{method}</span>
                                                                      <span className="font-mono font-medium">{formatCurrency(amount)}</span>
                                                               </div>
                                                        ))}
                                                 </div>
                                          </div>

                                          <div className="grid grid-cols-2 gap-4">
                                                 <div>
                                                        <h4 className="text-sm font-semibold text-gray-700 mb-2 border-b pb-1">Movimientos</h4>
                                                        <div className="space-y-1 text-sm">
                                                               <div className="flex justify-between">
                                                                      <span className="text-green-600">Ingresos (+)</span>
                                                                      <span className="font-mono">{formatCurrency(summaryModal.session.summary.cashIn)}</span>
                                                               </div>
                                                               <div className="flex justify-between">
                                                                      <span className="text-red-600">Egresos (-)</span>
                                                                      <span className="font-mono">{formatCurrency(summaryModal.session.summary.cashOut)}</span>
                                                               </div>
                                                        </div>
                                                 </div>
                                                 <div>
                                                        <h4 className="text-sm font-semibold text-gray-700 mb-2 border-b pb-1">Estadísticas</h4>
                                                        <div className="space-y-1 text-sm">
                                                               <div className="flex justify-between">
                                                                      <span className="text-gray-500">Transacciones</span>
                                                                      <span>{summaryModal.session.summary.salesCount}</span>
                                                               </div>
                                                               <div className="flex justify-between">
                                                                      <span className="text-gray-500">Movimientos</span>
                                                                      <span>{summaryModal.session.summary.movementsCount}</span>
                                                               </div>
                                                        </div>
                                                 </div>
                                          </div>

                                          <div className="pt-4 border-t">
                                                 <div className="flex justify-between items-center p-3 bg-slate-900 text-white rounded-lg">
                                                        <span className="font-medium">Cierre Real Reportado</span>
                                                        <span className="text-xl font-bold">{formatCurrency(summaryModal.session.finalCashReal)}</span>
                                                 </div>
                                                 {summaryModal.session.notes && (
                                                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-100 rounded-lg text-sm italic text-yellow-800">
                                                               "{summaryModal.session.notes}"
                                                        </div>
                                                 )}
                                          </div>
                                   </div>
                            ) : (
                                   <p className="text-gray-500 text-center py-8">No hay resumen detallado para este cierre.</p>
                            )}
                     </Modal>
              </div>
       );
}
