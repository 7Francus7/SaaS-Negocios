"use client";

import { useState, useEffect, useCallback } from "react";
import { UserPlus, Search, Wallet, History, CreditCard, Shield, MapPin, Hash, DollarSign } from "lucide-react";
import { getCustomers, registerPayment, createCustomer, getCustomerHistory } from "@/app/actions/customers";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

interface Customer {
       id: number;
       name: string;
       dni?: string | null;
       phone?: string | null;
       address?: string | null;
       currentBalance: number;
       creditLimit: number;
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
       const [newCustomer, setNewCustomer] = useState({
              name: "",
              dni: "",
              phone: "",
              address: "",
              creditLimit: 0
       });
       const [paymentAmount, setPaymentAmount] = useState("");
       const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("EFECTIVO");

       const fetchCustomers = useCallback(async () => {
              setLoading(true);
              const data = await getCustomers();
              setCustomers(data as any);
              setLoading(false);
       }, []);

       // Initial load
       useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

       const handleCreate = async () => {
              try {
                     await createCustomer({
                            ...newCustomer,
                            creditLimit: Number(newCustomer.creditLimit)
                     });
                     setNewCustomer({ name: "", dni: "", phone: "", address: "", creditLimit: 0 });
                     setIsCreateOpen(false);
                     fetchCustomers();
              } catch (e: any) { alert(e.message); }
       };

       const handlePayment = async () => {
              if (!selectedCustomer) return;
              try {
                     await registerPayment(selectedCustomer.id, Number(paymentAmount), "Pago a cuenta", selectedPaymentMethod);
                     setPaymentAmount("");
                     setSelectedPaymentMethod("EFECTIVO");
                     setIsPaymentOpen(false);
                     setSelectedCustomer(null);
                     fetchCustomers();
              } catch (e: any) { alert(e.message); }
       };

       const [history, setHistory] = useState<any[]>([]);
       const [isHistoryOpen, setIsHistoryOpen] = useState(false);

       const handleViewHistory = async (customer: Customer) => {
              setSelectedCustomer(customer);
              setLoading(true);
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
                            <div>
                                   <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
                                   <p className="text-sm text-gray-500">Gestione sus clientes y cuentas corrientes</p>
                            </div>
                            <button
                                   onClick={() => setIsCreateOpen(true)}
                                   className="bg-blue-600 text-white px-4 py-2 rounded-xl border-b-4 border-blue-800 flex items-center gap-2 hover:bg-blue-700 active:border-b-0 active:translate-y-[2px] transition-all font-bold"
                            >
                                   <UserPlus className="h-4 w-4" />
                                   CREAR CUENTA / CLIENTE
                            </button>
                     </div>

                     <div className="bg-white p-4 rounded-2xl border border-gray-200 flex items-center gap-3 shadow-sm">
                            <Search className="text-gray-400 h-5 w-5" />
                            <input
                                   placeholder="Buscar por nombre o DNI..."
                                   className="flex-1 outline-none text-gray-700 font-medium"
                                   value={searchQuery}
                                   onChange={e => setSearchQuery(e.target.value)}
                            />
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {loading ? (
                                   <div className="col-span-full py-20 text-center text-gray-400 font-medium">Cargando clientes...</div>
                            ) : filtered.map(customer => (
                                   <div key={customer.id} className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
                                          <div className="flex justify-between items-start mb-6">
                                                 <div className="space-y-1">
                                                        <h3 className="font-black text-xl text-gray-900 uppercase tracking-tight group-hover:text-blue-600 transition-colors">{customer.name}</h3>
                                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                                                               <Hash className="h-3 w-3" />
                                                               <span>DNI: {customer.dni || "---"}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{customer.phone || "Sin teléfono"}</p>
                                                 </div>
                                                 <div className="text-right">
                                                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest leading-none mb-1">Saldo Deudor</p>
                                                        <p className={cn(
                                                               "text-2xl font-black",
                                                               Number(customer.currentBalance) > 0 ? 'text-red-500' : 'text-emerald-500'
                                                        )}>
                                                               ${Number(customer.currentBalance).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                        </p>
                                                 </div>
                                          </div>

                                          <div className="space-y-3 mb-6">
                                                 <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                                                        <MapPin className="h-3.5 w-3.5" />
                                                        <span className="truncate">{customer.address || "Dirección no registrada"}</span>
                                                 </div>
                                                 <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-black uppercase tracking-widest">
                                                               <Shield className="h-3.5 w-3.5" />
                                                               Límite de Crédito
                                                        </div>
                                                        <span className="text-sm font-bold text-gray-700">${Number(customer.creditLimit || 0).toLocaleString('es-AR')}</span>
                                                 </div>
                                          </div>

                                          <div className="flex gap-2 pt-4 border-t border-gray-50">
                                                 <button
                                                        onClick={() => {
                                                               setSelectedCustomer(customer);
                                                               setIsPaymentOpen(true);
                                                        }}
                                                        className="flex-1 bg-emerald-50 text-emerald-700 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2"
                                                 >
                                                        <Wallet className="h-4 w-4" />
                                                        COBRAR
                                                 </button>
                                                 <button
                                                        onClick={() => handleViewHistory(customer)}
                                                        className="flex-1 bg-blue-50 text-blue-700 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                                                 >
                                                        <History className="h-4 w-4" />
                                                        HISTORIAL
                                                 </button>
                                          </div>
                                   </div>
                            ))}
                     </div>

                     {/* History Modal */}
                     <Modal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} title={`Cuenta Corriente: ${selectedCustomer?.name}`}>
                            <div className="max-h-[60vh] overflow-y-auto">
                                   <table className="w-full text-sm text-left">
                                          <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-500">
                                                 <tr>
                                                        <th className="p-4">Fecha</th>
                                                        <th className="p-4">Descripción / Concepto</th>
                                                        <th className="p-4 text-right">Monto</th>
                                                 </tr>
                                          </thead>
                                          <tbody className="divide-y divide-gray-100">
                                                 {history.map((h: any) => (
                                                        <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                                                               <td className="p-4">
                                                                      <div className="flex flex-col">
                                                                             <span className="font-bold text-gray-900">{new Date(h.timestamp).toLocaleDateString()}</span>
                                                                             <span className="text-[10px] text-gray-400">{new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                      </div>
                                                               </td>
                                                               <td className="p-4 font-medium text-gray-700 uppercase text-xs">{h.description}</td>
                                                               <td className={`p-4 text-right font-black text-sm ${h.amount > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                                      {h.amount > 0 ? '+' : ''}{Number(h.amount).toFixed(2)}
                                                               </td>
                                                        </tr>
                                                 ))}
                                                 {history.length === 0 && (
                                                        <tr>
                                                               <td colSpan={3} className="p-10 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">Sin movimientos registrados</td>
                                                        </tr>
                                                 )}
                                          </tbody>
                                   </table>
                            </div>
                            <div className="mt-4 pt-4 border-t flex justify-end">
                                   <button onClick={() => setIsHistoryOpen(false)} className="px-6 py-2 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 uppercase text-xs">Cerrar</button>
                            </div>
                     </Modal>

                     {/* Create Customer Modal */}
                     <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="NUEVO CLIENTE / CUENTA CORRIENTE">
                            <div className="space-y-6">
                                   <div className="grid grid-cols-2 gap-4">
                                          <div className="col-span-2">
                                                 <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Nombre Completo *</label>
                                                 <input
                                                        className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl text-sm font-bold placeholder:font-normal focus:ring-2 focus:ring-blue-500/20 outline-none"
                                                        placeholder="Nombre y Apellido"
                                                        value={newCustomer.name}
                                                        onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                                 />
                                          </div>
                                          <div>
                                                 <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">DNI / ID</label>
                                                 <input
                                                        className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl text-sm font-bold outline-none"
                                                        placeholder="00.000.000"
                                                        value={newCustomer.dni}
                                                        onChange={e => setNewCustomer({ ...newCustomer, dni: e.target.value })}
                                                 />
                                          </div>
                                          <div>
                                                 <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Teléfono</label>
                                                 <input
                                                        className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl text-sm font-bold outline-none"
                                                        placeholder="+54 9 ..."
                                                        value={newCustomer.phone}
                                                        onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                                 />
                                          </div>
                                          <div className="col-span-2">
                                                 <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Dirección</label>
                                                 <input
                                                        className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl text-sm font-bold outline-none"
                                                        placeholder="Calle, Número, Ciudad"
                                                        value={newCustomer.address}
                                                        onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })}
                                                 />
                                          </div>
                                          <div className="col-span-2">
                                                 <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Límite de Crédito ($)</label>
                                                 <div className="relative">
                                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                                        <input
                                                               type="number"
                                                               className="w-full bg-blue-50 border border-blue-100 pl-10 p-4 rounded-xl text-xl font-black text-blue-700 outline-none"
                                                               value={newCustomer.creditLimit}
                                                               onChange={e => setNewCustomer({ ...newCustomer, creditLimit: Number(e.target.value) })}
                                                        />
                                                 </div>
                                                 <p className="text-[9px] text-gray-400 mt-2 font-bold uppercase">Monto máximo que el cliente puede adeudar.</p>
                                          </div>
                                   </div>
                                   <button
                                          onClick={handleCreate}
                                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-100 transition-all uppercase tracking-tight"
                                   >
                                          Confirmar y Crear Cuenta
                                   </button>
                            </div>
                     </Modal>

                     {/* Payment Modal */}
                     <Modal isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} title={`CARGAR PAGO: ${selectedCustomer?.name || 'Cliente'}`}>
                            <div className="space-y-6">
                                   <div className="bg-red-50 p-6 rounded-[2rem] text-center border border-red-100 flex flex-col gap-2">
                                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600">Deuda Pendiente</p>
                                          <p className="text-4xl font-black text-red-700">${selectedCustomer ? Number(selectedCustomer.currentBalance).toFixed(2) : "0.00"}</p>
                                          <button
                                                 onClick={() => selectedCustomer && setPaymentAmount(Number(selectedCustomer.currentBalance).toString())}
                                                 className="mx-auto mt-2 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1"
                                          >
                                                 <Wallet className="w-3 h-3" />
                                                 Saldar Total
                                          </button>
                                   </div>

                                   <div className="space-y-4">
                                          <div>
                                                 <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Monto a abonar ($)</label>
                                                 <input
                                                        type="number"
                                                        className="w-full border-2 border-gray-100 p-6 rounded-2xl font-black text-4xl text-center text-gray-900 outline-none focus:border-emerald-500 transition-all shadow-inner"
                                                        value={paymentAmount}
                                                        onChange={e => setPaymentAmount(e.target.value)}
                                                        placeholder="0.00"
                                                        autoFocus
                                                 />
                                          </div>

                                          <div>
                                                 <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Método de Pago</label>
                                                 <div className="grid grid-cols-2 gap-3">
                                                        {['EFECTIVO', 'TRANSFERENCIA', 'DEBITO', 'CREDITO'].map((method) => (
                                                               <button
                                                                      key={method}
                                                                      onClick={() => setSelectedPaymentMethod(method)}
                                                                      className={cn(
                                                                             "p-3 rounded-xl text-xs font-bold uppercase tracking-wider border-2 transition-all",
                                                                             selectedPaymentMethod === method ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-gray-100 text-gray-400 hover:border-gray-200"
                                                                      )}
                                                               >
                                                                      {method}
                                                               </button>
                                                        ))}
                                                 </div>
                                          </div>
                                   </div>

                                   <button
                                          onClick={handlePayment}
                                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-2xl font-black text-xl shadow-xl shadow-emerald-100 flex justify-center items-center gap-3 transition-all"
                                   >
                                          <CheckCircle className="h-6 w-6" />
                                          CONFIRMAR COBRO
                                   </button>
                            </div>
                     </Modal>
              </div>
       );
}

function CheckCircle(props: any) {
       return (
              <svg
                     {...props}
                     xmlns="http://www.w3.org/2000/svg"
                     width="24"
                     height="24"
                     viewBox="0 0 24 24"
                     fill="none"
                     stroke="currentColor"
                     strokeWidth="2"
                     strokeLinecap="round"
                     strokeLinejoin="round"
              >
                     <circle cx="12" cy="12" r="10" />
                     <path d="m9 12 2 2 4-4" />
              </svg>
       )
}
