'use client'

import React, { useState } from 'react'
import { updateClubSettings, upsertCourt, deleteCourt, upsertPriceRule, deletePriceRule, updateMyPassword } from '@/actions/settings'
import { createTeamMember, deleteTeamMember } from '@/actions/team'
import { useRouter } from 'next/navigation'
// ...

// ... imports

type Props = {
       club: any // Typed from Prisma infer ideally
       auditLogs?: any[]
}

const DAYS_MAP = [
       { value: '1', label: 'Lun' },
       { value: '2', label: 'Mar' },
       { value: '3', label: 'Mié' },
       { value: '4', label: 'Jue' },
       { value: '5', label: 'Vie' },
       { value: '6', label: 'Sáb' },
       { value: '0', label: 'Dom' },
]

export default function SettingsDashboard({ club, auditLogs = [] }: Props) {
       const router = useRouter()
       const [activeTab, setActiveTab] = useState<'GENERAL' | 'CANCHAS' | 'PRECIOS' | 'CUENTA' | 'EQUIPO' | 'AUDITORIA'>('GENERAL')
       const [isLoading, setIsLoading] = useState(false)

       // -- GENERAL STATE --
       const [generalForm, setGeneralForm] = useState({
              name: club.name || '',
              logoUrl: club.logoUrl || '',
              openTime: club.openTime || '14:00',
              closeTime: club.closeTime || '00:00',
              slotDuration: club.slotDuration || 90,
              cancelHours: club.cancelHours || 6,
              currency: club.currency || 'ARS'
       })

       // -- COURTS STATE --
       const [isCourtModalOpen, setIsCourtModalOpen] = useState(false)
       const [editingCourt, setEditingCourt] = useState<any | null>(null)

       // -- PRICE RULES STATE --
       const [isRuleModalOpen, setIsRuleModalOpen] = useState(false)
       const [editingRule, setEditingRule] = useState<any | null>(null)

       // -- PASSWORD STATE --
       const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' })

       // -- TEAM STATE --
       const [isTeamModalOpen, setIsTeamModalOpen] = useState(false)
       const [teamForm, setTeamForm] = useState({ name: '', email: '', password: '', role: 'USER' })

       // --- HANDLERS GENERAL ---
       async function saveGeneral() {
              setIsLoading(true)
              const payload = {
                     name: generalForm.name,
                     logoUrl: generalForm.logoUrl,
                     openTime: generalForm.openTime,
                     closeTime: generalForm.closeTime,
                     slotDuration: Number(generalForm.slotDuration),
                     cancelHours: Number(generalForm.cancelHours)
              }

              const res = await updateClubSettings(payload)
              router.refresh()
              setIsLoading(false)
              if (res.success) alert('Guardado!')
              else alert('Error: ' + (res.error || 'Error desconocido'))
       }

       // --- HANDLERS COURTS ---
       async function saveCourt(e: React.FormEvent) {
              e.preventDefault()
              const payload = {
                     id: editingCourt.id ? Number(editingCourt.id) : undefined,
                     name: editingCourt.name,
                     surface: editingCourt.surface || '',
                     isIndoor: Boolean(editingCourt.isIndoor)
              }

              await upsertCourt(payload)
              router.refresh()
              setIsCourtModalOpen(false)
       }

       async function removeCourt(id: number) {
              if (!confirm('Borrar cancha?')) return
              await deleteCourt(id)
              router.refresh()
       }

       // --- HANDLERS RULES ---
       function toggleDay(day: string) {
              if (!editingRule) return
              const currentDays = editingRule.daysOfWeek ? editingRule.daysOfWeek.split(',') : []
              if (currentDays.includes(day)) {
                     setEditingRule({ ...editingRule, daysOfWeek: currentDays.filter((d: string) => d !== day).join(',') })
              } else {
                     setEditingRule({ ...editingRule, daysOfWeek: [...currentDays, day].join(',') })
              }
       }

       async function saveRule(e: React.FormEvent) {
              e.preventDefault()
              const payload = {
                     id: editingRule.id ? Number(editingRule.id) : undefined,
                     name: editingRule.name || '',
                     startTime: editingRule.startTime,
                     endTime: editingRule.endTime,
                     price: Number(editingRule.price),
                     daysOfWeek: editingRule.daysOfWeek || '',
                     priority: Number(editingRule.priority || 0),
                     startDate: editingRule.startDate ? new Date(editingRule.startDate) : undefined,
                     endDate: editingRule.endDate ? new Date(editingRule.endDate) : undefined,
              }

              await upsertPriceRule(payload)
              router.refresh()
              setIsRuleModalOpen(false)
       }

       async function removeRule(id: number) {
              if (!confirm('Borrar regla?')) return
              await deletePriceRule(id)
              router.refresh()
       }
       async function savePassword(e: React.FormEvent) {
              e.preventDefault()
              if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                     alert('Las contraseñas no coinciden')
                     return
              }
              if (passwordForm.newPassword.length < 6) {
                     alert('La contraseña debe tener al menos 6 caracteres')
                     return
              }

              setIsLoading(true)
              const formData = new FormData()
              formData.append('newPassword', passwordForm.newPassword)

              const res = await updateMyPassword(formData)
              setIsLoading(false)

              if (res.success) {
                     alert('Contraseña actualizada correctamente')
                     setPasswordForm({ newPassword: '', confirmPassword: '' })
              } else {
                     alert('Error: ' + res.error)
              }
       }

       // --- HANDLERS TEAM ---
       async function saveTeam(e: React.FormEvent) {
              e.preventDefault()
              setIsLoading(true)
              const res = await createTeamMember(teamForm)
              setIsLoading(false)
              if (res.success) {
                     alert('Usuario creado correctamente')
                     setTeamForm({ name: '', email: '', password: '', role: 'USER' })
                     setIsTeamModalOpen(false)
                     router.refresh()
              } else {
                     alert('Error: ' + res.error)
              }
       }

       async function removeTeam(id: string) {
              if (!confirm('¿Eliminar usuario?')) return
              await deleteTeamMember(id)
              router.refresh()
       }


       return (
              <div className="flex flex-col h-full space-y-6">

                     {/* TABS */}
                     <div className="flex gap-4 border-b border-white/5 pb-1">
                            <TabButton active={activeTab === 'GENERAL'} onClick={() => setActiveTab('GENERAL')}>General</TabButton>
                            <TabButton active={activeTab === 'CANCHAS'} onClick={() => setActiveTab('CANCHAS')}>Canchas</TabButton>
                            <TabButton active={activeTab === 'PRECIOS'} onClick={() => setActiveTab('PRECIOS')}>Precios y Temporadas</TabButton>
                            <TabButton active={activeTab === 'EQUIPO'} onClick={() => setActiveTab('EQUIPO')}>Equipo</TabButton>
                            <TabButton active={activeTab === 'AUDITORIA'} onClick={() => setActiveTab('AUDITORIA')}>Auditoría</TabButton>
                            <TabButton active={activeTab === 'CUENTA'} onClick={() => setActiveTab('CUENTA')}>Cuenta</TabButton>
                     </div>

                     {/* CONTENT */}
                     <div className="flex-1 overflow-auto custom-scrollbar">

                            {/* --- GENERAL TAB --- */}
                            {activeTab === 'GENERAL' && (
                                   <div className="max-w-xl space-y-6 bg-bg-card p-6 rounded-2xl border border-white/5">
                                          <InputGroup label="Nombre del Club">
                                                 <input className="input-dark" value={generalForm.name} onChange={e => setGeneralForm({ ...generalForm, name: e.target.value })} />
                                          </InputGroup>

                                          <InputGroup label="Logo del Club (URL)">
                                                 <input
                                                        className="input-dark w-full"
                                                        value={generalForm.logoUrl || ''}
                                                        onChange={e => setGeneralForm({ ...generalForm, logoUrl: e.target.value })}
                                                        placeholder="https://ejemplo.com/logo.png"
                                                 />
                                                 <p className="text-[10px] text-zinc-500 pt-1">URL de una imagen (.png o .jpg)</p>
                                          </InputGroup>

                                          <div className="grid grid-cols-2 gap-4">
                                                 <InputGroup label="Apertura (HH:mm)">
                                                        <input type="time" className="input-dark" value={generalForm.openTime} onChange={e => setGeneralForm({ ...generalForm, openTime: e.target.value ?? '14:00' })} />
                                                 </InputGroup>
                                                 <InputGroup label="Cierre (HH:mm)">
                                                        <input type="time" className="input-dark" value={generalForm.closeTime} onChange={e => setGeneralForm({ ...generalForm, closeTime: e.target.value ?? '00:00' })} />
                                                 </InputGroup>
                                          </div>

                                          <div className="grid grid-cols-2 gap-4">
                                                 <InputGroup label="Duración Turno (min)">
                                                        <input type="number" className="input-dark" value={generalForm.slotDuration} onChange={e => setGeneralForm({ ...generalForm, slotDuration: Number(e.target.value) })} />
                                                 </InputGroup>
                                                 <InputGroup label="Cancelación (Horas antes)">
                                                        <input type="number" className="input-dark" value={generalForm.cancelHours} onChange={e => setGeneralForm({ ...generalForm, cancelHours: Number(e.target.value) })} />
                                                 </InputGroup>
                                          </div>

                                          <div className="pt-4">
                                                 <button onClick={saveGeneral} disabled={isLoading} className="btn-primary w-full">
                                                        {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                                                 </button>
                                          </div>
                                   </div>
                            )}

                            {/* --- COURTS TAB --- */}
                            {activeTab === 'CANCHAS' && (
                                   <div className="space-y-4">
                                          <div className="flex justify-end">
                                                 <button onClick={() => { setEditingCourt({}); setIsCourtModalOpen(true) }} className="btn-primary text-sm px-4 py-2">+ Nueva Cancha</button>
                                          </div>

                                          <div className="grid gap-3">
                                                 {club.courts.map((c: any) => (
                                                        <div key={c.id} className="flex items-center justify-between p-4 bg-bg-card rounded-xl border border-white/5">
                                                               <div>
                                                                      <h4 className="font-bold text-white">{c.name}</h4>
                                                                      <p className="text-xs text-text-grey">{c.surface} - {c.isIndoor ? 'Indoor' : 'Outdoor'}</p>
                                                               </div>
                                                               <div className="flex gap-2">
                                                                      <button onClick={() => { setEditingCourt(c); setIsCourtModalOpen(true) }} className="text-brand-blue font-bold text-sm px-3 py-1 bg-brand-blue/10 rounded-lg">Editar</button>
                                                                      <button onClick={() => removeCourt(c.id)} className="text-red-500 font-bold text-sm px-3 py-1 hover:bg-red-500/10 rounded-lg">✕</button>
                                                               </div>
                                                        </div>
                                                 ))}
                                          </div>
                                   </div>
                            )}

                            {/* --- PRICE RULES TAB --- */}
                            {activeTab === 'PRECIOS' && (
                                   <div className="space-y-4">
                                          <div className="flex justify-between items-center mb-6">
                                                 <p className="text-sm text-text-grey max-w-lg">Define cuánto cuesta el turno según el día y la hora. El sistema usará la regla más específica primero (mayor prioridad).</p>
                                                 <button onClick={() => {
                                                        setEditingRule({ name: 'Nueva Regla', price: 10000, priority: 1, startTime: '14:00', endTime: '23:00', daysOfWeek: ['1', '2', '3', '4', '5'] });
                                                        setIsRuleModalOpen(true)
                                                 }} className="btn-primary text-sm px-4 py-2">+ Nueva Regla</button>
                                          </div>

                                          <div className="grid gap-3">
                                                 {club.priceRules.map((r: any) => (
                                                        <div key={r.id} className="p-4 bg-bg-card rounded-xl border border-white/5 relative overflow-hidden">
                                                               <div className="flex justify-between items-start">
                                                                      <div>
                                                                             <h4 className="font-bold text-white text-lg">{r.name}</h4>
                                                                             <div className="flex items-center gap-2 mt-1">
                                                                                    <span className="text-brand-green font-mono font-bold text-lg">${r.price.toLocaleString('es-AR')}</span>
                                                                                    <span className="text-xs text-text-grey bg-white/5 px-2 py-1 rounded">Prioridad: {r.priority}</span>
                                                                             </div>
                                                                      </div>
                                                                      <div className="flex gap-2">
                                                                             <button onClick={() => {
                                                                                    // Parse days
                                                                                    const days = r.daysOfWeek ? r.daysOfWeek.split(',') : []
                                                                                    setEditingRule({ ...r, daysOfWeek: days });
                                                                                    setIsRuleModalOpen(true)
                                                                             }} className="text-brand-blue font-bold text-sm">Editar</button>
                                                                             <button onClick={() => removeRule(r.id)} className="text-red-500 font-bold text-sm">Eliminar</button>
                                                                      </div>
                                                               </div>

                                                               <div className="mt-4 flex flex-wrap gap-4 text-sm text-text-grey border-t border-white/5 pt-3">
                                                                      <div className="flex items-center gap-2">
                                                                             <span className="opacity-50">🕒 Horario:</span>
                                                                             <span className="text-white font-medium">{r.startTime} - {r.endTime}</span>
                                                                      </div>
                                                                      <div className="flex items-center gap-2">
                                                                             <span className="opacity-50">📅 Días:</span>
                                                                             <div className="flex gap-1">
                                                                                    {DAYS_MAP.map(d => {
                                                                                           const isActive = r.daysOfWeek?.includes(d.value)
                                                                                           return (
                                                                                                  <span key={d.value} className={`text-[10px] w-5 h-5 flex items-center justify-center rounded ${isActive ? 'bg-brand-blue text-white' : 'bg-white/5 opacity-30'}`}>
                                                                                                         {d.label.charAt(0)}
                                                                                                  </span>
                                                                                           )
                                                                                    })}
                                                                             </div>
                                                                      </div>
                                                               </div>
                                                        </div>
                                                 ))}
                                          </div>
                                   </div>
                            )}

                            {/* --- TEAM TAB --- */}
                            {activeTab === 'EQUIPO' && (
                                   <div className="space-y-6">
                                          {/* Usage Bar */}
                                          <div className="bg-bg-card p-4 rounded-xl border border-white/5 flex items-center justify-between">
                                                 <div>
                                                        <h3 className="text-sm font-bold text-white mb-1">Tu Equipo</h3>
                                                        <p className="text-xs text-text-grey">
                                                               Tienes {club.users?.length || 0} usuarios de {club.maxUsers || 1} permitidos por tu plan {club.plan || 'BASIC'}.
                                                        </p>
                                                 </div>
                                                 <div className="w-32 h-2 bg-white/5 rounded-full overflow-hidden">
                                                        <div
                                                               className={`h-full ${club.users?.length >= (club.maxUsers || 1) ? 'bg-red-500' : 'bg-brand-green'}`}
                                                               style={{ width: `${Math.min(((club.users?.length || 0) / (club.maxUsers || 1)) * 100, 100)}%` }}
                                                        ></div>
                                                 </div>
                                          </div>

                                          <div className="flex justify-end">
                                                 <button onClick={() => setIsTeamModalOpen(true)} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
                                                        <span>+ Nuevo Usuario</span>
                                                 </button>
                                          </div>

                                          <div className="grid gap-3">
                                                 {club.users?.map((u: any) => (
                                                        <div key={u.id} className="flex items-center justify-between p-4 bg-bg-card rounded-xl border border-white/5">
                                                               <div className="flex items-center gap-3">
                                                                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center font-bold text-white border border-white/5">
                                                                             {u.name.charAt(0)}
                                                                      </div>
                                                                      <div>
                                                                             <h4 className="font-bold text-white">{u.name}</h4>
                                                                             <p className="text-xs text-text-grey">{u.email}</p>
                                                                      </div>
                                                                      <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-text-grey uppercase">{u.role}</span>
                                                               </div>
                                                               {u.role !== 'SUPER_ADMIN' && (
                                                                      // Don't allow deleting owner easily/from here if complex
                                                                      <button onClick={() => removeTeam(u.id)} className="text-red-500 font-bold text-sm px-3 py-1 hover:bg-red-500/10 rounded-lg">Eliminar</button>
                                                               )}
                                                        </div>
                                                 ))}
                                          </div>
                                   </div>
                            )}

                            {/* --- ACCOUNT TAB --- */}
                            {activeTab === 'CUENTA' && (
                                   <div className="max-w-xl space-y-6 bg-bg-card p-6 rounded-2xl border border-white/5">
                                          <h3 className="text-xl font-bold text-white">Seguridad de la Cuenta</h3>
                                          <p className="text-zinc-400 text-sm">Actualiza tu contraseña. Asegúrate de usar una contraseña segura que recuerdes.</p>

                                          <form onSubmit={savePassword} className="space-y-4 pt-4">
                                                 <InputGroup label="Nueva Contraseña">
                                                        <input
                                                               type="password"
                                                               className="input-dark w-full"
                                                               value={passwordForm.newPassword}
                                                               onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                                               required
                                                               minLength={6}
                                                        />
                                                 </InputGroup>

                                                 <InputGroup label="Confirmar Contraseña">
                                                        <input
                                                               type="password"
                                                               className="input-dark w-full"
                                                               value={passwordForm.confirmPassword}
                                                               onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                                               required
                                                               minLength={6}
                                                        />
                                                 </InputGroup>

                                                 <div className="pt-4">
                                                        <button type="submit" disabled={isLoading} className="btn-primary w-full bg-red-600 hover:bg-red-700 border-red-500/20">
                                                               {isLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
                                                        </button>
                                                 </div>
                                          </form>
                                   </div>
                            )}

                            {/* --- AUDIT TAB --- */}
                            {activeTab === 'AUDITORIA' && (
                                   <div className="space-y-4">
                                          <div className="bg-bg-card rounded-xl border border-white/5 overflow-hidden">
                                                 <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                                                        <h3 className="font-bold text-white">Registro de Actividad</h3>
                                                        <span className="text-xs text-text-grey">Últimos 50 movimientos</span>
                                                 </div>
                                                 <div className="overflow-x-auto">
                                                        <table className="w-full text-sm text-left">
                                                               <thead className="bg-white/5 text-text-grey uppercase text-xs">
                                                                      <tr>
                                                                             <th className="px-4 py-3">Fecha</th>
                                                                             <th className="px-4 py-3">Usuario</th>
                                                                             <th className="px-4 py-3">Acción</th>
                                                                             <th className="px-4 py-3">Entidad</th>
                                                                             <th className="px-4 py-3">Detalles</th>
                                                                      </tr>
                                                               </thead>
                                                               <tbody className="divide-y divide-white/5 text-zinc-300">
                                                                      {auditLogs && auditLogs.length > 0 ? (
                                                                             auditLogs.map((log: any) => (
                                                                                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                                                                           <td className="px-4 py-3 whitespace-nowrap text-text-grey text-xs">
                                                                                                  {new Date(log.createdAt).toLocaleString()}
                                                                                           </td>
                                                                                           <td className="px-4 py-3 font-medium text-white">
                                                                                                  {log.user?.name || 'Sistema'}
                                                                                           </td>
                                                                                           <td className="px-4 py-3">
                                                                                                  <BadgeAction action={log.action} />
                                                                                           </td>
                                                                                           <td className="px-4 py-3 text-xs uppercase tracking-wider opacity-80">
                                                                                                  {log.entity} <span className="text-zinc-500">#{log.entityId}</span>
                                                                                           </td>
                                                                                           <td className="px-4 py-3 text-xs bg-black/20 font-mono text-zinc-400 max-w-xs truncate" title={log.details}>
                                                                                                  {log.details}
                                                                                           </td>
                                                                                    </tr>
                                                                             ))
                                                                      ) : (
                                                                             <tr>
                                                                                    <td colSpan={5} className="px-4 py-8 text-center text-text-grey">
                                                                                           No hay registros de actividad recientes.
                                                                                    </td>
                                                                             </tr>
                                                                      )}
                                                               </tbody>
                                                        </table>
                                                 </div>
                                          </div>
                                   </div>
                            )}
                     </div>

                     {/* --- MODALS --- */}
                     {/* ... (Modals remain unchanged but included in render loop) ... */}


                     {/* Court Modal */}
                     {isCourtModalOpen && (
                            <Modal title="Editar Cancha" onClose={() => setIsCourtModalOpen(false)}>
                                   <form onSubmit={saveCourt} className="space-y-4">
                                          <InputGroup label="Nombre (Ej: Cancha 1)">
                                                 <input className="input-dark" value={editingCourt?.name || ''} onChange={e => setEditingCourt({ ...editingCourt, name: e.target.value })} required />
                                          </InputGroup>
                                          <InputGroup label="Superficie">
                                                 <select className="input-dark" value={editingCourt?.surface || ''} onChange={e => setEditingCourt({ ...editingCourt, surface: e.target.value })}>
                                                        <option value="Sintético">Sintético</option>
                                                        <option value="Cemento">Cemento</option>
                                                        <option value="Muro">Muro</option>
                                                        <option value="Cristal">Cristal</option>
                                                 </select>
                                          </InputGroup>
                                          <div className="flex gap-2 justify-end pt-4">
                                                 <button type="button" onClick={() => setIsCourtModalOpen(false)} className="px-4 py-2 text-white">Cancelar</button>
                                                 <button type="submit" className="btn-primary px-6 py-2">Guardar</button>
                                          </div>
                                   </form>
                            </Modal>
                     )}

                     {/* Price Rule Modal */}
                     {isRuleModalOpen && (
                            <Modal title="Regla de Precio" onClose={() => setIsRuleModalOpen(false)}>
                                   <form onSubmit={saveRule} className="space-y-4">
                                          <InputGroup label="Nombre descriptivo (Ej: Hora Pico Noche)">
                                                 <input className="input-dark" value={editingRule?.name || ''} onChange={e => setEditingRule({ ...editingRule, name: e.target.value })} required />
                                          </InputGroup>

                                          <div className="grid grid-cols-2 gap-4">
                                                 <InputGroup label="Precio Turno ($)">
                                                        <input type="number" className="input-dark" value={editingRule?.price || ''} onChange={e => setEditingRule({ ...editingRule, price: e.target.value })} required />
                                                 </InputGroup>
                                                 <InputGroup label="Prioridad (Mayor gana)">
                                                        <input type="number" className="input-dark" value={editingRule?.priority || 0} onChange={e => setEditingRule({ ...editingRule, priority: e.target.value })} />
                                                 </InputGroup>
                                          </div>

                                          <div className="grid grid-cols-2 gap-4">
                                                 <InputGroup label="Desde (Fecha - Opcional)">
                                                        <input
                                                               type="date"
                                                               className="input-dark"
                                                               value={editingRule?.startDate ? new Date(editingRule.startDate).toISOString().split('T')[0] : ''}
                                                               onChange={e => setEditingRule({ ...editingRule, startDate: e.target.value ? new Date(e.target.value) : null })}
                                                        />
                                                 </InputGroup>
                                                 <InputGroup label="Hasta (Fecha - Opcional)">
                                                        <input
                                                               type="date"
                                                               className="input-dark"
                                                               value={editingRule?.endDate ? new Date(editingRule.endDate).toISOString().split('T')[0] : ''}
                                                               onChange={e => setEditingRule({ ...editingRule, endDate: e.target.value ? new Date(e.target.value) : null })}
                                                        />
                                                 </InputGroup>
                                          </div>

                                          <div className="grid grid-cols-2 gap-4">
                                                 <InputGroup label="Hora Inicio">
                                                        <input type="time" className="input-dark" value={editingRule?.startTime || ''} onChange={e => setEditingRule({ ...editingRule, startTime: e.target.value })} required />
                                                 </InputGroup>
                                                 <InputGroup label="Hora Fin">
                                                        <input type="time" className="input-dark" value={editingRule?.endTime || ''} onChange={e => setEditingRule({ ...editingRule, endTime: e.target.value })} required />
                                                 </InputGroup>
                                          </div>

                                          <div>
                                                 <label className="text-xs text-text-grey uppercase font-bold mb-2 block">Días de la Semana</label>
                                                 <div className="flex gap-2">
                                                        {DAYS_MAP.map(d => (
                                                               <button
                                                                      key={d.value}
                                                                      type="button"
                                                                      onClick={() => toggleDay(d.value)}
                                                                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${editingRule?.daysOfWeek?.includes(d.value) ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/30 scale-110' : 'bg-bg-dark text-text-grey border border-white/10 hover:border-brand-blue/50'}`}
                                                               >
                                                                      {d.label.charAt(0)}
                                                               </button>
                                                        ))}
                                                 </div>
                                          </div>

                                          <div className="flex gap-2 justify-end pt-4">
                                                 <button type="button" onClick={() => setIsRuleModalOpen(false)} className="px-4 py-2 text-white">Cancelar</button>
                                                 <button type="submit" className="btn-primary px-6 py-2">Guardar</button>
                                          </div>
                                   </form>
                            </Modal>
                     )}


                     {/* Team Modal */}
                     {
                            isTeamModalOpen && (
                                   <Modal title="Nuevo Usuario de Equipo" onClose={() => setIsTeamModalOpen(false)}>
                                          <form onSubmit={saveTeam} className="space-y-4">
                                                 <InputGroup label="Nombre">
                                                        <input
                                                               className="input-dark"
                                                               value={teamForm.name}
                                                               onChange={e => setTeamForm({ ...teamForm, name: e.target.value })}
                                                               required
                                                               placeholder="Ej: Recepcionista Mañana"
                                                        />
                                                 </InputGroup>
                                                 <InputGroup label="Email">
                                                        <input
                                                               type="email"
                                                               className="input-dark"
                                                               value={teamForm.email}
                                                               onChange={e => setTeamForm({ ...teamForm, email: e.target.value })}
                                                               required
                                                               placeholder="usuario@club.com"
                                                        />
                                                 </InputGroup>
                                                 <InputGroup label="Contraseña">
                                                        <input
                                                               type="password"
                                                               className="input-dark"
                                                               value={teamForm.password}
                                                               onChange={e => setTeamForm({ ...teamForm, password: e.target.value })}
                                                               required
                                                               minLength={6}
                                                        />
                                                 </InputGroup>
                                                 <InputGroup label="Rol">
                                                        <select
                                                               className="input-dark"
                                                               value={teamForm.role}
                                                               onChange={e => setTeamForm({ ...teamForm, role: e.target.value })}
                                                        >
                                                               <option value="USER">Usuario (Acceso Limitado)</option>
                                                               <option value="ADMIN">Administrador (Acceso Total)</option>
                                                        </select>
                                                 </InputGroup>
                                                 <div className="flex gap-2 justify-end pt-4">
                                                        <button type="button" onClick={() => setIsTeamModalOpen(false)} className="px-4 py-2 text-white">Cancelar</button>
                                                        <button type="submit" className="btn-primary px-6 py-2">Crear Usuario</button>
                                                 </div>
                                          </form>
                                   </Modal>
                            )
                     }

              </div >
       )
}

// --- SUBCOMPONENTS ---

function TabButton({ children, active, onClick }: any) {
       return (
              <button
                     onClick={onClick}
                     className={`px-4 py-2 text-sm font-bold uppercase tracking-wider relative transition-colors ${active ? 'text-brand-blue' : 'text-text-grey hover:text-white'}`}
              >
                     {children}
                     {active && <div className="absolute bottom-[-5px] left-0 w-full h-0.5 bg-brand-blue shadow-[0_0_10px_rgba(0,120,240,0.5)]"></div>}
              </button>
       )
}

function InputGroup({ label, children }: any) {
       return (
              <div className="space-y-1">
                     <label className="text-xs text-text-grey uppercase font-bold">{label}</label>
                     {children}
              </div>
       )
}

function Modal({ title, children, onClose }: any) {
       return (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
                     <div className="bg-bg-card border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
                            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-bg-surface">
                                   <h3 className="text-lg font-bold text-white">{title}</h3>
                                   <button onClick={onClose}>✕</button>
                            </div>
                            <div className="p-6">
                                   {children}
                            </div>
                     </div>
              </div>
       )
}

function BadgeAction({ action }: { action: string }) {
       const colors: Record<string, string> = {
              CREATE: 'bg-green-500/10 text-green-500',
              UPDATE: 'bg-blue-500/10 text-blue-500',
              DELETE: 'bg-red-500/10 text-red-500',
              LOGIN: 'bg-purple-500/10 text-purple-500',
       }
       return (
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${colors[action] || 'bg-white/10 text-white'}`}>
                     {action}
              </span>
       )
}
