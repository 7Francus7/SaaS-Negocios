'use client'

import React, { useState } from 'react'
import { createClientPayment } from '@/actions/clients'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

export default function ClientDetailView({ client }: { client: any }) {
       const router = useRouter()
       const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
       const [loading, setLoading] = useState(false)

       // Balance is debt (positive number in this context context usually means debt in UI if red)
       // But my action returns "debt" as total unpaid bookings.
       // The list view showed balance as negative.
       // Let's stick to "Deuda: $X"

       return (
              <div className="min-h-screen bg-bg-dark text-text-white p-4 lg:p-8 font-sans pb-20">
                     <div className="max-w-4xl mx-auto space-y-8">

                            {/* Header Profile */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-bg-card p-6 rounded-3xl border border-white/5 shadow-2xl">
                                   <div className="flex items-center gap-5">
                                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-blue to-brand-blue-secondary flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-brand-blue/30">
                                                 {client.name.charAt(0).toUpperCase()}
                                          </div>
                                          <div>
                                                 <h1 className="text-3xl font-black text-white tracking-tight">{client.name}</h1>
                                                 <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-text-grey mt-1">
                                                        <span className="flex items-center gap-1.5 text-sm"><span className="opacity-50">📱</span> {client.phone}</span>
                                                        {client.email && <span className="flex items-center gap-1.5 text-sm"><span className="opacity-50">✉️</span> {client.email}</span>}
                                                 </div>
                                          </div>
                                   </div>

                                   <div className="w-full md:w-auto bg-bg-surface p-4 rounded-2xl border border-white/5 text-center md:text-right min-w-[200px]">
                                          <p className="text-xs text-text-grey uppercase font-bold tracking-wider mb-1">Deuda Pendiente</p>
                                          <div className="text-3xl font-mono font-bold text-red-400">
                                                 $ {client.debt.toLocaleString('es-AR')}
                                          </div>
                                          {client.debt > 0 && (
                                                 <button
                                                        onClick={() => setIsPaymentModalOpen(true)}
                                                        className="mt-3 w-full py-2 bg-brand-green text-bg-dark font-bold rounded-lg hover:bg-brand-green-variant transition-colors shadow-lg shadow-brand-green/20 active:scale-95"
                                                 >
                                                        Registar Pago
                                                 </button>
                                          )}
                                   </div>
                            </div>

                            {/* Breakdown */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                                   {/* Unpaid Bookings (Debts) */}
                                   <div className="space-y-4">
                                          <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                                 🕒 Reservas Pendientes
                                                 <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">A Pagar</span>
                                          </h3>

                                          <div className="space-y-3">
                                                 {client.bookings.filter((b: any) => b.paymentStatus !== 'PAID').map((b: any) => (
                                                        <div key={b.id} className="bg-bg-card p-4 rounded-xl border border-white/5 flex justify-between items-center group hover:bg-white/5 transition-colors">
                                                               <div>
                                                                      <p className="text-white font-bold text-sm">Cancha {b.courtId}</p>
                                                                      <p className="text-xs text-text-grey mt-1 capitalize">{format(new Date(b.startTime), "EEEE d 'de' MMMM - HH:mm", {})} hs</p>
                                                               </div>
                                                               <span className="text-red-400 font-mono font-bold">$ {b.price.toLocaleString('es-AR')}</span>
                                                        </div>
                                                 ))}
                                                 {client.bookings.filter((b: any) => b.paymentStatus !== 'PAID').length === 0 && (
                                                        <div className="text-text-grey italic text-sm py-4">No hay reservas pendientes.</div>
                                                 )}
                                          </div>
                                   </div>

                                   {/* History */}
                                   <div className="space-y-4">
                                          <h3 className="text-xl font-bold text-white">📜 Historial Reciente</h3>
                                          <div className="space-y-3 opacity-80 hover:opacity-100 transition-opacity">
                                                 {client.transactions?.map((t: any) => (
                                                        <div key={t.id} className="bg-bg-card/50 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                                                               <div>
                                                                      <p className="text-white font-bold text-sm">{t.category.replace(/_/g, ' ')}</p>
                                                                      <p className="text-xs text-text-grey mt-1">{format(new Date(t.createdAt), "dd/MM/yyyy HH:mm")}</p>
                                                               </div>
                                                               <span className={cn("font-mono font-bold", t.type === 'INCOME' ? "text-brand-green" : "text-white")}>
                                                                      + $ {t.amount.toLocaleString('es-AR')}
                                                               </span>
                                                        </div>
                                                 ))}
                                                 {(!client.transactions || client.transactions.length === 0) && (
                                                        <div className="text-text-grey italic text-sm py-4">Sin movimientos recientes.</div>
                                                 )}
                                          </div>
                                   </div>

                            </div>

                     </div>

                     {/* Payment Modal */}
                     {isPaymentModalOpen && (
                            <PaymentModal
                                   debt={client.debt}
                                   clientId={client.id}
                                   onClose={() => setIsPaymentModalOpen(false)}
                            />
                     )}
              </div>
       )
}

function PaymentModal({ debt, clientId, onClose }: { debt: number, clientId: number, onClose: () => void }) {
       const [amount, setAmount] = useState(debt.toString())
       const [method, setMethod] = useState<'CASH' | 'TRANSFER'>('CASH')
       const [loading, setLoading] = useState(false)
       const router = useRouter()

       const handleSubmit = async (e: React.FormEvent) => {
              e.preventDefault()
              setLoading(true)
              try {
                     await createClientPayment(clientId, Number(amount), method, "Pago Cta Cte")
                     onClose()
                     // Router refresh handled in action revalidatePath, but safe to force refresh here often
                     router.refresh()
              } catch (error) {
                     alert("Error al procesar pago")
              } finally {
                     setLoading(false)
              }
       }

       return (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
                     <div className="bg-bg-card border border-white/10 w-full max-w-sm rounded-2xl shadow-2xl p-6">
                            <h2 className="text-xl font-bold text-white mb-4">Registrar Pago</h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                   <div className="space-y-1">
                                          <label className="text-xs text-text-grey uppercase font-bold">Monto a Pagar</label>
                                          <div className="relative">
                                                 <span className="absolute left-3 top-3 text-text-grey font-bold">$</span>
                                                 <input
                                                        type="number"
                                                        value={amount}
                                                        onChange={e => setAmount(e.target.value)}
                                                        className="w-full bg-bg-dark border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white font-mono font-bold outline-none focus:ring-2 focus:ring-brand-green"
                                                 />
                                          </div>
                                   </div>

                                   <div className="space-y-1">
                                          <label className="text-xs text-text-grey uppercase font-bold">Método de Pago</label>
                                          <div className="grid grid-cols-2 gap-2">
                                                 <button
                                                        type="button"
                                                        onClick={() => setMethod('CASH')}
                                                        className={cn("py-2 rounded-lg text-sm font-bold border transition-all", method === 'CASH' ? "bg-brand-green text-bg-dark border-transparent" : "bg-transparent text-text-grey border-white/10 hover:border-white/30")}
                                                 >
                                                        Efectivo
                                                 </button>
                                                 <button
                                                        type="button"
                                                        onClick={() => setMethod('TRANSFER')}
                                                        className={cn("py-2 rounded-lg text-sm font-bold border transition-all", method === 'TRANSFER' ? "bg-brand-blue text-white border-transparent" : "bg-transparent text-text-grey border-white/10 hover:border-white/30")}
                                                 >
                                                        Transferencia
                                                 </button>
                                          </div>
                                   </div>

                                   <div className="pt-4 flex gap-3">
                                          <button type="button" onClick={onClose} className="flex-1 py-3 text-text-grey font-bold text-sm hover:text-white transition-colors">Cancelar</button>
                                          <button
                                                 type="submit"
                                                 disabled={loading}
                                                 className="flex-1 py-3 bg-brand-green text-bg-dark font-bold rounded-xl hover:bg-brand-green-variant transition-colors disabled:opacity-50"
                                          >
                                                 {loading ? 'Procesando...' : 'Confirmar Pago'}
                                          </button>
                                   </div>
                            </form>
                     </div>
              </div>
       )
}
