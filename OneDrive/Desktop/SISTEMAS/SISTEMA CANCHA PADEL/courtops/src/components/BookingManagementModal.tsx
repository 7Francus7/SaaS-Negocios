'use client'

import React, { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cancelBooking, updateBookingStatus } from '@/actions/manageBooking'
import { cn } from '@/lib/utils'

type BookingDetails = {
       id: number
       clientName: string
       startTime: string // ISO string or Date
       courtName: string
       status: string
       paymentStatus: string
       price: number
}

type Props = {
       booking: BookingDetails | null
       onClose: () => void
       onUpdate: () => void
}

export default function BookingManagementModal({ booking, onClose, onUpdate }: Props) {
       const [loading, setLoading] = useState(false)

       if (!booking) return null

       const handleConfirm = async () => {
              setLoading(true)
              await updateBookingStatus(booking.id, { status: 'CONFIRMED' })
              setLoading(false)
              onUpdate()
              onClose()
       }

       const handleMarkPaid = async () => {
              // Optionally ask for payment method in future, but for now direct action is better
              setLoading(true)
              await updateBookingStatus(booking.id, { status: 'CONFIRMED', paymentStatus: 'PAID' })
              setLoading(false)
              onUpdate()
              onClose()
       }

       const handleCancel = async () => {
              // Removed confirmation for speed demo flow as requested: "que no le tenga que dar aceptar a nada"
              // if (!confirm('¿Seguro que deseas CANCELAR este turno?')) return
              setLoading(true)
              await cancelBooking(booking.id)
              setLoading(false)
              onUpdate()
              onClose()
       }

       const dateObj = new Date(booking.startTime)

       return (
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                     <div className="bg-bg-card border border-white/10 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                            {/* Header */}
                            <div className={cn("p-6 text-center",
                                   booking.paymentStatus === 'PAID' ? "bg-brand-green/10" :
                                          booking.status === 'PENDING' ? "bg-orange-500/10" :
                                                 "bg-brand-blue/10"
                            )}>
                                   <div className={cn("w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-3 shadow-lg",
                                          booking.paymentStatus === 'PAID' ? "bg-brand-green text-bg-dark" :
                                                 booking.status === 'PENDING' ? "bg-orange-500 text-white" :
                                                        "bg-brand-blue text-white"
                                   )}>
                                          {booking.paymentStatus === 'PAID' ? '✅' : booking.status === 'PENDING' ? '⏳' : '📅'}
                                   </div>
                                   <h2 className="text-xl font-bold text-white">{booking.clientName}</h2>
                                   <p className="text-sm font-medium opacity-80 uppercase tracking-wide">
                                          {format(dateObj, 'EEEE d', { locale: es })} - {format(dateObj, 'HH:mm')} hs
                                   </p>
                            </div>

                            {/* Body */}
                            <div className="p-6 space-y-4">

                                   {/* Price Tag */}
                                   <div className="flex justify-between items-center bg-bg-surface p-3 rounded-lg border border-white/5">
                                          <span className="text-sm text-text-grey">Precio del Turno</span>
                                          <span className="text-xl font-bold font-mono text-white">$ {booking.price.toLocaleString('es-AR')}</span>
                                   </div>

                                   <div className="h-px bg-white/5 my-2"></div>

                                   {/* Actions */}
                                   <div className="space-y-2">

                                          {/* State: PENDING -> Needs Confirmation */}
                                          {booking.status === 'PENDING' && (
                                                 <button
                                                        onClick={handleConfirm}
                                                        disabled={loading}
                                                        className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-colors shadow-lg shadow-orange-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                                 >
                                                        {loading ? 'Procesando...' : 'Confirmar Turno'}
                                                 </button>
                                          )}

                                          {/* State: UNPAID -> Pay */}
                                          {booking.paymentStatus !== 'PAID' && (
                                                 <button
                                                        onClick={handleMarkPaid}
                                                        disabled={loading}
                                                        className="w-full py-3 rounded-xl bg-brand-green hover:bg-brand-green-variant text-bg-dark font-bold transition-colors shadow-lg shadow-brand-green/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                                 >
                                                        {loading ? 'Procesando...' : 'Cobrar (Efectivo)'}
                                                 </button>
                                          )}

                                          <button
                                                 onClick={handleCancel}
                                                 disabled={loading}
                                                 className="w-full py-3 rounded-xl bg-bg-surface hover:bg-red-500/10 text-red-400 hover:border-red-500/30 border border-transparent font-medium transition-all active:scale-95 disabled:opacity-50"
                                          >
                                                 {loading ? '...' : 'Cancelar Reserva'}
                                          </button>
                                   </div>

                            </div>

                            <div className="bg-bg-surface p-3 text-center border-t border-white/5">
                                   <button onClick={onClose} className="text-xs text-text-grey hover:text-white uppercase font-bold tracking-wider">Cerrar</button>
                            </div>
                     </div>
              </div>
       )
}
