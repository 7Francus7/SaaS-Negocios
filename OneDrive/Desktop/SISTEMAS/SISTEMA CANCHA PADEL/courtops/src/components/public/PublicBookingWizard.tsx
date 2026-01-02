'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { format, addDays, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { getPublicAvailability, createPublicBooking } from '@/actions/public-booking'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'

type Props = {
       club: {
              id: string
              name: string
              logoUrl?: string | null
              slug: string
       }
       initialDateStr: string
}

export default function PublicBookingWizard({ club, initialDateStr }: Props) {
       // Stable Reference Date from Server
       const today = useMemo(() => new Date(initialDateStr), [initialDateStr])

       const [step, setStep] = useState(1)
       const [selectedDate, setSelectedDate] = useState<Date>(today)
       const [slots, setSlots] = useState<any[]>([])
       const [loading, setLoading] = useState(true)

       const [selectedSlot, setSelectedSlot] = useState<{ time: string, price: number, courtId: number, courtName: string } | null>(null)

       const [clientData, setClientData] = useState({ name: '', phone: '' })
       const [isSubmitting, setIsSubmitting] = useState(false)

       // Load Availability
       useEffect(() => {
              const fetchSlots = async () => {
                     setLoading(true)
                     setSelectedSlot(null)
                     try {
                            const data = await getPublicAvailability(club.id, selectedDate)
                            setSlots(data)
                     } catch (error) {
                            console.error(error)
                     } finally {
                            setLoading(false)
                     }
              }
              const timeout = setTimeout(fetchSlots, 100)
              return () => clearTimeout(timeout)
       }, [selectedDate, club.id])

       // Days Generator (Memoized to prevent hydration mismatch or needless calcs)
       const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(today, i)), [today])

       const handleBooking = async (e: React.FormEvent) => {
              e.preventDefault()
              if (!selectedSlot) return
              setIsSubmitting(true)

              const res = await createPublicBooking({
                     clubId: club.id,
                     courtId: selectedSlot.courtId,
                     dateStr: format(selectedDate, 'yyyy-MM-dd'),
                     timeStr: selectedSlot.time,
                     clientName: clientData.name,
                     clientPhone: clientData.phone
              })

              if (res.success) {
                     setStep(3)
                     confetti({
                            particleCount: 100,
                            spread: 70,
                            origin: { y: 0.6 }
                     })
              } else {
                     alert("Error: " + res.error)
              }
              setIsSubmitting(false)
       }


       return (
              <div className="min-h-screen bg-bg-dark text-white font-sans max-w-md mx-auto relative overflow-hidden shadow-2xl min-h-[100dvh]">
                     {/* Background */}
                     <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
                     <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-green/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

                     {/* Header */}
                     <header className="p-6 flex items-center gap-3 bg-white/5 backdrop-blur-md sticky top-0 z-50 border-b border-white/5">
                            {club.logoUrl ? (
                                   <img src={club.logoUrl} className="w-10 h-10 rounded-xl object-cover" alt="Logo" />
                            ) : (
                                   <div className="w-10 h-10 bg-gradient-to-br from-brand-green to-brand-green-variant rounded-xl flex items-center justify-center font-bold text-bg-dark text-xs">
                                          {club.name.substring(0, 2).toUpperCase()}
                                   </div>
                            )}
                            <div>
                                   <h1 className="font-bold text-lg leading-tight">{club.name}</h1>
                                   <p className="text-xs text-brand-blue flex items-center gap-1">
                                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                          Reservas Online
                                   </p>
                            </div>
                     </header>

                     <div className="p-6 pb-40">
                            <AnimatePresence mode="wait">

                                   {/* STEP 1: SELECTOR */}
                                   {step === 1 && (
                                          <motion.div
                                                 key="step1"
                                                 initial={{ opacity: 0, x: 20 }}
                                                 animate={{ opacity: 1, x: 0 }}
                                                 exit={{ opacity: 0, x: -20 }}
                                                 className="space-y-8"
                                          >
                                                 {/* Date Tabs */}
                                                 <div>
                                                        <h2 className="text-xs font-bold text-text-grey uppercase tracking-wider mb-3">Elige una fecha</h2>
                                                        <div className="flex gap-3 overflow-x-auto pb-2 scroll-smooth [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                                               {days.map(d => {
                                                                      const active = isSameDay(d, selectedDate)
                                                                      return (
                                                                             <button
                                                                                    key={d.toISOString()}
                                                                                    onClick={() => setSelectedDate(d)}
                                                                                    className={cn(
                                                                                           "flex-shrink-0 flex flex-col items-center justify-center w-[72px] h-[84px] rounded-2xl border transition-all active:scale-95",
                                                                                           active
                                                                                                  ? "bg-brand-blue border-brand-blue shadow-lg shadow-brand-blue/30 scale-105"
                                                                                                  : "bg-bg-card border-white/5 opacity-60 hover:opacity-100"
                                                                                    )}
                                                                             >
                                                                                    <span className="text-[10px] uppercase font-bold tracking-widest mb-1 opacity-80">{format(d, 'EEE', { locale: es })}</span>
                                                                                    <span className="text-2xl font-black">{format(d, 'd')}</span>
                                                                             </button>
                                                                      )
                                                               })}
                                                        </div>
                                                 </div>

                                                 {/* Slots List */}
                                                 <div>
                                                        <h2 className="text-xs font-bold text-text-grey uppercase tracking-wider mb-3">Horarios Disponibles</h2>

                                                        {loading ? (
                                                               <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-50">
                                                                      <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
                                                                      <p className="text-xs">Buscando canchas...</p>
                                                               </div>
                                                        ) : slots.length === 0 ? (
                                                               <div className="bg-bg-card p-8 rounded-2xl border border-white/5 text-center">
                                                                      <p className="text-3xl mb-2">😴</p>
                                                                      <p className="font-bold text-white">No hay turnos disponibles</p>
                                                                      <p className="text-sm text-text-grey mt-1">Prueba seleccionando otro día</p>
                                                               </div>
                                                        ) : (
                                                               <div className="grid grid-cols-1 gap-3">
                                                                      {slots.map((slot, idx) => (
                                                                             <div key={idx} className="bg-bg-card rounded-xl overflow-hidden border border-white/5">
                                                                                    <div className="bg-white/5 px-4 py-2 flex justify-between items-center">
                                                                                           <span className="font-mono font-bold text-lg text-white">{slot.time}</span>
                                                                                           <span className="text-brand-green font-bold text-sm">$ {slot.price}</span>
                                                                                    </div>
                                                                                    <div className="p-2 grid grid-cols-2 gap-2">
                                                                                           {slot.courts.map((court: any) => {
                                                                                                  const isSelected = selectedSlot?.time === slot.time && selectedSlot?.courtId === court.id
                                                                                                  return (
                                                                                                         <button
                                                                                                                key={court.id}
                                                                                                                onClick={() => setSelectedSlot({ time: slot.time, price: slot.price, courtId: court.id, courtName: court.name })}
                                                                                                                className={cn(
                                                                                                                       "py-3 px-2 rounded-lg text-sm font-medium transition-all relative overflow-hidden text-center",
                                                                                                                       isSelected
                                                                                                                              ? "bg-white text-bg-dark shadow-lg font-bold"
                                                                                                                              : "bg-bg-surface hover:bg-white/10 text-white/80"
                                                                                                                )}
                                                                                                         >
                                                                                                                {court.name}
                                                                                                                {court.type && <span className="block text-[10px] opacity-60 font-normal">{court.type}</span>}
                                                                                                         </button>
                                                                                                  )
                                                                                           })}
                                                                                    </div>
                                                                             </div>
                                                                      ))}
                                                               </div>
                                                        )}
                                                 </div>
                                          </motion.div>
                                   )}

                                   {/* STEP 2: FORM */}
                                   {step === 2 && selectedSlot && (
                                          <motion.div
                                                 key="step2"
                                                 initial={{ opacity: 0, x: 20 }}
                                                 animate={{ opacity: 1, x: 0 }}
                                                 exit={{ opacity: 0, x: -20 }}
                                                 className="space-y-6"
                                          >
                                                 <div className="bg-bg-card p-5 rounded-3xl border border-white/10 shadow-xl">
                                                        <div className="flex justify-between items-start mb-4">
                                                               <div className="flex flex-col">
                                                                      <span className="text-xs text-text-grey uppercase font-bold">Resumen</span>
                                                                      <span className="text-2xl font-bold text-white capitalize">{format(selectedDate, 'EEEE d', { locale: es })}</span>
                                                               </div>
                                                               <div className="text-right">
                                                                      <span className="block text-2xl font-mono text-brand-blue font-bold">{selectedSlot.time}</span>
                                                               </div>
                                                        </div>

                                                        <div className="flex items-center justify-between bg-bg-surface rounded-xl p-3 border border-white/5">
                                                               <span className="text-sm font-medium">{selectedSlot.courtName}</span>
                                                               <span className="text-brand-green font-bold">$ {selectedSlot.price}</span>
                                                        </div>
                                                 </div>

                                                 <form onSubmit={handleBooking} className="space-y-4">
                                                        <div className="space-y-2">
                                                               <label className="text-sm font-bold text-text-grey pl-1">Tu Nombre</label>
                                                               <input
                                                                      required
                                                                      autoFocus
                                                                      className="w-full bg-bg-card border border-white/10 rounded-xl p-4 text-white text-lg focus:ring-2 focus:ring-brand-blue outline-none transition-all"
                                                                      placeholder="Ej: Juan Pérez"
                                                                      value={clientData.name}
                                                                      onChange={e => setClientData({ ...clientData, name: e.target.value })}
                                                               />
                                                        </div>
                                                        <div className="space-y-2">
                                                               <label className="text-sm font-bold text-text-grey pl-1">Tu Celular</label>
                                                               <input
                                                                      required
                                                                      type="tel"
                                                                      className="w-full bg-bg-card border border-white/10 rounded-xl p-4 text-white text-lg focus:ring-2 focus:ring-brand-blue outline-none transition-all"
                                                                      placeholder="Ej: 351..."
                                                                      value={clientData.phone}
                                                                      onChange={e => setClientData({ ...clientData, phone: e.target.value })}
                                                               />
                                                        </div>

                                                        <div className="pt-4 flex gap-3">
                                                               <button
                                                                      type="button"
                                                                      onClick={() => setStep(1)}
                                                                      className="flex-1 py-4 rounded-xl font-bold text-text-grey hover:bg-white/5 transition-colors"
                                                               >
                                                                      Volver
                                                               </button>
                                                               <button
                                                                      type="submit"
                                                                      disabled={isSubmitting}
                                                                      className="flex-[2] py-4 rounded-xl bg-brand-green text-bg-dark font-bold text-lg shadow-lg shadow-brand-green/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                                               >
                                                                      {isSubmitting ? 'Confirmando...' : 'Confirmar'}
                                                               </button>
                                                        </div>
                                                 </form>
                                          </motion.div>
                                   )}

                                   {/* STEP 3: SUCCESS */}
                                   {step === 3 && selectedSlot && (
                                          <motion.div
                                                 key="step3"
                                                 initial={{ opacity: 0, scale: 0.9 }}
                                                 animate={{ opacity: 1, scale: 1 }}
                                                 className="flex flex-col items-center justify-center text-center py-10 space-y-6"
                                          >
                                                 <div className="w-24 h-24 bg-brand-green/20 text-brand-green rounded-full flex items-center justify-center text-5xl mb-2 animate-bounce">
                                                        ✅
                                                 </div>
                                                 <div>
                                                        <h2 className="text-3xl font-black text-white mb-2">¡Reserva Lista!</h2>
                                                        <p className="text-text-grey max-w-[250px] mx-auto">Te esperamos en el club. Recuerda abonar tu seña.</p>
                                                 </div>

                                                 <div className="bg-bg-card w-full p-6 rounded-3xl border border-white/10">
                                                        <p className="text-sm font-bold text-white mb-1">{club.name}</p>
                                                        <p className="text-2xl font-bold text-brand-blue mb-1">{format(selectedDate, 'EEEE d', { locale: es })} - {selectedSlot.time}hs</p>
                                                        <p className="text-sm text-text-grey">{selectedSlot.courtName}</p>
                                                 </div>

                                                 <a
                                                        href={`https://wa.me/54935124421497?text=${encodeURIComponent(`Hola! Reservé en ${club.name} para el ${format(selectedDate, 'd/M')} a las ${selectedSlot.time}hs (${selectedSlot.courtName}).`)}`}
                                                        target="_blank"
                                                        className="w-full py-4 bg-[#25D366] text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 hover:bg-[#20ba59] transition-colors"
                                                 >
                                                        <span>Enviar WhatsApp</span>
                                                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.592 2.654-.696c1.001.54 1.973.83 3.036.83h.001c3.044 0 5.631-2.586 5.632-5.767.001-3.18-2.587-5.631-5.762-5.766zm1.742 8.261c-1.353 1.34-1.956 1.481-2.593.844-.657-.657-.333-1.425-1.554-2.645-.246-.247-.44-.439-.427-.678.016-.279.351-.433.25-.794-.093-.332-.704-1.637-.704-1.637-.091-.22-.321-.194-.523-.194-.251 0-.585.048-.797.283-.162.179-.646.611-.646 1.492 0 .882.59 1.83 1.545 2.784 1.55 1.55 3.328 2.522 5.094 2.146.401-.086.729-.687.94-1.118l.001-.001c.148-.299.117-.5.013-.674-.105-.175-.625-.434-.625-.434z" /></svg>
                                                 </a>

                                                 <button
                                                        onClick={() => { setStep(1); setSelectedSlot(null); }}
                                                        className="text-sm text-text-grey font-medium hover:text-white"
                                                 >
                                                        Hacer otra reserva
                                                 </button>
                                          </motion.div>
                                   )}

                            </AnimatePresence>
                     </div>

                     {/* Floating CTA for Step 1 */}
                     {step === 1 && (
                            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-bg-dark via-bg-dark/90 to-transparent pointer-events-none z-40 max-w-md mx-auto">
                                   <button
                                          onClick={() => setStep(2)}
                                          disabled={!selectedSlot}
                                          className="w-full py-4 rounded-2xl bg-brand-blue text-white font-bold text-lg shadow-xl shadow-brand-blue/30 disabled:translate-y-20 disabled:opacity-0 transition-all duration-300 pointer-events-auto"
                                   >
                                          Continuar ({selectedSlot?.time})
                                   </button>
                            </div>
                     )}
              </div>
       )
}
