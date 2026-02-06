"use client";

import { useState, useEffect } from "react";
import { DollarSign, Lock, History, AlertTriangle, ArrowUpCircle, ArrowDownCircle, Plus, Minus, TrendingUp } from "lucide-react";
import { getOpenSession, openSession, closeSession, getSessionHistory, registerCashMovement } from "@/app/actions/cash";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";

export default function CashPage() {
       const [status, setStatus] = useState<"LOADING" | "OPEN" | "CLOSED">("LOADING");
       const [currentSession, setCurrentSession] = useState<any>(null);
       const [history, setHistory] = useState<any[]>([]);

       // Modal controls
       const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
       const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
       const [movementModal, setMovementModal] = useState({ open: false, type: 'IN' as 'IN' | 'OUT' });

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
                     await closeSession(currentSession.id, Number(amountInput));
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
                     <h1 className="text-2xl font-bold text-gray-900">Gestión de Caja</h1>

                     {/* Active Status Card */}
                     <div className={`p-6 rounded-xl border-l-4 shadow-sm bg-white border ${status === "OPEN" ? "border-l-green-500 border-gray-200" : "border-l-red-500 border-gray-200"}`}>
                            <div className="flex justify-between items-start">
                                   <div className="flex-1">
                                          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                                 {status === "OPEN" ? <span className="text-green-600">● Caja Abierta</span> : <span className="text-red-600">● Caja Cerrada</span>}
                                          </h2>
                                          {status === "OPEN" && (
                                                 <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                        <div className="p-3 bg-gray-50 rounded-lg">
                                                               <p className="text-gray-500 mb-1">Caja Inicial</p>
                                                               <span className="font-mono font-medium text-lg text-gray-900">{formatCurrency(currentSession.initialCash)}</span>
                                                        </div>
                                                        <div className="p-3 bg-blue-50 rounded-lg">
                                                               <p className="text-blue-500 mb-1">Ventas (Efectivo)</p>
                                                               <span className="font-mono font-medium text-lg text-blue-700">+{formatCurrency(currentSession.currentSales || 0)}</span>
                                                        </div>
                                                        <div className="p-3 bg-green-50 rounded-lg">
                                                               <p className="text-green-600 mb-1">Ingresos</p>
                                                               <span className="font-mono font-medium text-lg text-green-700">+{formatCurrency(currentSession.totalIn || 0)}</span>
                                                        </div>
                                                        <div className="p-3 bg-red-50 rounded-lg">
                                                               <p className="text-red-500 mb-1">Egresos / Gastos</p>
                                                               <span className="font-mono font-medium text-lg text-red-700">-{formatCurrency(currentSession.totalOut || 0)}</span>
                                                        </div>
                                                 </div>
                                          )}

                                          {status === "OPEN" && (
                                                 <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                                                        <div>
                                                               <p className="text-sm text-gray-500">Saldo Esperado en Caja</p>
                                                               <p className="text-3xl font-bold text-gray-900">{formatCurrency(expectedTotal)}</p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                               <button
                                                                      onClick={() => setMovementModal({ open: true, type: 'IN' })}
                                                                      className="px-3 py-2 text-sm font-medium bg-green-100 text-green-700 hover:bg-green-200 rounded-lg flex items-center gap-2 transition-colors"
                                                               >
                                                                      <Plus className="w-4 h-4" /> Ingreso
                                                               </button>
                                                               <button
                                                                      onClick={() => setMovementModal({ open: true, type: 'OUT' })}
                                                                      className="px-3 py-2 text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 rounded-lg flex items-center gap-2 transition-colors"
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

                                   <div className="ml-6 border-l pl-6 border-gray-100 h-full flex items-center">
                                          {status === "CLOSED" ? (
                                                 <button
                                                        onClick={() => setIsOpenModalOpen(true)}
                                                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold flex items-center gap-2 shadow-lg hover:shadow-green-500/20 transition-all"
                                                 >
                                                        <DollarSign className="h-5 w-5" />
                                                        ABRIR CAJA
                                                 </button>
                                          ) : (
                                                 <button
                                                        onClick={() => setIsCloseModalOpen(true)}
                                                        className="px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-black font-bold flex items-center gap-2 shadow-lg transition-all"
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
                                                               <div className="flex items-center gap-3">
                                                                      {m.type === 'IN' ? <ArrowUpCircle className="w-4 h-4 text-green-500" /> : <ArrowDownCircle className="w-4 h-4 text-red-500" />}
                                                                      <span className="text-gray-900 font-medium">{m.description || 'Sin descripción'}</span>
                                                                      <span className="text-xs text-gray-400">{formatTime(m.timestamp)}</span>
                                                               </div>
                                                               <span className={`font-mono font-medium ${m.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
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
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
                                   <History className="h-5 w-5 text-gray-500" />
                                   <h3 className="font-semibold text-gray-900">Historial de Cierres</h3>
                            </div>
                            <table className="w-full text-sm text-left">
                                   <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                                          <tr>
                                                 <th className="px-6 py-3">Fecha Inicio</th>
                                                 <th className="px-6 py-3">Fecha Cierre</th>
                                                 <th className="px-6 py-3 text-right">Inicial</th>
                                                 <th className="px-6 py-3 text-right">Sistema</th>
                                                 <th className="px-6 py-3 text-right">Real</th>
                                                 <th className="px-6 py-3 text-center">Estado</th>
                                          </tr>
                                   </thead>
                                   <tbody className="divide-y divide-gray-100">
                                          {history.map(s => {
                                                 const diff = Number(s.finalCashReal || 0) - (Number(s.finalCashSystem || 0));
                                                 const isBalanced = Math.abs(diff) < 1;

                                                 return (
                                                        <tr key={s.id} className="hover:bg-gray-50">
                                                               <td className="px-6 py-4">{formatDate(s.startTime)} {formatTime(s.startTime)}</td>
                                                               <td className="px-6 py-4">{s.endTime ? formatTime(s.endTime) : "-"}</td>
                                                               <td className="px-6 py-4 text-right text-gray-500">{formatCurrency(s.initialCash)}</td>
                                                               <td className="px-6 py-4 text-right font-medium">{formatCurrency(s.finalCashSystem || 0)}</td>
                                                               <td className="px-6 py-4 text-right font-bold text-gray-900">
                                                                      {s.status === 'CLOSED' ? formatCurrency(s.finalCashReal) : '-'}
                                                               </td>
                                                               <td className="px-6 py-4 text-center">
                                                                      {s.status === 'OPEN' ? (
                                                                             <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">ACTIVA</span>
                                                                      ) : (
                                                                             <div className="flex flex-col items-center">
                                                                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">CERRADA</span>
                                                                                    {!isBalanced && (
                                                                                           <span className={`text-[10px] font-bold mt-1 ${diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                                                  {diff > 0 ? '+' : ''}{diff.toFixed(0)}
                                                                                           </span>
                                                                                    )}
                                                                             </div>
                                                                      )}
                                                               </td>
                                                        </tr>
                                                 );
                                          })}
                                   </tbody>
                            </table>
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
                                   <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
                                          <div className="flex justify-between items-center mb-2">
                                                 <span className="text-sm text-yellow-800 font-medium">Saldo Esperado (Sistema)</span>
                                                 <span className="text-lg font-bold text-yellow-900">{formatCurrency(expectedTotal)}</span>
                                          </div>
                                          <p className="text-xs text-yellow-700">
                                                 Incluye: Inicial + Ventas Efvo + Ingresos - Egresos
                                          </p>
                                   </div>

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
              </div>
       );
}
