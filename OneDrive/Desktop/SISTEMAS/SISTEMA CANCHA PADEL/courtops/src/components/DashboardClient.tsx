'use client'

import { signOut } from 'next-auth/react'
import TurneroGrid from '@/components/TurneroGrid'
import CajaWidget from '@/components/CajaWidget'
import { useState } from 'react'
import KioscoModal from '@/components/KioscoModal'
import Link from 'next/link'
import AlertsWidget from '@/components/AlertsWidget'

// Update prop interface
export default function DashboardClient({
       user,
       clubName,
       logoUrl,
       slug,
       features = { hasKiosco: true } // Default true for legacy/dev safety, but server should pass it
}: {
       user: any,
       clubName: string,
       logoUrl?: string | null,
       slug?: string,
       features?: { hasKiosco: boolean }
}) {
       const [isKioscoOpen, setIsKioscoOpen] = useState(false)

       return (
              <div className="min-h-screen bg-bg-dark text-text-white p-4 lg:p-8 font-sans overflow-hidden flex flex-col">
                     <header className="flex items-center justify-between mb-6 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                   {logoUrl ? (
                                          <img src={logoUrl} alt={clubName} className="w-12 h-12 rounded-xl object-cover shadow-lg border border-white/10" />
                                   ) : (
                                          <div className="w-10 h-10 bg-gradient-to-br from-brand-green to-brand-green-variant rounded-xl shadow-lg shadow-brand-green/20"></div>
                                   )}
                                   <div className="flex flex-col">
                                          <div className="flex items-center gap-2">
                                                 <h1 className="text-2xl font-bold tracking-tight leading-none text-white">{clubName}</h1>
                                                 <span className="bg-white/10 text-white/60 text-[10px] px-1.5 py-0.5 rounded border border-white/5 uppercase tracking-widest font-bold">
                                                        CourtOps
                                                 </span>
                                          </div>
                                   </div>
                            </div>
                            <div className="flex items-center gap-4">
                                   <div className="flex flex-col items-end hidden sm:flex">
                                          <span className="text-sm font-medium text-white">Hola, {user?.name || 'Admin'}</span>
                                          <button
                                                 onClick={() => signOut({ callbackUrl: '/login' })}
                                                 className="text-xs text-red-400 hover:text-red-300 font-bold transition-colors flex items-center gap-1"
                                          >
                                                 Cerrar Sesión
                                          </button>
                                   </div>
                                   <Link href="/configuracion" className="w-10 h-10 bg-bg-surface rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors group" title="Configuración">
                                          <span className="text-lg opacity-50 group-hover:opacity-100 transition-opacity">⚙️</span>
                                   </Link>

                                   {/* SUPER ADMIN SHORTCUT */}
                                   {(user?.email === 'dellorsif@gmail.com' || user?.email?.includes('admin@courtops.com')) && (
                                          <Link href="/god-mode" className="w-10 h-10 bg-red-500/10 rounded-full border border-red-500/20 flex items-center justify-center hover:bg-red-500/20 transition-colors group" title="GOD MODE">
                                                 <span className="text-lg opacity-50 group-hover:opacity-100 transition-opacity">⚡</span>
                                          </Link>
                                   )}

                                   <button
                                          onClick={() => signOut({ callbackUrl: '/login' })}
                                          className="w-10 h-10 bg-bg-surface rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors group"
                                          title="Cerrar Sesión"
                                   >
                                          <span className="text-lg opacity-50 group-hover:opacity-100 transition-opacity">🚪</span>
                                   </button>
                            </div>
                     </header>

                     <main className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 h-full min-h-0">

                            {/* Main Calendar Area - Takes up 3 columns */}
                            <div className="lg:col-span-3 h-full flex flex-col min-h-0">
                                   <TurneroGrid />
                            </div>

                            {/* Sidebar Info - Takes up 1 column */}
                            <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">

                                   {/* KPI Cards */}
                                   <CajaWidget />

                                   {/* Quick Actions */}
                                   <div className="grid grid-cols-2 gap-2">
                                          {slug && (
                                                 <Link href={`/p/${slug}`} target="_blank" className="col-span-2 bg-gradient-to-r from-brand-blue/20 to-brand-green/20 hover:from-brand-blue/30 hover:to-brand-green/30 text-white p-2 rounded-2xl font-bold text-xs transition-all border border-white/10 flex flex-row gap-2 items-center justify-center h-12 mb-2">
                                                        <span className="text-xl">🌐</span>
                                                        <span className="tracking-wide">Mi Link Público</span>
                                                        <span className="ml-auto text-white/30 text-[10px]">↗</span>
                                                 </Link>
                                          )}

                                          <button className="bg-brand-blue hover:bg-brand-blue-secondary text-white p-2 rounded-2xl font-bold text-xs transition-all shadow-lg shadow-brand-blue/20 flex flex-col gap-1 items-center justify-center h-20">
                                                 <span className="text-xl">+</span>
                                                 Reserva
                                          </button>

                                          {features.hasKiosco ? (
                                                 <button
                                                        onClick={() => setIsKioscoOpen(true)}
                                                        className="bg-bg-surface hover:bg-white/5 text-white p-2 rounded-2xl font-bold text-xs transition-all border border-white/5 flex flex-col gap-1 items-center justify-center h-20"
                                                 >
                                                        <span className="text-xl">🛒</span>
                                                        Kiosco
                                                 </button>
                                          ) : (
                                                 <div className="relative group cursor-not-allowed opacity-50 grayscale bg-bg-surface border border-white/5 rounded-2xl flex flex-col gap-1 items-center justify-center h-20">
                                                        <span className="hidden group-hover:flex absolute -top-8 bg-black border border-white/20 text-white text-[10px] px-2 py-1 rounded shadow-xl whitespace-nowrap z-50">
                                                               Requiere Plan PRO
                                                        </span>
                                                        <span className="text-xl">🔒</span>
                                                        <span className="text-[10px] uppercase font-bold text-white/50">Kiosco</span>
                                                 </div>
                                          )}

                                          <Link href="/clientes" className="bg-bg-surface hover:bg-white/5 text-white p-2 rounded-2xl font-bold text-xs transition-all border border-white/5 flex flex-col gap-1 items-center justify-center h-20 text-center">
                                                 <span className="text-xl">👥</span>
                                                 Clientes
                                          </Link>
                                          <Link href="/reportes" className="bg-bg-surface hover:bg-white/5 text-white p-2 rounded-2xl font-bold text-xs transition-all border border-white/5 flex flex-col gap-1 items-center justify-center h-20 text-center">
                                                 <span className="text-xl">📊</span>
                                                 Reportes
                                          </Link>
                                   </div>

                                   {/* Notifications/Alerts */}
                                   <AlertsWidget />


                            </div>
                     </main>

                     <KioscoModal isOpen={isKioscoOpen} onClose={() => setIsKioscoOpen(false)} />
              </div>
       )
}
