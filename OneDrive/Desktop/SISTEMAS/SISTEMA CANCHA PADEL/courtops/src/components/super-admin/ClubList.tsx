'use client'

import { useState } from 'react'
import { deleteClub, updateClub, updateClubAdminPassword } from '@/actions/super-admin'
import { useRouter } from 'next/navigation'

type Club = {
       id: string
       name: string
       slug: string
       plan?: string
       _count: {
              courts: number
              users: number
              bookings: number
       }
       users: { email: string }[]
}

export default function ClubList({ clubs }: { clubs: Club[] }) {
       const [editingClubId, setEditingClubId] = useState<string | null>(null)
       const [editForm, setEditForm] = useState({ name: '', slug: '', plan: 'BASIC' })

       // Password Change State
       const [changePasswordId, setChangePasswordId] = useState<string | null>(null)
       const [passwordForm, setPasswordForm] = useState({ newPassword: '' })

       const [loadingId, setLoadingId] = useState<string | null>(null)
       const router = useRouter()

       function handleEditClick(club: Club) {
              setEditingClubId(club.id)
              setEditForm({ name: club.name, slug: club.slug, plan: club.plan || 'BASIC' })
              setChangePasswordId(null)
       }

       function handlePasswordClick(club: Club) {
              setChangePasswordId(club.id)
              setPasswordForm({ newPassword: '' })
              setEditingClubId(null)
       }

       async function handleSave(clubId: string) {
              setLoadingId(clubId)
              const formData = new FormData()
              formData.append('clubId', clubId)
              formData.append('name', editForm.name)
              formData.append('slug', editForm.slug)
              formData.append('plan', editForm.plan)

              const res = await updateClub(formData)
              if (res.success) {
                     setEditingClubId(null)
                     router.refresh()
              } else {
                     alert('Error: ' + res.error)
              }
              setLoadingId(null)
       }

       async function handlePasswordSave(clubId: string) {
              setLoadingId(clubId)
              const formData = new FormData()
              formData.append('clubId', clubId)
              formData.append('newPassword', passwordForm.newPassword)

              const res = await updateClubAdminPassword(formData)
              if (res.success) {
                     setChangePasswordId(null)
                     alert('Contraseña actualizada con éxito')
                     router.refresh()
              } else {
                     alert('Error: ' + res.error)
              }
              setLoadingId(null)
       }

       async function handleDelete(clubId: string) {
              if (!confirm('¿Seguro que quieres eliminar este club? Se borrarán todas sus canchas, usuarios y reservas. ESTA ACCIÓN ES IRREVERSIBLE.')) return

              setLoadingId(clubId)
              const formData = new FormData()
              formData.append('clubId', clubId)

              const res = await deleteClub(formData)
              if (res.success) {
                     router.refresh()
              } else {
                     alert('Error: ' + res.error)
              }
              setLoadingId(null)
       }

       function getPlanColor(plan: string) {
              switch (plan) {
                     case 'PRO': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                     case 'PREMIUM': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                     case 'ENTERPRISE': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                     default: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
              }
       }

       return (
              <div className="grid gap-4">
                     {clubs.map(club => (
                            <div key={club.id} className="bg-zinc-900/50 hover:bg-zinc-900 transition-colors border border-white/5 rounded-xl p-5 flex flex-col gap-4 group">
                                   <div className="flex justify-between items-start">
                                          <div className="flex-1">
                                                 {editingClubId === club.id ? (
                                                        <div className="space-y-2 mb-2">
                                                               <input
                                                                      className="w-full bg-black border border-white/20 rounded px-2 py-1 text-white font-bold"
                                                                      value={editForm.name}
                                                                      onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                                                      placeholder="Nombre del Club"
                                                               />
                                                               <input
                                                                      className="w-full bg-black border border-white/20 rounded px-2 py-1 text-zinc-400 text-sm font-mono"
                                                                      value={editForm.slug}
                                                                      onChange={e => setEditForm({ ...editForm, slug: e.target.value })}
                                                                      placeholder="slug-url"
                                                               />
                                                               <select
                                                                      className="w-full bg-black border border-white/20 rounded px-2 py-1 text-white text-sm"
                                                                      value={editForm.plan}
                                                                      onChange={e => setEditForm({ ...editForm, plan: e.target.value })}
                                                               >
                                                                      <option value="BASIC">BASIC</option>
                                                                      <option value="PRO">PRO</option>
                                                                      <option value="PREMIUM">PREMIUM</option>
                                                                      <option value="ENTERPRISE">ENTERPRISE</option>
                                                               </select>
                                                        </div>
                                                 ) : changePasswordId === club.id ? (
                                                        <div className="space-y-2 mb-2">
                                                               <h4 className="text-white font-bold">Cambiar Contraseña Admin</h4>
                                                               <p className="text-xs text-zinc-400">Admin: {club.users[0]?.email || 'No asignado'}</p>
                                                               <input
                                                                      className="w-full bg-black border border-brand-green/50 rounded px-2 py-1 text-white"
                                                                      value={passwordForm.newPassword}
                                                                      onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                                                      placeholder="Nueva contraseña"
                                                                      type="text" // Visible typing usually better for admins resetting others
                                                               />
                                                        </div>
                                                 ) : (
                                                        <>
                                                               <div className="flex items-center gap-2">
                                                                      <h3 className="font-bold text-lg text-white group-hover:text-brand-blue transition-colors">
                                                                             {club.name}
                                                                      </h3>
                                                                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${getPlanColor(club.plan || 'BASIC')}`}>
                                                                             {club.plan || 'BASIC'}
                                                                      </span>
                                                               </div>
                                                               <div className="text-xs text-zinc-500 font-mono mt-1 select-all flex items-center gap-2">
                                                                      ID: {club.id}
                                                                      <span className="bg-white/5 px-1 rounded text-zinc-600">/{club.slug}</span>
                                                               </div>
                                                        </>
                                                 )}
                                          </div>

                                          <div className="flex items-center gap-2">
                                                 {editingClubId === club.id ? (
                                                        <>
                                                               <button
                                                                      onClick={() => handleSave(club.id)}
                                                                      disabled={!!loadingId}
                                                                      className="bg-brand-green text-black px-3 py-1 rounded text-xs font-bold hover:bg-brand-green-variant transition-colors"
                                                               >
                                                                      {loadingId === club.id ? '...' : 'Guardar'}
                                                               </button>
                                                               <button
                                                                      onClick={() => setEditingClubId(null)}
                                                                      disabled={!!loadingId}
                                                                      className="bg-white/10 text-white px-3 py-1 rounded text-xs font-bold hover:bg-white/20 transition-colors"
                                                               >
                                                                      Cancelar
                                                               </button>
                                                        </>
                                                 ) : changePasswordId === club.id ? (
                                                        <>
                                                               <button
                                                                      onClick={() => handlePasswordSave(club.id)}
                                                                      disabled={!!loadingId}
                                                                      className="bg-brand-green text-black px-3 py-1 rounded text-xs font-bold hover:bg-brand-green-variant transition-colors"
                                                               >
                                                                      {loadingId === club.id ? '...' : 'Actualizar'}
                                                               </button>
                                                               <button
                                                                      onClick={() => setChangePasswordId(null)}
                                                                      disabled={!!loadingId}
                                                                      className="bg-white/10 text-white px-3 py-1 rounded text-xs font-bold hover:bg-white/20 transition-colors"
                                                               >
                                                                      Cancelar
                                                               </button>
                                                        </>
                                                 ) : (
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                               <button
                                                                      onClick={() => handleEditClick(club)}
                                                                      className="p-2 hover:bg-white/10 rounded text-lg"
                                                                      title="Editar Info"
                                                               >
                                                                      ✏️
                                                               </button>
                                                               <button
                                                                      onClick={() => handlePasswordClick(club)}
                                                                      className="p-2 hover:bg-white/10 rounded text-lg"
                                                                      title="Cambiar Contraseña Admin"
                                                               >
                                                                      🔑
                                                               </button>
                                                               <button
                                                                      onClick={() => handleDelete(club.id)}
                                                                      className="p-2 hover:bg-red-500/20 text-red-500 rounded text-lg"
                                                                      title="Eliminar"
                                                               >
                                                                      🗑️
                                                               </button>
                                                        </div>
                                                 )}
                                          </div>
                                   </div>

                                   {!editingClubId && !changePasswordId && (
                                          <div className="flex gap-4 text-sm text-zinc-400 border-t border-white/5 pt-3">
                                                 <div className="flex flex-col items-center">
                                                        <span className="font-bold text-white">{club._count.courts}</span>
                                                        <span className="text-[10px] uppercase">Canchas</span>
                                                 </div>
                                                 <div className="flex flex-col items-center border-l border-white/10 pl-4">
                                                        <span className="font-bold text-white">{club._count.users}</span>
                                                        <span className="text-[10px] uppercase">Usuarios</span>
                                                 </div>
                                                 <div className="flex flex-col items-center border-l border-white/10 pl-4">
                                                        <span className="font-bold text-brand-green">{club._count.bookings}</span>
                                                        <span className="text-[10px] uppercase">Reservas</span>
                                                 </div>
                                          </div>
                                   )}
                            </div>
                     ))}
              </div>
       )
}
