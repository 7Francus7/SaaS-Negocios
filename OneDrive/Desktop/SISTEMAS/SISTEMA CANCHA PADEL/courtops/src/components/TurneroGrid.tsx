'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { format, addDays, subDays, isSameDay, addMinutes, set } from 'date-fns'
import { es } from 'date-fns/locale'

import { getBookingsForDate, getCourts, type BookingWithClient } from '@/actions/turnero'
import { cn } from '@/lib/utils'

import BookingModal from './BookingModal'
import BookingManagementModal from './BookingManagementModal'

const START_HOUR = 14
const LAST_SLOT_START_HOUR = 23
const SLOT_DURATION_MIN = 90

type Court = { id: number; name: string }

function timeKey(d: Date) {
       return format(d, 'HH:mm')
}

export default function TurneroGrid() {
       const [selectedDate, setSelectedDate] = useState<Date>(new Date())
       const [courts, setCourts] = useState<Court[]>([])
       const [bookings, setBookings] = useState<BookingWithClient[]>([])
       const [isLoading, setIsLoading] = useState(true)

       const [isNewModalOpen, setIsNewModalOpen] = useState(false)
       const [newModalData, setNewModalData] = useState<{ courtId?: number; time?: string }>({})

       // Management Modal State
       // We use direct object for managementData to match existing BookingManagementModal props
       const [managementData, setManagementData] = useState<any>(null)

       const TIME_SLOTS = useMemo(() => {
              const slots: Date[] = []
              let cur = set(selectedDate, { hours: START_HOUR, minutes: 0, seconds: 0, milliseconds: 0 })
              const lastStart = set(selectedDate, { hours: LAST_SLOT_START_HOUR, minutes: 0, seconds: 0, milliseconds: 0 })

              while (cur <= lastStart) {
                     slots.push(cur)
                     cur = addMinutes(cur, SLOT_DURATION_MIN)
              }
              return slots
       }, [selectedDate])

       const bookingsByCourtAndTime = useMemo(() => {
              const map = new Map<string, BookingWithClient>()
              for (const b of bookings) {
                     if (b.status === 'CANCELED') continue;

                     const start = new Date(b.startTime)
                     const key = `${b.courtId}-${timeKey(start)}`
                     map.set(key, b)
              }
              return map
       }, [bookings])

       async function fetchData(silent = false) {
              if (!silent) setIsLoading(true)
              try {
                     const [courtsRes, bookingsRes] = await Promise.all([
                            getCourts(),
                            getBookingsForDate(selectedDate),
                     ])
                     setCourts(courtsRes)
                     setBookings(bookingsRes)
              } finally {
                     if (!silent) setIsLoading(false)
              }
       }

       useEffect(() => {
              fetchData()

              // Polling every 10 seconds to keep grid updated with public bookings
              const intervalId = setInterval(() => {
                     fetchData(true)
              }, 10000)

              return () => clearInterval(intervalId)
              // eslint-disable-next-line react-hooks/exhaustive-deps
       }, [selectedDate])

       function goToday() {
              setSelectedDate(new Date())
       }

       function openNewBooking(courtId?: number, time?: string) {
              setNewModalData({ courtId, time })
              setIsNewModalOpen(true)
       }

       function openBookingManagement(booking: BookingWithClient, courtName: string) {
              setManagementData({
                     id: booking.id,
                     clientName: booking.client?.name || 'Cliente',
                     startTime: booking.startTime,
                     courtName: courtName,
                     status: booking.status,
                     paymentStatus: booking.paymentStatus,
                     price: booking.price
              })
       }

       return (
              <div className="flex flex-col h-full bg-bg-dark rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
                     {/* Header */}
                     <div className="flex items-center justify-between p-4 border-b border-white/5 bg-bg-surface/30">
                            <div className="flex items-center gap-3">
                                   <button
                                          onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                                          className="text-text-grey text-lg font-bold px-3 py-1 rounded-full hover:bg-white/5 transition-colors"
                                   >
                                          ←
                                   </button>

                                   <div className="text-white font-bold text-xl capitalize">
                                          {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
                                   </div>

                                   <button
                                          onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                                          className="text-text-grey text-lg font-bold px-3 py-1 rounded-full hover:bg-white/5 transition-colors"
                                   >
                                          →
                                   </button>

                                   {!isSameDay(selectedDate, new Date()) && (
                                          <button
                                                 onClick={goToday}
                                                 className="ml-2 text-xs font-bold text-brand-blue bg-brand-blue/10 px-3 py-1 rounded-full hover:bg-brand-blue/20 transition-colors"
                                          >
                                                 HOY
                                          </button>
                                   )}
                            </div>

                            <div className="flex items-center gap-2">
                                   <div className="flex items-center gap-2 px-2">
                                          <div className="w-3 h-3 bg-brand-green rounded-full" />
                                          <span className="text-xs text-text-grey font-bold">Pagado</span>
                                   </div>
                                   <div className="flex items-center gap-2 px-2">
                                          <div className="w-3 h-3 bg-brand-blue rounded-full" />
                                          <span className="text-xs text-text-grey font-bold">Confirmado</span>
                                   </div>
                                   <div className="flex items-center gap-2 px-2">
                                          <div className="w-3 h-3 bg-orange-500 rounded-full" />
                                          <span className="text-xs text-text-grey font-bold">Confirmar</span>
                                   </div>

                                   <button
                                          onClick={() => openNewBooking()}
                                          className="ml-2 bg-brand-green text-bg-dark font-bold text-xs uppercase px-4 py-2 rounded-lg hover:bg-brand-green-variant transition-colors shadow-lg shadow-brand-green/20"
                                   >
                                          + Nueva Reserva
                                   </button>
                                   <a href="/configuracion" className="ml-2 w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 text-text-grey hover:text-white hover:bg-white/10 transition-colors" title="Configuración">
                                          ⚙️
                                   </a>
                            </div>
                     </div>

                     {/* Grid header */}
                     <div className="grid grid-cols-[90px_1fr_1fr] bg-bg-surface border-b border-white/5 sticky top-0 z-10 shadow-md">
                            <div className="p-3 text-center text-text-grey text-xs font-bold uppercase tracking-wider border-r border-white/5 flex items-center justify-center">
                                   Hora
                            </div>
                            {courts.map((court) => (
                                   <div key={court.id} className="p-3 text-center border-r border-white/5 last:border-r-0">
                                          <span className="font-bold text-brand-blue text-sm tracking-wide">
                                                 {court.name}
                                          </span>
                                   </div>
                            ))}
                     </div>

                     {/* Grid body */}
                     <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-bg-card">
                            {isLoading ? (
                                   <div className="absolute inset-0 flex items-center justify-center">
                                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green" />
                                   </div>
                            ) : (
                                   <div className="divide-y divide-white/5">
                                          {TIME_SLOTS.map((slotStart) => {
                                                 const slotLabel = timeKey(slotStart)
                                                 const now = new Date()
                                                 const isToday = isSameDay(selectedDate, now)
                                                 // Simple current hour check: if slotStart <= now < slotStart + 90min
                                                 const slotEnd = addMinutes(slotStart, SLOT_DURATION_MIN)
                                                 // We compare hours/minutes only by setting date components match
                                                 const nowTime = set(now, { year: slotStart.getFullYear(), month: slotStart.getMonth(), date: slotStart.getDate() })

                                                 const isCurrentTime = isToday && nowTime >= slotStart && nowTime < slotEnd

                                                 return (
                                                        <div key={slotLabel} className={cn(
                                                               "grid grid-cols-[90px_1fr_1fr] min-h-[100px] transition-colors group relative",
                                                               isCurrentTime ? "bg-brand-blue/5" : "hover:bg-white/[0.02]"
                                                        )}>
                                                               {/* Current Time Indicator Line */}
                                                               {isCurrentTime && (
                                                                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-blue shadow-[0_0_10px_rgba(59,130,246,0.5)] z-20" />
                                                               )}

                                                               {/* Time column */}
                                                               <div className={cn(
                                                                      "p-3 border-r border-white/5 text-center text-sm font-mono flex items-center justify-center font-medium",
                                                                      isCurrentTime ? "text-brand-blue font-bold" : "text-text-grey"
                                                               )}>
                                                                      {slotLabel}
                                                               </div>

                                                               {/* Court columns */}
                                                               {courts.map((court) => {
                                                                      const key = `${court.id}-${slotLabel}`
                                                                      const booking = bookingsByCourtAndTime.get(key)

                                                                      return (
                                                                             <div key={key} className="p-1 border-r border-white/5 last:border-r-0 relative">
                                                                                    <div className="w-full h-full rounded-xl relative">
                                                                                           {booking ? (
                                                                                                  <div
                                                                                                         onClick={() => openBookingManagement(booking, court.name)}
                                                                                                         className={cn(
                                                                                                                "w-full h-full rounded-xl p-3 text-left transition-all cursor-pointer hover:scale-[1.02] shadow-md flex flex-col justify-between",
                                                                                                                booking.paymentStatus === 'PAID'
                                                                                                                       ? "bg-gradient-to-br from-brand-green/20 to-brand-green/5 border border-brand-green/30"
                                                                                                                       : booking.status === 'PENDING'
                                                                                                                              ? "bg-gradient-to-br from-orange-500/20 to-orange-500/5 border border-orange-500/30"
                                                                                                                              : "bg-gradient-to-br from-brand-blue/20 to-brand-blue/5 border border-brand-blue/30"
                                                                                                         )}
                                                                                                  >
                                                                                                         <div>
                                                                                                                <div className="flex justify-between items-start mb-1">
                                                                                                                       <span
                                                                                                                              className={cn(
                                                                                                                                     "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider",
                                                                                                                                     booking.paymentStatus === 'PAID'
                                                                                                                                            ? "bg-brand-green text-bg-dark"
                                                                                                                                            : booking.status === 'PENDING'
                                                                                                                                                   ? "bg-orange-500 text-white"
                                                                                                                                                   : "bg-brand-blue text-white"
                                                                                                                              )}
                                                                                                                       >
                                                                                                                              {booking.paymentStatus === 'PAID' ? 'Pagado' : booking.status === 'PENDING' ? 'Confirmar' : 'Confirmado'}
                                                                                                                       </span>

                                                                                                                       <span className="text-white text-xs font-mono opacity-60">
                                                                                                                              ${booking.price.toLocaleString('es-AR')}
                                                                                                                       </span>
                                                                                                                </div>

                                                                                                                <h4 className="font-bold text-white text-base truncate mt-1">
                                                                                                                       {booking.client?.name || 'Cliente'}
                                                                                                                </h4>
                                                                                                         </div>

                                                                                                         <div className="text-xs text-text-grey/80">Ver detalles →</div>
                                                                                                  </div>
                                                                                           ) : (
                                                                                                  <div
                                                                                                         onClick={() => openNewBooking(court.id, slotLabel)}
                                                                                                         className="w-full h-full rounded-xl border border-dashed border-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-brand-green/5 hover:border-brand-green/30 cursor-pointer"
                                                                                                  >
                                                                                                         <span className="text-brand-green font-bold text-sm">+ Reservar</span>
                                                                                                  </div>
                                                                                           )}
                                                                                    </div>
                                                                             </div>
                                                                      )
                                                               })}
                                                        </div>
                                                 )
                                          })}
                                   </div>
                            )}
                     </div>

                     {/* Modals */}
                     <BookingModal
                            isOpen={isNewModalOpen}
                            onClose={() => setIsNewModalOpen(false)}
                            onSuccess={() => {
                                   fetchData()
                                   setIsNewModalOpen(false)
                            }}
                            initialDate={selectedDate}
                            initialTime={newModalData.time}
                            initialCourtId={newModalData.courtId || 0}
                            courts={courts}
                     />

                     <BookingManagementModal
                            booking={managementData}
                            onClose={() => setManagementData(null)}
                            onUpdate={() => {
                                   fetchData()
                                   setManagementData(null)
                            }}
                     />
              </div>
       )
}
