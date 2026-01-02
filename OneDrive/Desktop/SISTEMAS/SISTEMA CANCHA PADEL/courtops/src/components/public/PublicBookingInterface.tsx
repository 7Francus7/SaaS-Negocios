'use client'

import { useState, useEffect } from 'react'
import { format, addDays, startOfToday, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { createPublicBooking, getPublicAvailability } from '@/actions/public-booking'

type Props = {
       club: any
}

export default function PublicBookingInterface({ club }: Props) {
       const [selectedDate, setSelectedDate] = useState(startOfToday())
       const [availability, setAvailability] = useState<any[]>([])
       const [loading, setLoading] = useState(true)

       // Booking interaction state
       const [selectedSlot, setSelectedSlot] = useState<any>(null)
       const [formData, setFormData] = useState({ name: '', phone: '', receiptFile: '' })
       const [isSubmitting, setIsSubmitting] = useState(false)
       const [bookingSuccess, setBookingSuccess] = useState(false)
       const [validation, setValidation] = useState({ selectedCourtId: 0 })

       // Date navigation
       const dates = Array.from({ length: 7 }).map((_, i) => addDays(startOfToday(), i))

       // Fetch availability when date changes
       useEffect(() => {
              async function fetchSlots() {
                     setLoading(true)
                     try {
                            const slots = await getPublicAvailability(club.id, selectedDate)
                            setAvailability(slots)
                     } catch (error) {
                            console.error(error)
                     } finally {
                            setLoading(false)
                     }
              }
              fetchSlots()
       }, [selectedDate, club.id])

       async function handleBooking(e: React.FormEvent) {
              e.preventDefault()
              if (!selectedSlot) return

              // Validate court selection
              let courtId = validation.selectedCourtId
              if (courtId === 0) {
                     // Auto select first if not selected
                     courtId = selectedSlot.courts[0].id
              }

              setIsSubmitting(true)
              try {
                     const res = await createPublicBooking({
                            clubId: club.id,
                            courtId: courtId,
                            dateStr: format(selectedDate, 'yyyy-MM-dd'),
                            timeStr: selectedSlot.time,
                            clientName: formData.name,
                            clientPhone: formData.phone
                     })

                     if (res.success) {
                            setBookingSuccess(true)
                     } else {
                            alert('Error: ' + res.error)
                     }
              } catch (err) {
                     alert('Error inesperado')
              } finally {
                     setIsSubmitting(false)
              }
       }

       return (
              <div className="max-w-md mx-auto min-h-screen bg-bg-dark shadow-2xl overflow-hidden flex flex-col">

                     {/* --- HEADER --- */}
                     <header className="p-4 bg-bg-surface/50 backdrop-blur-md sticky top-0 z-10 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                   {club.logoUrl ? (
                                          <img src={club.logoUrl} alt={club.name} className="w-10 h-10 rounded-lg object-cover" />
                                   ) : (
                                          <div className="w-10 h-10 bg-gradient-to-br from-brand-green to-brand-green-variant rounded-lg flex items-center justify-center text-xl shadow-lg shadow-brand-green/20">
                                                 🎾
                                          </div>
                                   )}
                                   <div>
                                          <h1 className="font-bold text-white leading-tight">{club.name}</h1>
                                          <p className="text-xs text-brand-green font-medium uppercase tracking-wider">Reserva tu cancha</p>
                                   </div>
                            </div>
                     </header>

                     {/* --- DATE SELECTOR --- */}
                     <div className="py-4 border-b border-white/5 overflow-x-auto no-scrollbar scroll-smooth">
                            <div className="flex gap-2 px-4">
                                   {dates.map((date) => {
                                          const isSelected = isSameDay(date, selectedDate)
                                          return (
                                                 <button
                                                        key={date.toISOString()}
                                                        onClick={() => setSelectedDate(date)}
                                                        className={`flex flex-col items-center justify-center min-w-[4rem] h-16 rounded-2xl transition-all border ${isSelected
                                                               ? 'bg-brand-blue border-brand-blue text-white shadow-lg shadow-brand-blue/20 scale-105'
                                                               : 'bg-bg-surface border-white/5 text-text-grey hover:bg-white/5'
                                                               }`}
                                                 >
                                                        <span className="text-xs uppercase font-bold">{format(date, 'EEE', { locale: es })}</span>
                                                        <span className={`text-xl font-bold ${isSelected ? 'text-white' : 'text-white/80'}`}>{format(date, 'd')}</span>
                                                 </button>
                                          )
                                   })}
                            </div>
                     </div>

                     {/* --- SLOTS --- */}
                     <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {loading ? (
                                   <div className="space-y-3">
                                          {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-bg-surface/50 rounded-2xl animate-pulse"></div>)}
                                   </div>
                            ) : availability.length === 0 ? (
                                   <div className="text-center py-10 text-text-grey opacity-60">
                                          <p className="text-4xl mb-2">😴</p>
                                          <p>No hay turnos disponibles para esta fecha.</p>
                                   </div>
                            ) : (
                                   availability.map((slot: any) => (
                                          <div key={slot.time} className="bg-bg-card border border-white/5 p-4 rounded-2xl flex items-center justify-between group hover:border-brand-green/30 transition-colors">
                                                 <div className="flex gap-4 items-center">
                                                        <div className="text-lg font-bold text-white font-mono bg-bg-surface px-3 py-1 rounded-lg border border-white/5">
                                                               {slot.time}
                                                        </div>
                                                        <div>
                                                               <p className="text-xs text-text-grey uppercase font-bold mb-0.5">
                                                                      {slot.courts.length > 1 ? `${slot.courts.length} Canchas` : '1 Cancha'}
                                                               </p>
                                                               <div className="flex gap-1">
                                                                      {slot.courts.map((c: any) => (
                                                                             <span key={c.id} title={c.name} className="w-2 h-2 rounded-full bg-brand-green shadow-[0_0_5px_rgba(0,255,100,0.5)]"></span>
                                                                      ))}
                                                               </div>
                                                        </div>
                                                 </div>

                                                 <div className="text-right">
                                                        <div className="text-brand-green font-bold text-lg mb-1">${slot.price}</div>
                                                        <button
                                                               onClick={() => {
                                                                      setSelectedSlot(slot)
                                                                      setValidation({ selectedCourtId: slot.courts[0].id })
                                                               }}
                                                               className="bg-white text-bg-dark px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-zinc-200 transition-colors"
                                                        >
                                                               Reservar
                                                        </button>
                                                 </div>
                                          </div>
                                   ))
                            )}
                     </div>

                     {/* --- FOOTER BRANDS --- */}
                     <div className="p-4 text-center text-[10px] text-white/20 uppercase tracking-widest font-bold">
                            Powered by CourtOps
                     </div>

                     {/* --- BOOKING MODAL --- */}
                     {selectedSlot && (
                            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                                   <div className="bg-bg-card w-full max-w-sm sm:rounded-3xl rounded-t-3xl border-t sm:border border-white/10 p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-200">

                                          {!bookingSuccess ? (
                                                 <>
                                                        <div className="flex justify-between items-center mb-6">
                                                               <div>
                                                                      <h3 className="text-xl font-bold text-white">Confirmar Reserva</h3>
                                                                      <p className="text-brand-green font-mono">{format(selectedDate, 'dd/MM')} - {selectedSlot.time} hs</p>
                                                               </div>
                                                               <button onClick={() => setSelectedSlot(null)} className="text-text-grey p-2">✕</button>
                                                        </div>

                                                        <form onSubmit={handleBooking} className="space-y-4">
                                                               {/* Court Selection if multiple */}
                                                               {selectedSlot.courts.length > 1 && (
                                                                      <div className="space-y-2">
                                                                             <label className="text-xs uppercase font-bold text-text-grey">Elige Cancha</label>
                                                                             <div className="grid grid-cols-2 gap-2">
                                                                                    {selectedSlot.courts.map((c: any) => (
                                                                                           <button
                                                                                                  key={c.id}
                                                                                                  type="button"
                                                                                                  onClick={() => setValidation({ ...validation, selectedCourtId: c.id })}
                                                                                                  className={`p-2 rounded-xl text-sm font-bold border transition-colors ${validation.selectedCourtId === c.id ? 'bg-brand-blue border-brand-blue text-white' : 'bg-bg-surface border-white/10 text-text-grey'}`}
                                                                                           >
                                                                                                  {c.name}
                                                                                           </button>
                                                                                    ))}
                                                                             </div>
                                                                      </div>
                                                               )}

                                                               <div className="space-y-1">
                                                                      <label className="text-xs uppercase font-bold text-text-grey">Tu Nombre</label>
                                                                      <input
                                                                             required
                                                                             className="w-full bg-bg-surface border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-green transition-colors"
                                                                             placeholder="Ej: Juan Pérez"
                                                                             value={formData.name}
                                                                             onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                                      />
                                                               </div>

                                                               <div className="space-y-1">
                                                                      <label className="text-xs uppercase font-bold text-text-grey">Teléfono (WhatsApp)</label>
                                                                      <input
                                                                             required
                                                                             type="tel"
                                                                             className="w-full bg-bg-surface border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-green transition-colors"
                                                                             placeholder="Ej: 351 123 4567"
                                                                             value={formData.phone}
                                                                             onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                                      />
                                                               </div>

                                                               {/* --- TRANSFER DETAILS --- */}
                                                               <div className="bg-bg-surface border border-white/10 p-4 rounded-xl space-y-3">
                                                                      <div className="flex items-center gap-2 mb-2">
                                                                             <div className="bg-brand-blue/20 p-1.5 rounded-lg text-brand-blue">
                                                                                    🏦
                                                                             </div>
                                                                             <span className="text-sm font-bold text-white">Datos de Transferencia</span>
                                                                      </div>

                                                                      <div className="space-y-2 text-xs">
                                                                             <div className="flex justify-between border-b border-white/5 pb-1">
                                                                                    <span className="text-text-grey">Alias:</span>
                                                                                    <span className="text-white font-mono select-all">ALFA.PADEL.MP</span>
                                                                             </div>
                                                                             <div className="flex justify-between border-b border-white/5 pb-1">
                                                                                    <span className="text-text-grey">CBU:</span>
                                                                                    <span className="text-white font-mono select-all">0000003100000000000000</span>
                                                                             </div>
                                                                             <div className="flex justify-between">
                                                                                    <span className="text-text-grey">Titular:</span>
                                                                                    <span className="text-white">Alfa Padel SA</span>
                                                                             </div>
                                                                      </div>
                                                               </div>

                                                               {/* --- UPLOAD RECEIPT --- */}
                                                               <div className="space-y-2">
                                                                      <label className="text-xs uppercase font-bold text-text-grey flex justify-between">
                                                                             Comprobante de Pago
                                                                             <span className="text-brand-green text-[10px]">Requerido</span>
                                                                      </label>
                                                                      <div className="relative">
                                                                             <input
                                                                                    required
                                                                                    type="file"
                                                                                    accept="image/*,.pdf"
                                                                                    onChange={e => {
                                                                                           const file = e.target.files?.[0]
                                                                                           if (file) {
                                                                                                  // Convert to base64 for simplicity in this demo
                                                                                                  const reader = new FileReader()
                                                                                                  reader.onloadend = () => {
                                                                                                         setFormData({ ...formData, receiptFile: reader.result as string })
                                                                                                  }
                                                                                                  reader.readAsDataURL(file)
                                                                                           }
                                                                                    }}
                                                                                    className="w-full text-xs text-text-grey file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-brand-blue file:text-white hover:file:bg-brand-blue-secondary cursor-pointer"
                                                                             />
                                                                      </div>
                                                               </div>

                                                               <div className="pt-2">
                                                                      <div className="bg-brand-blue/10 border border-brand-blue/20 rounded-lg p-3 mb-4">
                                                                             <div className="flex justify-between items-center mb-1">
                                                                                    <span className="text-xs text-brand-blue uppercase font-bold">Valor Total:</span>
                                                                                    <span className="text-white font-mono">${selectedSlot.price}</span>
                                                                             </div>
                                                                             <div className="flex justify-between items-center text-lg font-bold">
                                                                                    <span className="text-brand-green">Seña a transferir:</span>
                                                                                    <span className="text-brand-green">$6500</span>
                                                                             </div>
                                                                      </div>

                                                                      <button
                                                                             type="submit"
                                                                             disabled={isSubmitting || !formData.receiptFile}
                                                                             className="w-full bg-brand-green text-bg-dark font-bold text-lg py-4 rounded-xl hover:bg-brand-green-variant transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                                      >
                                                                             {isSubmitting ? 'Subiendo...' : 'Enviar Comprobante y Reservar'}
                                                                      </button>
                                                                      <p className="text-center text-[10px] text-text-grey mt-3">
                                                                             Revisaremos tu comprobante para confirmar el turno.
                                                                      </p>
                                                               </div>
                                                        </form>
                                                 </>
                                          ) : (
                                                 <div className="text-center py-8">
                                                        <div className="w-20 h-20 bg-brand-green rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-[0_0_20px_rgba(0,255,100,0.3)] animate-in zoom-in spin-in-180 duration-500">
                                                               ✓
                                                        </div>
                                                        <h3 className="text-2xl font-bold text-white mb-2">¡Reserva Exitosa!</h3>
                                                        <p className="text-text-grey mb-8">Te esperamos el {format(selectedDate, 'dd/MM')} a las {selectedSlot.time} hs.</p>
                                                        <button
                                                               onClick={() => {
                                                                      setSelectedSlot(null)
                                                                      setBookingSuccess(false)
                                                                      setFormData({ name: '', phone: '', receiptFile: '' })
                                                                      setAvailability([]) // Clears old data before refetch
                                                                      window.location.reload()
                                                               }}
                                                               className="w-full bg-white text-bg-dark font-bold py-3 rounded-xl"
                                                        >
                                                               Cerrar y Ver más turnos
                                                        </button>
                                                 </div>
                                          )}
                                   </div>
                            </div>
                     )}

              </div>
       )
}
