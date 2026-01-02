'use client'

import React, { useState, useEffect } from 'react'
import { format, addDays, isSameDay, addMinutes } from 'date-fns'
import { es } from 'date-fns/locale'
import { getBookingsForDate, getCourts, type BookingWithClient } from '@/actions/turnero'
import { createBooking } from '@/actions/createBooking'
import { cn } from '@/lib/utils'

// Minimalist Mobile First Design
export default function PublicBookingPage() {
       const [step, setStep] = useState(1) // 1: Date/Time, 2: Info/Confirm, 3: Success
       const [selectedDate, setSelectedDate] = useState<Date>(new Date())
       const [selectedSlot, setSelectedSlot] = useState<{ time: string, courtId: number } | null>(null)

       const [bookings, setBookings] = useState<BookingWithClient[]>([])
       const [courts, setCourts] = useState<{ id: number, name: string }[]>([])
       const [loading, setLoading] = useState(true)

       const [clientData, setClientData] = useState({ name: '', phone: '' })
       const [isSubmitting, setIsSubmitting] = useState(false)

       // Generate Days (Today + 6 days)
       const days = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i))

       // Fetch Data
       const loadData = async () => {
              setLoading(true)
              try {
                     const [b, c] = await Promise.all([
                            getBookingsForDate(selectedDate),
                            getCourts()
                     ])
                     setBookings(b)
                     setCourts(c)
              } catch (e) { console.error(e) }
              finally { setLoading(false) }
       }

       useEffect(() => {
              loadData()
       }, [selectedDate])

       // Helper: Check availability
       const isSlotTaken = (time: string, courtId: number) => {
              return bookings.some(b => {
                     const bTime = format(new Date(b.startTime), 'HH:mm')
                     return b.courtId === courtId && bTime === time && b.status !== 'CANCELED'
              })
       }

       // Generate Slots (Robust Date Logic)
       const generateSlots = () => {
              const slots = []
              let current = new Date()
              current.setHours(14, 0, 0, 0) // Start 14:00

              // End at 23:00
              const end = new Date()
              end.setHours(23, 0, 0, 0)

              while (current <= end) {
                     slots.push(format(current, 'HH:mm'))
                     current = addMinutes(current, 90)
              }
              return slots
       }
       const timeSlots = generateSlots()

       const handleConfirm = async (e: React.FormEvent) => {
              e.preventDefault()
              if (!selectedSlot) return
              setIsSubmitting(true)

              const [hours, minutes] = selectedSlot.time.split(':').map(Number)
              const startDate = new Date(selectedDate)
              startDate.setHours(hours, minutes, 0, 0)

              const res = await createBooking({
                     clientName: clientData.name,
                     clientPhone: clientData.phone,
                     courtId: selectedSlot.courtId,
                     startTime: startDate,
                     paymentStatus: 'UNPAID',
                     status: 'PENDING'
              })

              if (res.success) {
                     await loadData() // Refresh availability immediately
                     setStep(3)
              } else {
                     alert("Error: " + res.error)
              }
              setIsSubmitting(false)
       }

       return (
              <div className="min-h-screen bg-bg-dark text-white font-sans max-w-md mx-auto relative overflow-hidden">
                     {/* Background Elements */}
                     <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/10 rounded-full blur-3xl -z-10"></div>
                     <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-green/10 rounded-full blur-3xl -z-10"></div>

                     {/* Header */}
                     <header className="p-6 flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-brand-green to-brand-green-variant rounded-lg"></div>
                            <h1 className="font-bold text-lg tracking-tight">CourtOps <span className="text-brand-blue font-light">Reservas</span></h1>
                     </header>

                     {step === 1 && (
                            <div className="p-6 space-y-8 animate-in slide-in-from-right duration-300">
                                   {/* Date Selector */}
                                   <div>
                                          <h2 className="text-sm font-bold text-text-grey uppercase tracking-wider mb-4">Elige una fecha</h2>
                                          <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                                                 {days.map(d => (
                                                        <button
                                                               key={d.toISOString()}
                                                               onClick={() => { setSelectedDate(d); setSelectedSlot(null) }}
                                                               className={cn(
                                                                      "flex flex-col items-center justify-center min-w-[70px] h-[80px] rounded-2xl border transition-all",
                                                                      isSameDay(d, selectedDate)
                                                                             ? "bg-brand-blue border-brand-blue shadow-lg shadow-brand-blue/30 scale-105"
                                                                             : "bg-bg-card border-white/5 opacity-70 hover:opacity-100"
                                                               )}
                                                        >
                                                               <span className="text-xs uppercase font-bold">{format(d, 'EEE', { locale: es })}</span>
                                                               <span className="text-xl font-bold">{format(d, 'd')}</span>
                                                        </button>
                                                 ))}
                                          </div>
                                   </div>

                                   {/* Slots Grid */}
                                   <div>
                                          <h2 className="text-sm font-bold text-text-grey uppercase tracking-wider mb-4">Horarios Disponibles</h2>
                                          {loading ? (
                                                 <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div></div>
                                          ) : (
                                                 <div className="space-y-6">
                                                        {courts.map(court => (
                                                               <div key={court.id}>
                                                                      <h3 className="text-brand-green font-bold text-sm mb-3 pl-1">{court.name}</h3>
                                                                      <div className="grid grid-cols-3 gap-3">
                                                                             {timeSlots.map(time => {
                                                                                    const taken = isSlotTaken(time, court.id)
                                                                                    const isSelected = selectedSlot?.time === time && selectedSlot?.courtId === court.id

                                                                                    // Optional: Disable past times for Today

                                                                                    return (
                                                                                           <button
                                                                                                  key={time}
                                                                                                  disabled={taken}
                                                                                                  onClick={() => setSelectedSlot({ time, courtId: court.id })}
                                                                                                  className={cn(
                                                                                                         "py-3 rounded-xl text-sm font-bold border transition-all relative overflow-hidden",
                                                                                                         taken
                                                                                                                ? "bg-bg-surface border-white/5 text-white/20 line-through cursor-not-allowed"
                                                                                                                : isSelected
                                                                                                                       ? "bg-white text-bg-dark border-white shadow-xl scale-105 z-10"
                                                                                                                       : "bg-bg-card border-white/10 text-white hover:border-brand-blue/50"
                                                                                                  )}
                                                                                           >
                                                                                                  {time}
                                                                                           </button>
                                                                                    )
                                                                             })}
                                                                      </div>
                                                               </div>
                                                        ))}
                                                 </div>
                                          )}
                                   </div>

                                   {/* Bottom Action */}
                                   <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-bg-dark to-transparent pointer-events-none sticky-bottom-wrapper">
                                          <button
                                                 onClick={() => setStep(2)}
                                                 disabled={!selectedSlot}
                                                 className="w-full py-4 rounded-2xl bg-brand-green text-bg-dark font-bold text-lg shadow-xl shadow-brand-green/20 disabled:opacity-0 disabled:translate-y-10 transition-all pointer-events-auto"
                                          >
                                                 Continuar
                                          </button>
                                   </div>
                            </div>
                     )}

                     {step === 2 && (
                            <form onSubmit={handleConfirm} className="p-6 space-y-6 animate-in slide-in-from-right duration-300">
                                   <button type="button" onClick={() => setStep(1)} className="text-text-grey text-sm mb-4">← Volver</button>

                                   <div className="bg-bg-card p-6 rounded-3xl border border-white/5">
                                          <h2 className="text-xl font-bold mb-1">Confirmar Reserva</h2>
                                          <p className="text-text-grey text-sm">Verifica los datos de tu turno</p>

                                          <div className="mt-6 flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                                                 <div className="flex gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-brand-blue/20 flex items-center justify-center text-brand-blue text-lg">📅</div>
                                                        <div>
                                                               <p className="text-xs text-text-grey uppercase font-bold">Fecha</p>
                                                               <p className="font-medium capitalize">{format(selectedDate, 'EEEE d MMMM', { locale: es })}</p>
                                                        </div>
                                                 </div>
                                          </div>
                                          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                                                 <div className="flex gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-brand-green/20 flex items-center justify-center text-brand-green text-lg">⏰</div>
                                                        <div>
                                                               <p className="text-xs text-text-grey uppercase font-bold">Hora</p>
                                                               <p className="font-medium text-xl">{selectedSlot?.time} hs</p>
                                                        </div>
                                                 </div>
                                          </div>
                                          <div>
                                                 <div className="flex gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-lg">🎾</div>
                                                        <div>
                                                               <p className="text-xs text-text-grey uppercase font-bold">Cancha</p>
                                                               <p className="font-medium capitalize">{courts.find(c => c.id === selectedSlot?.courtId)?.name}</p>
                                                        </div>
                                                 </div>
                                          </div>
                                   </div>

                                   <div className="space-y-4">
                                          <h3 className="text-sm font-bold text-text-grey uppercase tracking-wider">Tus Datos</h3>
                                          <input
                                                 required
                                                 type="text"
                                                 placeholder="Nombre Completo"
                                                 className="w-full bg-bg-card border border-white/10 rounded-xl p-4 text-white placeholder:text-text-grey/50 focus:ring-2 focus:ring-brand-blue outline-none"
                                                 value={clientData.name}
                                                 onChange={e => setClientData({ ...clientData, name: e.target.value })}
                                          />
                                          <input
                                                 required
                                                 type="tel"
                                                 placeholder="Celular (Ej: 351...)"
                                                 className="w-full bg-bg-card border border-white/10 rounded-xl p-4 text-white placeholder:text-text-grey/50 focus:ring-2 focus:ring-brand-blue outline-none"
                                                 value={clientData.phone}
                                                 onChange={e => setClientData({ ...clientData, phone: e.target.value })}
                                          />
                                   </div>

                                   <button
                                          type="submit"
                                          disabled={isSubmitting}
                                          className="w-full py-4 rounded-2xl bg-white text-bg-dark font-bold text-lg shadow-xl disabled:opacity-50 transition-all mt-8"
                                   >
                                          {isSubmitting ? 'Reservando...' : 'Confirmar Reserva'}
                                   </button>
                            </form>
                     )}

                     {step === 3 && (
                            <div className="flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-300 min-h-[80vh]">
                                   <div className="w-20 h-20 bg-orange-500/20 text-orange-500 rounded-full flex items-center justify-center text-4xl mb-6 shadow-2xl shadow-orange-500/10">
                                          ⏳
                                   </div>
                                   <h2 className="text-2xl font-bold mb-2">¡Casi listo!</h2>
                                   <p className="text-text-grey mb-6 text-sm">Tu reserva está pendiente de pago. <br />Transfiere la seña para confirmar.</p>

                                   <div className="bg-bg-card p-6 rounded-3xl border border-white/10 w-full mb-6 relative overflow-hidden">
                                          <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                                          <p className="text-xs text-text-grey uppercase font-bold mb-2">Datos de Transferencia</p>
                                          <p className="text-lg font-mono font-bold text-white tracking-wider mb-1">COURTOPS</p>
                                          <p className="text-sm text-text-grey">Alias COURTOPS</p>
                                   </div>

                                   <div className="bg-bg-surface p-4 rounded-2xl w-full mb-8 border border-white/5">
                                          <p className="text-sm font-bold mb-1">{format(selectedDate, 'EEEE d', { locale: es })} - {selectedSlot?.time}hs</p>
                                          <p className="text-xs text-brand-blue">{courts.find(c => c.id === selectedSlot?.courtId)?.name}</p>
                                   </div>

                                   <a
                                          href={`https://wa.me/54935124421497?text=${encodeURIComponent(`Hola! Reservé para el ${format(selectedDate, 'd/M')} a las ${selectedSlot?.time}hs (Cancha ${courts.find(c => c.id === selectedSlot?.courtId)?.name}). Envío comprobante.`)}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="w-full py-4 rounded-2xl bg-[#25D366] text-bg-dark font-bold text-lg shadow-xl hover:bg-[#20bd5a] transition-colors flex items-center justify-center gap-2 mb-4"
                                   >
                                          <span>Enviar Comprobante</span>
                                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.592 2.654-.696c1.001.54 1.973.83 3.036.83h.001c3.044 0 5.631-2.586 5.632-5.767.001-3.18-2.587-5.631-5.762-5.766zm1.742 8.261c-1.353 1.34-1.956 1.481-2.593.844-.657-.657-.333-1.425-1.554-2.645-.246-.247-.44-.439-.427-.678.016-.279.351-.433.25-.794-.093-.332-.704-1.637-.704-1.637-.091-.22-.321-.194-.523-.194-.251 0-.585.048-.797.283-.162.179-.646.611-.646 1.492 0 .882.59 1.83 1.545 2.784 1.55 1.55 3.328 2.522 5.094 2.146.401-.086.729-.687.94-1.118l.001-.001c.148-.299.117-.5.013-.674-.105-.175-.625-.434-.625-.434z" /></svg>
                                   </a>

                                   <button
                                          onClick={() => { setStep(1); setSelectedSlot(null); }}
                                          className="text-text-grey text-sm hover:text-white transition-colors"
                                   >
                                          Volver al inicio
                                   </button>
                            </div>
                     )}
              </div>
       )
}
