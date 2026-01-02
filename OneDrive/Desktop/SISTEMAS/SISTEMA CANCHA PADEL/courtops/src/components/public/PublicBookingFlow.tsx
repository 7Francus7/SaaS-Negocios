'use client'

import React, { useState } from 'react'
import { format, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { createPublicBooking } from '@/actions/public-booking'

type Props = {
       club: any
       availableSlots: any[]
       date: Date
}

export default function PublicBookingFlow({ club, availableSlots, date }: Props) {
       const [selectedSlot, setSelectedSlot] = useState<any>(null)
       const [step, setStep] = useState<'SLOTS' | 'FORM' | 'SUCCESS'>('SLOTS')
       const [formData, setFormData] = useState({ name: '', phone: '' })
       const [isSubmitting, setIsSubmitting] = useState(false)

       async function handleBooking() {
              if (!selectedSlot) return
              setIsSubmitting(true)
              try {
                     const result: any = await createPublicBooking({
                            clubId: club.id,
                            courtId: selectedSlot.courtId, // Logic: Pick first available court in the slot
                            dateStr: format(date, 'yyyy-MM-dd'),
                            timeStr: selectedSlot.time,
                            clientName: formData.name,
                            clientPhone: formData.phone
                     })

                     if (result.success) {
                            setStep('SUCCESS')
                     } else {
                            alert('Error: ' + result.error)
                     }
              } catch (e) {
                     console.error(e)
                     alert('Error de conexión o servidor.')
              } finally {
                     setIsSubmitting(false)
              }
       }

       if (step === 'SUCCESS') {
              return (
                     <div className="text-center py-12 space-y-4 animate-in fade-in zoom-in">
                            <div className="w-20 h-20 bg-brand-green rounded-full flex items-center justify-center mx-auto mb-4">
                                   <span className="text-4xl">✓</span>
                            </div>
                            <h2 className="text-2xl font-bold text-white">¡Reserva Confirmada!</h2>
                            <p className="text-text-grey">Te esperamos el {format(date, "EEEE d 'de' MMMM", { locale: es })} a las {selectedSlot.time}hs.</p>
                            <button onClick={() => window.location.reload()} className="text-brand-blue font-bold mt-4 hover:underline">
                                   Realizar otra reserva
                            </button>
                     </div>
              )
       }

       return (
              <div className="space-y-6">

                     {/* Date Selector (Simple Next Day) */}
                     <div className="flex items-center justify-between bg-bg-card p-4 rounded-xl border border-white/5">
                            <span className="text-text-grey font-bold capitalize">
                                   {format(date, "EEEE d 'de' MMMM", { locale: es })}
                            </span>
                            {/* Need URL params logic for changing date in real full app, simplifying for MVP */}
                     </div>

                     {step === 'SLOTS' && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                   {availableSlots.length === 0 ? (
                                          <div className="col-span-full text-center py-8 text-text-grey">
                                                 No hay turnos disponibles para esta fecha.
                                          </div>
                                   ) : (
                                          availableSlots.map((slot: any) => (
                                                 <button
                                                        key={slot.time}
                                                        onClick={() => {
                                                               setSelectedSlot({ ...slot, courtId: slot.courtsAvailable[0] }) // Pick first court
                                                               setStep('FORM')
                                                        }}
                                                        className="flex flex-col items-center justify-center p-4 rounded-xl bg-bg-card border border-white/5 hover:border-brand-blue transition-all group active:scale-95"
                                                 >
                                                        <span className="text-xl font-bold text-white group-hover:text-brand-blue">{slot.time}</span>
                                                        <span className="text-xs text-brand-green font-bold">${slot.price.toLocaleString('es-AR')}</span>
                                                        <span className="text-[10px] text-text-grey mt-1">{slot.courtsAvailable.length} canchas</span>
                                                 </button>
                                          ))
                                   )}
                            </div>
                     )}

                     {step === 'FORM' && (
                            <div className="bg-bg-card p-6 rounded-2xl border border-white/5 space-y-6 animate-in slide-in-from-right-10">
                                   <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                          <div>
                                                 <p className="text-xs text-text-grey uppercase font-bold">Resumen</p>
                                                 <h3 className="text-lg font-bold text-white">{selectedSlot.time}hs - ${selectedSlot.price}</h3>
                                          </div>
                                          <button onClick={() => setStep('SLOTS')} className="text-text-grey hover:text-white text-sm">Cambiar</button>
                                   </div>

                                   <div className="space-y-4">
                                          <div>
                                                 <label className="text-xs font-bold text-text-grey uppercase">Nombre Completo</label>
                                                 <input
                                                        className="w-full bg-bg-dark border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-brand-blue outline-none"
                                                        value={formData.name}
                                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                        placeholder="Ej: Juan Pérez"
                                                 />
                                          </div>
                                          <div>
                                                 <label className="text-xs font-bold text-text-grey uppercase">Teléfono (WhatsApp)</label>
                                                 <input
                                                        className="w-full bg-bg-dark border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-brand-blue outline-none"
                                                        value={formData.phone}
                                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                        placeholder="Ej: 11 1234 5678"
                                                 />
                                          </div>
                                   </div>

                                   <div className="pt-2">
                                          <button
                                                 onClick={handleBooking}
                                                 disabled={!formData.name || !formData.phone || isSubmitting}
                                                 className="w-full bg-brand-blue text-white font-bold py-4 rounded-xl hover:bg-brand-blue-secondary transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-blue/20"
                                          >
                                                 {isSubmitting ? 'Confirmando...' : 'Confirmar Reserva'}
                                          </button>
                                          <p className="text-[10px] text-center text-text-grey mt-3">
                                                 Al confirmar, aceptas nuestras políticas de cancelación (6hs antes).
                                          </p>
                                   </div>
                            </div>
                     )}
              </div>
       )
}
