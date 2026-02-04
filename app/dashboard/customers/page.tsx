"use client";

import { useState, useEffect, useCallback } from "react";
import { UserPlus, Search, Wallet, History, CreditCard } from "lucide-react";
import { getCustomers, registerPayment, createCustomer, getCustomerHistory } from "@/app/actions/customers";
import { Modal } from "@/components/ui/modal";

interface Customer {
       id: number;
       name: string;
       phone?: string | null;
       currentBalance: number;
       active: boolean;
}

export default function CustomersPage() {
       const [customers, setCustomers] = useState<Customer[]>([]);
       const [loading, setLoading] = useState(true);
       const [searchQuery, setSearchQuery] = useState("");

       // Modals
       const [isCreateOpen, setIsCreateOpen] = useState(false);
       const [isPaymentOpen, setIsPaymentOpen] = useState(false);
       const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

       // Forms
       const [newCustomer, setNewCustomer] = useState({ name: "", phone: "" });
       const [paymentAmount, setPaymentAmount] = useState("");

       const fetchCustomers = useCallback(async () => {
              setLoading(true);
              const data = await getCustomers();
              setCustomers(data);
              setLoading(false);
       }, []);

       // Initial load
       useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

       const handleCreate = async () => {
              try {
                     await createCustomer(newCustomer);
                     setNewCustomer({ name: "", phone: "" });
                     setIsCreateOpen(false);
                     fetchCustomers();
              } catch (e: any) { alert(e.message); }
       };

       const handlePayment = async () => {
              if (!selectedCustomer) return;
              try {
                     await registerPayment(selectedCustomer.id, Number(paymentAmount), "Pago a cuenta", "EFECTIVO");
                     setPaymentAmount("");
                     setIsPaymentOpen(false);
                     setSelectedCustomer(null);
                     fetchCustomers();
              } catch (e: any) { alert(e.message); }
       };

       const [history, setHistory] = useState<any[]>([]);
       const [isHistoryOpen, setIsHistoryOpen] = useState(false);

       const handleViewHistory = async (customer: Customer) => {
              setSelectedCustomer(customer);
              setLoading(true); // Re-use loading or add specific one
              try {
                     const hist = await getCustomerHistory(customer.id);
                     setHistory(hist);
                     setIsHistoryOpen(true);
              } catch (e) {
                     console.error(e);
              } finally {
                     setLoading(false);
              }
       };

       const filtered = customers.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

       return (
              <div className="space-y-6">
                     <div className="flex justify-between items-center">
                            <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
                            <button
                                   onClick={() => setIsCreateOpen(true)}
                                   className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                            >
                                   <UserPlus className="h-4 w-4" />
                                   Nuevo Cliente
                            </button>
                     </div>

                     <div className="bg-white p-4 rounded-lg border border-gray-200 flex gap-2">
                            <Search className="text-gray-400" />
                            <input
                                   placeholder="Buscar cliente..."
                                   className="flex-1 outline-none"
                                   value={searchQuery}
                                   onChange={e => setSearchQuery(e.target.value)}
                            />
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {loading ? <p>Cargando...</p> : filtered.map(customer => (
                                   <div key={customer.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                          <div className="flex justify-between items-start mb-4">
                                                 <div>
                                                        <h3 className="font-bold text-lg text-gray-900">{customer.name}</h3>
                                                        <p className="text-sm text-gray-500">{customer.phone || "Sin teléfono"}</p>
                                                 </div>
                                                 <div className={`text-right ${Number(customer.currentBalance) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                        <p className="text-xs text-gray-500 uppercase font-semibold">Saldo</p>
                                                        <p className="text-xl font-bold">${Number(customer.currentBalance).toFixed(2)}</p>
                                                 </div>
                                          </div>

                                          <div className="flex gap-2 border-t pt-4">
                                                 <button
                                                        onClick={() => {
                                                               setSelectedCustomer(customer);
                                                               setIsPaymentOpen(true);
                                                        }}
                                                        className="flex-1 bg-green-50 text-green-700 py-2 rounded-lg text-sm font-medium hover:bg-green-100 flex items-center justify-center gap-2"
                                                 >
                                                        <Wallet className="h-4 w-4" />
                                                        Registrar Pago
                                                 </button>
                                                 <button
                                                        onClick={() => handleViewHistory(customer)}
                                                        className="flex-1 bg-gray-50 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 flex items-center justify-center gap-2"
                                                 >
                                                        <History className="h-4 w-4" />
                                                        Ver Cuenta
                                                 </button>
                                          </div>
                                   </div>
                            ))}
                     </div>

                     {/* History Modal */}
                     <Modal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} title={`Historial: ${selectedCustomer?.name}`}>
                            <div className="max-h-[60vh] overflow-y-auto">
                                   <table className="w-full text-sm text-left">
                                          <thead className="bg-gray-50 text-gray-500 font-medium">
                                                 <tr>
                                                        <th className="p-3">Fecha</th>
                                                        <th className="p-3">Descripción</th>
                                                        <th className="p-3 text-right">Monto</th>
                                                 </tr>
                                          </thead>
                                          <tbody className="divide-y divide-gray-100">
                                                 {history.map((h: any) => (
                                                        <tr key={h.id}>
                                                               <td className="p-3 text-gray-500">{new Date(h.timestamp).toLocaleDateString()} {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                                               <td className="p-3 text-gray-900">{h.description}</td>
                                                               <td className={`p-3 text-right font-bold ${h.amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                                      {h.amount > 0 ? '+' : ''}{Number(h.amount).toFixed(2)}
                                                               </td>
                                                        </tr>
                                                 ))}
                                                 {history.length === 0 && (
                                                        <tr>
                                                               <td colSpan={3} className="p-4 text-center text-gray-400">Sin movimientos recientes</td>
                                                        </tr>
                                                 )}
                                          </tbody>
                                   </table>
                            </div>
                            <div className="mt-4 pt-4 border-t flex justify-end">
                                   <button onClick={() => setIsHistoryOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cerrar</button>
                            </div>
                     </Modal>

                     {/* Create Customer Modal */}
                     <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Nuevo Cliente">
                            <div className="space-y-4">
                                   <div>
                                          <label className="block text-sm font-medium text-gray-700">Nombre</label>
                                          <input className="w-full border p-2 rounded-md" value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} />
                                   </div>
                                   <div>
                                          <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                                          <input className="w-full border p-2 rounded-md" value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
                                   </div>
                                   <button onClick={handleCreate} className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium">Guardar Cliente</button>
                            </div>
                     </Modal>

                     {/* Payment Modal */}
                     <Modal isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} title={`Cobrar a ${selectedCustomer?.name || 'Cliente'}`}>
                            <div className="space-y-4">
                                   <div className="bg-red-50 p-4 rounded-lg text-center">
                                          <p className="text-sm text-red-600">Deuda Actual</p>
                                          <p className="text-3xl font-bold text-red-700">${selectedCustomer ? Number(selectedCustomer.currentBalance).toFixed(2) : "0.00"}</p>
                                   </div>
                                   <div>
                                          <label className="block text-sm font-medium text-gray-700">Monto del Pago ($)</label>
                                          <input
                                                 type="number"
                                                 className="w-full border p-2 rounded-md font-bold text-lg"
                                                 value={paymentAmount}
                                                 onChange={e => setPaymentAmount(e.target.value)}
                                                 autoFocus
                                          />
                                   </div>
                                   <button onClick={handlePayment} className="w-full bg-green-600 text-white py-2 rounded-lg font-medium flex justify-center items-center gap-2">
                                          <CreditCard className="h-5 w-5" />
                                          Confirmar Cobro
                                   </button>
                            </div>
                     </Modal>
              </div>
       );
}
