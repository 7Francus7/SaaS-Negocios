'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { getFinancialStats, getOccupancyStats, getReportTransactions } from '@/actions/reports'
import { cn } from '@/lib/utils'
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, addWeeks, addMonths, subDays, subWeeks, subMonths, format, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'

type PeriodType = 'day' | 'week' | 'month'

export default function ReportsPage() {
       const [periodType, setPeriodType] = useState<PeriodType>('day')
       const [currentDate, setCurrentDate] = useState(new Date())

       const [finances, setFinances] = useState({ income: 0, expenses: 0, balance: 0, byCategory: {} as Record<string, number> })
       const [occupancy, setOccupancy] = useState<{ hour: string, count: number, percentage: number }[]>([])
       const [transactions, setTransactions] = useState<any[]>([])

       const [loading, setLoading] = useState(true)

       // Calculate Date Range based on PeriodType and CurrentDate
       const getDateRange = () => {
              const now = currentDate
              switch (periodType) {
                     case 'day': return { start: startOfDay(now), end: endOfDay(now) }
                     case 'week': return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) }
                     case 'month': return { start: startOfMonth(now), end: endOfMonth(now) }
              }
       }

       const { start, end } = getDateRange()

       // Navigation handlers
       const handlePrev = () => {
              if (periodType === 'day') setCurrentDate(subDays(currentDate, 1))
              if (periodType === 'week') setCurrentDate(subWeeks(currentDate, 1))
              if (periodType === 'month') setCurrentDate(subMonths(currentDate, 1))
       }

       const handleNext = () => {
              if (periodType === 'day') setCurrentDate(addDays(currentDate, 1))
              if (periodType === 'week') setCurrentDate(addWeeks(currentDate, 1))
              if (periodType === 'month') setCurrentDate(addMonths(currentDate, 1))
       }

       const handleToday = () => setCurrentDate(new Date())

       useEffect(() => {
              const loadData = async () => {
                     setLoading(true)
                     try {
                            const [finData, occData, txData] = await Promise.all([
                                   getFinancialStats(start, end),
                                   getOccupancyStats(), // Occ stays global for now
                                   getReportTransactions(start, end)
                            ])
                            setFinances(finData)
                            setOccupancy(occData)
                            setTransactions(txData)
                     } catch (error) {
                            console.error("Error loading reports", error)
                     } finally {
                            setLoading(false)
                     }
              }
              loadData()
       }, [currentDate, periodType])

       // Generate CSV for Export
       const downloadCSV = () => {
              const headers = ["ID", "Fecha", "Tipo", "Categoria", "Monto", "Metodo", "Descripcion"]
              const rows = transactions.map(t => {
                     // Translate fields for better readability
                     const typeMap: Record<string, string> = { 'INCOME': 'INGRESO', 'EXPENSE': 'GASTO' }
                     const methodMap: Record<string, string> = { 'CASH': 'EFECTIVO', 'TRANSFER': 'TRANSFERENCIA', 'CREDIT': 'CRÉDITO', 'DEBIT': 'DÉBITO', 'MERCADOPAGO': 'MERCADOPAGO' }

                     const type = typeMap[t.type] || t.type
                     const method = methodMap[t.method] || t.method
                     const category = t.category.replace(/_/g, ' ')

                     return [
                            t.id,
                            format(new Date(t.createdAt), 'yyyy-MM-dd HH:mm'),
                            type,
                            category,
                            t.amount,
                            method,
                            `"${(t.description || '').replace(/"/g, '""')}"` // Safe quote escaping
                     ]
              })

              // Use semicolon (;) for better compatibility with Excel in Spanish/LATAM regions
              const csvContent = [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n')

              // Add BOM (\uFEFF) to ensure Excel recognizes UTF-8 encoding (Fixes Ã³ chars)
              const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' })
              const url = URL.createObjectURL(blob)

              const link = document.createElement("a")
              link.href = url
              link.setAttribute("download", `reporte_match_point_${format(currentDate, 'yyyy-MM-dd')}.csv`)
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
       }

       const maxOccupancy = Math.max(...occupancy.map(o => o.count), 1)

       return (
              <div className="min-h-screen bg-bg-dark text-text-white p-4 lg:p-8 font-sans pb-20">
                     {/* Header */}
                     <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 gap-4">
                            <div>
                                   <Link href="/" className="text-text-grey hover:text-white mb-2 inline-block text-sm">← Volver al Dashboard</Link>
                                   <h1 className="text-3xl font-bold tracking-tight">Reportes y Estadísticas</h1>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 items-center bg-bg-surface p-2 rounded-2xl border border-white/5 shadow-lg">
                                   {/* Period Switcher */}
                                   <div className="flex bg-bg-dark/50 p-1 rounded-xl">
                                          {(['day', 'week', 'month'] as PeriodType[]).map((p) => (
                                                 <button
                                                        key={p}
                                                        onClick={() => setPeriodType(p)}
                                                        className={cn(
                                                               "px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all",
                                                               periodType === p ? "bg-brand-blue text-white shadow" : "text-text-grey hover:text-white"
                                                        )}
                                                 >
                                                        {p === 'day' ? 'Día' : p === 'week' ? 'Semana' : 'Mes'}
                                                 </button>
                                          ))}
                                   </div>

                                   {/* Navigation */}
                                   <div className="flex items-center gap-2">
                                          <button onClick={handlePrev} className="p-2 hover:bg-white/10 rounded-lg text-text-grey hover:text-white transition-colors">←</button>
                                          <span className="font-mono font-bold w-32 text-center text-sm">
                                                 {periodType === 'day' && format(currentDate, 'dd/MM/yyyy')}
                                                 {periodType === 'week' && `Semana ${format(start, 'dd/MM')} - ${format(end, 'dd/MM')}`}
                                                 {periodType === 'month' && format(currentDate, 'MMMM yyyy', { locale: es })}
                                          </span>
                                          <button onClick={handleNext} className="p-2 hover:bg-white/10 rounded-lg text-text-grey hover:text-white transition-colors">→</button>
                                   </div>

                                   {!isSameDay(currentDate, new Date()) && (
                                          <button onClick={handleToday} className="text-xs font-bold text-brand-green uppercase tracking-wider px-2">Hoy</button>
                                   )}

                                   <div className="w-px h-8 bg-white/10 mx-2"></div>

                                   <button onClick={downloadCSV} className="flex items-center gap-2 px-4 py-2 bg-bg-card hover:bg-white/5 border border-white/10 rounded-lg text-xs font-bold uppercase tracking-wider transition-all">
                                          <span>⬇ CSV</span>
                                   </button>
                            </div>
                     </header>

                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* Financial Summary */}
                            <div className="col-span-1 lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                                   {/* Same cards as before, but with Loading State check */}
                                   <div className="bg-bg-card p-6 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden group">
                                          <div className="absolute top-0 right-0 p-4 opacity-10 text-9xl font-bold text-brand-green mix-blend-overlay group-hover:scale-110 transition-transform">$</div>
                                          <h3 className="text-text-grey text-xs font-bold uppercase tracking-wider mb-2">Ingresos Totales</h3>
                                          <div className="text-4xl font-bold text-white mb-1">
                                                 {loading ? '...' : `$${finances.income.toLocaleString('es-AR')}`}
                                          </div>
                                   </div>

                                   <div className="bg-bg-card p-6 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden group">
                                          <div className="absolute top-0 right-0 p-4 opacity-10 text-9xl font-bold text-red-500 mix-blend-overlay group-hover:scale-110 transition-transform">↓</div>
                                          <h3 className="text-text-grey text-xs font-bold uppercase tracking-wider mb-2">Gastos</h3>
                                          <div className="text-4xl font-bold text-white mb-1">
                                                 {loading ? '...' : `$${finances.expenses.toLocaleString('es-AR')}`}
                                          </div>
                                   </div>

                                   <div className="bg-bg-card p-6 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden group">
                                          <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                          <h3 className="text-text-grey text-xs font-bold uppercase tracking-wider mb-2">Balance Neto</h3>
                                          <div className={cn("text-4xl font-bold mb-1", finances.balance >= 0 ? "text-brand-blue" : "text-red-500")}>
                                                 {loading ? '...' : `$${finances.balance.toLocaleString('es-AR')}`}
                                          </div>
                                   </div>
                            </div>

                            {/* Occupancy Chart - Keeping it simple and effective */}
                            <div className="col-span-1 lg:col-span-2 bg-bg-card p-8 rounded-3xl border border-white/5 shadow-xl">
                                   <h3 className="text-xl font-bold text-white mb-6">Ocupación por Hora (General)</h3>
                                   <div className="h-64 flex items-end justify-between gap-2">
                                          {loading ? <div className="w-full h-full flex items-center justify-center text-text-grey">Cargando...</div> : occupancy.map((item, idx) => (
                                                 <div key={idx} className="flex flex-col items-center gap-2 group w-full relative">
                                                        <div className="absolute -top-8 bg-bg-surface px-2 py-1 rounded text-[10px] font-bold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                                               {item.count} reservas
                                                        </div>
                                                        <div
                                                               className="w-full bg-brand-blue/30 rounded-t-lg relative hover:bg-brand-blue transition-all cursor-pointer"
                                                               style={{ height: `${(item.count / maxOccupancy) * 100}%`, minHeight: '4px' }}
                                                        >
                                                               <div
                                                                      className="absolute bottom-0 left-0 right-0 bg-brand-blue rounded-t-lg transition-all"
                                                                      style={{ height: `${item.percentage}%`, opacity: 0.8 }}
                                                               ></div>
                                                        </div>
                                                        <span className="text-[10px] uppercase font-bold text-text-grey">{item.hour}</span>
                                                 </div>
                                          ))}
                                   </div>
                            </div>

                            {/* Category Details */}
                            <div className="bg-bg-card p-8 rounded-3xl border border-white/5 shadow-xl">
                                   <h3 className="text-xl font-bold text-white mb-6">Desglose Categorías</h3>
                                   <div className="space-y-4">
                                          {loading ? '...' : Object.entries(finances.byCategory).map(([cat, amount], idx) => (
                                                 <div key={idx} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors">
                                                        <div className="flex items-center gap-3">
                                                               <div className={cn("w-2 h-2 rounded-full", amount > 0 ? "bg-brand-green" : "bg-red-500")}></div>
                                                               <span className="text-sm text-white font-medium capitalize">{cat.toLowerCase().replace('_', ' ')}</span>
                                                        </div>
                                                        <span className="text-sm font-mono text-text-grey">${Math.abs(amount).toLocaleString('es-AR')}</span>
                                                 </div>
                                          ))}
                                   </div>
                            </div>

                            {/* Detailed Transactions List */}
                            <div className="col-span-1 lg:col-span-3 bg-bg-card p-8 rounded-3xl border border-white/5 shadow-xl">
                                   <div className="flex items-center justify-between mb-6">
                                          <h3 className="text-xl font-bold text-white">Detalle de Movimientos</h3>
                                          <span className="text-xs text-text-grey uppercase tracking-wider">{transactions.length} registros</span>
                                   </div>

                                   <div className="overflow-x-auto">
                                          <table className="w-full text-left border-collapse">
                                                 <thead>
                                                        <tr className="text-xs uppercase tracking-wider text-text-grey border-b border-white/10">
                                                               <th className="pb-4 font-bold p-2">Fecha</th>
                                                               <th className="pb-4 font-bold p-2">Categoría</th>
                                                               <th className="pb-4 font-bold p-2">Descripción</th>
                                                               <th className="pb-4 font-bold p-2">Método</th>
                                                               <th className="pb-4 font-bold text-right p-2">Monto</th>
                                                        </tr>
                                                 </thead>
                                                 <tbody className="text-sm">
                                                        {loading ? (
                                                               <tr><td colSpan={5} className="py-8 text-center text-text-grey italic">Cargando...</td></tr>
                                                        ) : transactions.length === 0 ? (
                                                               <tr><td colSpan={5} className="py-8 text-center text-text-grey italic">No hay movimientos en este periodo.</td></tr>
                                                        ) : (
                                                               transactions.map((tx) => (
                                                                      <tr key={tx.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                                                             <td className="py-4 p-2 font-mono text-text-grey text-xs">
                                                                                    {format(new Date(tx.createdAt), 'dd/MM HH:mm')}
                                                                             </td>
                                                                             <td className="py-4 p-2">
                                                                                    <span className={cn(
                                                                                           "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider",
                                                                                           tx.type === 'INCOME' ? "bg-brand-green/10 text-brand-green" : "bg-red-500/10 text-red-400"
                                                                                    )}>
                                                                                           {(() => {
                                                                                                  const catMap: Record<string, string> = { 'BOOKING': 'RESERVA', 'BOOKING_PAYMENT': 'RESERVA', 'KIOSCO': 'KIOSCO', 'REFUND': 'DEVOLUCIÓN', 'OTHER': 'OTROS' }
                                                                                                  return catMap[tx.category] || tx.category.replace(/_/g, ' ')
                                                                                           })()}
                                                                                    </span>
                                                                             </td>
                                                                             <td className="py-4 p-2 text-white/80">{tx.description || '-'}</td>
                                                                             <td className="py-4 p-2 text-xs uppercase text-text-grey">
                                                                                    {(() => {
                                                                                           const methodMap: Record<string, string> = { 'CASH': 'EFECTIVO', 'TRANSFER': 'TRANSFERENCIA', 'CREDIT': 'CRÉDITO', 'DEBIT': 'DÉBITO', 'MERCADOPAGO': 'MERCADOPAGO' }
                                                                                           return methodMap[tx.method] || tx.method
                                                                                    })()}
                                                                             </td>
                                                                             <td className={cn(
                                                                                    "py-4 p-2 text-right font-mono font-bold",
                                                                                    tx.type === 'INCOME' ? "text-brand-green" : "text-red-400"
                                                                             )}>
                                                                                    {tx.type === 'INCOME' ? '+' : '-'}${tx.amount.toLocaleString('es-AR')}
                                                                             </td>
                                                                      </tr>
                                                               ))
                                                        )}
                                                 </tbody>
                                          </table>
                                   </div>
                            </div>

                     </div>
              </div>
       )
}
