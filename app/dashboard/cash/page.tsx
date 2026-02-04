"use client";

import { useState, useEffect } from "react";
import { DollarSign, Lock, History, AlertTriangle } from "lucide-react";
import { getOpenSession, openSession, closeSession, getSessionHistory } from "@/app/actions/cash";
import { Modal } from "@/components/ui/modal";

export default function CashPage() {
       const [status, setStatus] = useState<"LOADING" | "OPEN" | "CLOSED">("LOADING");
       const [currentSession, setCurrentSession] = useState<any>(null);
       const [history, setHistory] = useState<any[]>([]);

       // Modal controls
       const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
       const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);

       // Form inputs
       const [amountInput, setAmountInput] = useState("");
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

       if (status === "LOADING") return <div className="p-8">Cargando caja...</div>;

       const diff = currentSession
              ? (Number(currentSession.initialCash) + Number(currentSession.finalCashSystem))
              : 0;

       return (
              <div className="space-y-6 max-w-5xl mx-auto">
                     <h1 className="text-2xl font-bold text-gray-900">Gestión de Caja</h1>

                     {/* Active Status Card */}
                     <div className={`p-6 rounded-xl border-l-4 shadow-sm bg-white border ${status === "OPEN" ? "border-l-green-500 border-gray-200" : "border-l-red-500 border-gray-200"}`}>
                            <div className="flex justify-between items-start">
                                   <div>
                                          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                                 {status === "OPEN" ? <span className="text-green-600">● Caja Abierta</span> : <span className="text-red-600">● Caja Cerrada</span>}
                                          </h2>
                                          {status === "OPEN" && (
                                                 <div className="mt-2 text-sm text-gray-600 space-y-1">
                                                        <p>Inicio: {new Date(currentSession.startTime).toLocaleString()}</p>
                                                        <p>Caja Inicial: <span className="font-mono font-medium">${Number(currentSession.initialCash).toFixed(2)}</span></p>
                                                        <p>Ventas (Sistema): <span className="font-mono font-medium text-blue-600">+${Number(currentSession.finalCashSystem).toFixed(2)}</span></p>
                                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                                               <p className="text-lg font-bold text-gray-900">Total Esperado: ${diff.toFixed(2)}</p>
                                                        </div>
                                                 </div>
                                          )}
                                          {status === "CLOSED" && (
                                                 <p className="text-gray-500 mt-2">No se pueden realizar ventas hasta abrir la caja.</p>
                                          )}
                                   </div>
                                   <div>
                                          {status === "CLOSED" ? (
                                                 <button
                                                        onClick={() => setIsOpenModalOpen(true)}
                                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2 shadow-sm"
                                                 >
                                                        <DollarSign className="h-4 w-4" />
                                                        Abrir Caja
                                                 </button>
                                          ) : (
                                                 <button
                                                        onClick={() => setIsCloseModalOpen(true)}
                                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center gap-2 shadow-sm"
                                                 >
                                                        <Lock className="h-4 w-4" />
                                                        Cerrar Caja / Corte
                                                 </button>
                                          )}
                                   </div>
                            </div>
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
                                                 <th className="px-6 py-3 text-right">Ventas</th>
                                                 <th className="px-6 py-3 text-right">Real (Cierre)</th>
                                                 <th className="px-6 py-3 text-center">Estado</th>
                                          </tr>
                                   </thead>
                                   <tbody className="divide-y divide-gray-100">
                                          {history.map(s => {
                                                 const diff = Number(s.finalCashReal || 0) - (Number(s.initialCash) + Number(s.finalCashSystem || 0));
                                                 const isBalanced = Math.abs(diff) < 1;

                                                 return (
                                                        <tr key={s.id} className="hover:bg-gray-50">
                                                               <td className="px-6 py-4">{new Date(s.startTime).toLocaleDateString()} {new Date(s.startTime).toLocaleTimeString()}</td>
                                                               <td className="px-6 py-4">{s.endTime ? new Date(s.endTime).toLocaleTimeString() : "-"}</td>
                                                               <td className="px-6 py-4 text-right">${Number(s.initialCash).toFixed(2)}</td>
                                                               <td className="px-6 py-4 text-right">${Number(s.finalCashSystem || 0).toFixed(2)}</td>
                                                               <td className="px-6 py-4 text-right font-medium">
                                                                      {s.status === 'CLOSED' ? `$${Number(s.finalCashReal).toFixed(2)}` : '-'}
                                                               </td>
                                                               <td className="px-6 py-4 text-center">
                                                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                                             {s.status === 'OPEN' ? 'ACTIVA' : 'CERRADA'}
                                                                      </span>
                                                                      {s.status === 'CLOSED' && !isBalanced && (
                                                                             <span className="ml-2 text-red-500 text-xs font-bold" title={`Diferencia: $${diff.toFixed(2)}`}>
                                                                                    ⚠ {diff > 0 ? '+' : ''}{diff.toFixed(0)}
                                                                             </span>
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
                                   <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 flex gap-2">
                                          <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
                                          <p className="text-sm text-yellow-800">
                                                 El sistema registró una caja esperada de <strong>${diff.toFixed(2)}</strong>.
                                          </p>
                                   </div>
                                   <p className="text-gray-600 text-sm">Cuente el dinero real en la caja e ingréselo abajo.</p>
                                   <div>
                                          <label className="block text-sm font-medium text-gray-700">Monto Real Encontrado ($)</label>
                                          <input
                                                 type="number"
                                                 className="w-full mt-1 p-2 border rounded-md text-lg font-bold"
                                                 value={amountInput}
                                                 onChange={e => setAmountInput(e.target.value)}
                                                 autoFocus
                                          />
                                   </div>
                                   <button onClick={handleClose} disabled={loadingAction} className="w-full bg-red-600 text-white py-2 rounded-md font-medium hover:bg-red-700">
                                          {loadingAction ? "Cerrando..." : "Finalizar Turno"}
                                   </button>
                            </div>
                     </Modal>
              </div>
       );
}
