import React from 'react'
import { getSettings, getAuditLogs } from '@/actions/settings'
import SettingsDashboard from '@/components/config/SettingsDashboard'

export default async function ConfiguracionPage() {
       const club = await getSettings()
       const auditLogs = await getAuditLogs()

       return (
              <div className="min-h-screen bg-bg-dark text-text-white p-4 md:p-8">
                     <div className="max-w-5xl mx-auto space-y-6">

                            {/* Header */}
                            <div className="flex items-center justify-between pb-6 border-b border-white/5">
                                   <div>
                                          <h1 className="text-3xl font-bold text-white">Configuración del Club</h1>
                                          <p className="text-text-grey mt-1">Gestiona horarios, canchas y reglas de precios.</p>
                                   </div>

                                   <div className="text-right">
                                          <span className="bg-brand-blue/10 text-brand-blue px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                                 {club.name}
                                          </span>
                                   </div>
                            </div>

                            {/* Dashboard */}
                            <div className="flex-1 min-h-[600px]">
                                   <SettingsDashboard club={club} auditLogs={auditLogs} />
                            </div>

                     </div>
              </div>
       )
}
