'use client'

import React, { useEffect, useState } from 'react'
import { getDashboardAlerts } from '@/actions/dashboard'
import { format } from 'date-fns'

type AlertsData = {
       lowStock: { name: string, stock: number }[]
       pendingPayments: { id: number, startTime: Date, client?: { name: string } | null, status: string, paymentStatus: string }[]
}

export default function AlertsWidget() {
       const [alerts, setAlerts] = useState<AlertsData | null>(null)
       const [loading, setLoading] = useState(true)

       // Poll every 30 seconds
       useEffect(() => {
              const fetchAlerts = async () => {
                     try {
                            const data = await getDashboardAlerts()
                            setAlerts(data)
                     } catch (err) {
                            console.error("Error fetching alerts", err)
                     } finally {
                            setLoading(false)
                     }
              }

              fetchAlerts()
              const interval = setInterval(fetchAlerts, 30000)
              return () => clearInterval(interval)
       }, [])

       if (loading) return <div className="bg-bg-card p-6 rounded-3xl border border-white/5 animate-pulse h-48"></div>

       if (!alerts) return null

       const hasAlerts = alerts.lowStock.length > 0 || alerts.pendingPayments.length > 0

       return (
              <div className="bg-bg-card p-6 rounded-3xl border border-white/5 shadow-lg">
                     <h2 className="text-text-grey text-xs font-bold uppercase tracking-wider mb-4 flex items-center justify-between">
                            Alertas
                            {hasAlerts && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                     </h2>

                     <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                            {!hasAlerts && (
                                   <p className="text-text-grey text-sm italic">Todo en orden. Sin alertas.</p>
                            )}

                            {/* Low Stock Alerts */}
                            {alerts.lowStock.map((prod, idx) => (
                                   <div key={`stock-${idx}`} className="flex gap-3 items-start p-2 hover:bg-white/5 rounded-lg transition-colors">
                                          <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                                          <div>
                                                 <p className="text-sm font-medium text-white">Stock bajo: {prod.name}</p>
                                                 <p className="text-xs text-text-grey mt-0.5">Quedan {prod.stock} unidades</p>
                                          </div>
                                   </div>
                            ))}

                            {/* Pending Booking Alerts */}
                            {alerts.pendingPayments.map((booking) => (
                                   <div key={`booking-${booking.id}`} className="flex gap-3 items-start p-2 hover:bg-white/5 rounded-lg transition-colors">
                                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(234,179,8,0.5)] ${booking.status === 'PENDING' ? 'bg-orange-500' : 'bg-yellow-500'}`}></div>
                                          <div>
                                                 <p className="text-sm font-medium text-white">
                                                        {booking.status === 'PENDING' ? 'Confirmación Pendiente' : 'Cobro Pendiente'}
                                                 </p>
                                                 <p className="text-xs text-text-grey mt-0.5">
                                                        {format(new Date(booking.startTime), 'HH:mm')} hs - {booking.client?.name || 'Cliente Eventual'}
                                                 </p>
                                          </div>
                                   </div>
                            ))}
                     </div>
              </div>
       )
}
