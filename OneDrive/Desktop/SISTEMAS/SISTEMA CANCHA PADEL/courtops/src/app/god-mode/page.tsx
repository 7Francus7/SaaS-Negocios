import { getAllClubs } from '@/actions/super-admin'
import CreateClubForm from '@/components/super-admin/CreateClubForm'
import ClubList from '@/components/super-admin/ClubList'

export default async function GodModePage() {
       const clubs = await getAllClubs()

       return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     {/* Columna Izquierda: Formulario de Alta */}
                     <div className="space-y-6">
                            <div className="bg-zinc-900 rounded-xl border border-white/10 p-6 shadow-2xl">
                                   <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                          <span className="text-brand-green text-3xl">+</span> Nuevo Club
                                   </h2>
                                   <p className="text-zinc-400 mb-6 text-sm">
                                          Esto generará todo el entorno tenant: Club, Canchas (2), Usuario Admin y Precios Base.
                                   </p>

                                   <CreateClubForm />
                            </div>
                     </div>

                     {/* Columna Derecha: Listado de Clubes */}
                     <div className="space-y-6">
                            <h2 className="text-xl font-bold text-white/80 uppercase tracking-widest pl-1">Clubes Activos ({clubs.length})</h2>
                            <ClubList clubs={clubs} />
                     </div>
              </div>
       )
}
