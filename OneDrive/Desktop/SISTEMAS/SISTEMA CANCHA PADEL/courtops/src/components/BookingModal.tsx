'use client'

import React, { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { createBooking } from '@/actions/createBooking'

type Props = {
       isOpen: boolean
       onClose: () => void
       onSuccess: () => void
       initialDate: Date
       initialTime?: string
       initialCourtId?: number
       courts: { id: number, name: string }[]
}

export default function BookingModal({ isOpen, onClose, onSuccess, initialDate, initialTime, initialCourtId, courts }: Props) {
       const [formData, setFormData] = useState({
              name: '',
              phone: '',
              email: '', // Add email
              time: initialTime || '14:00',
              courtId: initialCourtId || (courts[0]?.id || 1),
              paymentStatus: 'UNPAID' as 'UNPAID' | 'PAID'
       })
       const [isSubmitting, setIsSubmitting] = useState(false)
       const [error, setError] = useState('')

       if (!isOpen) return null

       // Generate simple time options
       const timeOptions = []
       for (let h = 14; h < 23; h++) {
              timeOptions.push(`${h}:00`)
              timeOptions.push(`${h}:30`)
       }
       timeOptions.push('23:00')

       const handleSubmit = async (e: React.FormEvent) => {
              e.preventDefault()
              setIsSubmitting(true)
              setError('')

              try {
                     // Construct Date Object
                     const [hours, minutes] = formData.time.split(':').map(Number)
                     const startDate = new Date(initialDate)
                     startDate.setHours(hours, minutes, 0, 0)

                     const res = await createBooking({
                            clientName: formData.name,
                            clientPhone: formData.phone,
                            courtId: Number(formData.courtId),
                            startTime: startDate,
                            paymentStatus: formData.paymentStatus
                     })

                     if (res.success) {
                            onSuccess()
                            // onClose is called by parent wrapper usually, or we can ensure it here
                            // In this code, component calls it.
                            onClose()
                     } else {
                            setError(res.error as string)
                     }
              } catch (e) {
                     setError('Error al crear reserva.')
              } finally {
                     setIsSubmitting(false)
              }
       }

       return (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                     <div className="bg-bg-card border border-white/10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                            <div className="p-6 border-b border-white/10 bg-bg-surface flex justify-between items-center">
                                   <h3 className="text-xl font-bold text-white">Nueva Reserva</h3>
                                   <button onClick={onClose} className="text-text-grey hover:text-white">✕</button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">

                                   {error && (
                                          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                                                 {error}
                                          </div>
                                   )}

                                   <div className="text-sm text-text-grey font-medium bg-bg-dark p-3 rounded-lg text-center">
                                          {format(initialDate, "EEEE d 'de' MMMM", { locale: es })}
                                   </div>

                                   <div className="grid grid-cols-2 gap-4">
                                          <div className="space-y-1">
                                                 <label className="text-xs text-text-grey uppercase font-bold">Hora</label>
                                                 <select
                                                        className="w-full bg-bg-dark border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-brand-blue outline-none"
                                                        value={formData.time}
                                                        onChange={e => setFormData({ ...formData, time: e.target.value })}
                                                 >
                                                        {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                                 </select>
                                          </div>
                                          <div className="space-y-1">
                                                 <label className="text-xs text-text-grey uppercase font-bold">Cancha</label>
                                                 <select
                                                        className="w-full bg-bg-dark border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-brand-blue outline-none"
                                                        value={formData.courtId}
                                                        onChange={e => setFormData({ ...formData, courtId: Number(e.target.value) })}
                                                 >
                                                        {courts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                 </select>
                                          </div>
                                   </div>

                                   <div className="space-y-1">
                                          <label className="text-xs text-text-grey uppercase font-bold">Nombre Cliente</label>
                                          <input
                                                 required
                                                 type="text"
                                                 placeholder="Ej: Juan Pérez"
                                                 className="w-full bg-bg-dark border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-brand-blue outline-none placeholder:text-white/20"
                                                 value={formData.name}
                                                 onChange={e => setFormData({ ...formData, name: e.target.value })}
                                          />
                                   </div>

                                   <div className="space-y-1">
                                          <label className="text-xs text-text-grey uppercase font-bold">Teléfono</label>
                                          <input
                                                 required
                                                 type="tel"
                                                 placeholder="Ej: 351..."
                                                 className="w-full bg-bg-dark border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-brand-blue outline-none placeholder:text-white/20"
                                                 value={formData.phone}
                                                 onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                          />
                                   </div>

                                   <div className="space-y-1">
                                          <label className="text-xs text-text-grey uppercase font-bold">Email (Opcional)</label>
                                          <input
                                                 type="email"
                                                 placeholder="Ej: cliente@gmail.com"
                                                 className="w-full bg-bg-dark border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-brand-blue outline-none placeholder:text-white/20"
                                                 value={formData.email}
                                                 onChange={e => setFormData({ ...formData, email: e.target.value })}
                                          />
                                   </div>

                                   <div className="pt-2">
                                          <label className="flex items-center gap-3 p-3 bg-bg-dark rounded-lg cursor-pointer border border-white/5 hover:border-white/20 transition-colors">
                                                 <input
                                                        type="checkbox"
                                                        className="w-5 h-5 rounded border-gray-300 text-brand-green focus:ring-brand-green"
                                                        checked={formData.paymentStatus === 'PAID'}
                                                        onChange={e => setFormData({ ...formData, paymentStatus: e.target.checked ? 'PAID' : 'UNPAID' })}
                                                 />
                                                 <span className="text-sm font-medium text-white">Marcar como Pagado</span>
                                          </label>
                                   </div>

                                   <div className="flex gap-3 pt-4">
                                          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-sm bg-transparent border border-white/10 text-white hover:bg-white/5 transition-colors">
                                                 Cancelar
                                          </button>
                                          <button
                                                 type="submit"
                                                 disabled={isSubmitting}
                                                 className="flex-1 py-3 rounded-xl font-bold text-sm bg-brand-green text-bg-dark hover:bg-brand-green-variant transition-colors disabled:opacity-50"
                                          >
                                                 {isSubmitting ? 'Guardando...' : 'Confirmar Reserva'}
                                          </button>
                                   </div>

                            </form>
                     </div>
              </div>
       )
}
