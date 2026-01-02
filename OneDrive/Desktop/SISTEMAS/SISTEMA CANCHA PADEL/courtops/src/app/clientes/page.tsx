import { getClients } from '@/actions/clients'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default async function ClientsPage({ searchParams }: { searchParams: { q?: string } }) {
       const query = searchParams.q || ''
       const clients = await getClients(query)

       return (
              <div className="min-h-screen bg-bg-dark text-text-white p-4 lg:p-8 font-sans pb-20">
                     <div className="max-w-5xl mx-auto space-y-6">

                            {/* Header */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                   <div>
                                          <Link href="/" className="text-text-grey hover:text-white mb-2 inline-block text-sm">← Volver al Dashboard</Link>
                                          <h1 className="text-3xl font-bold tracking-tight text-white">Clientes</h1>
                                          <p className="text-text-grey text-sm">Gestión de cartera y cuentas corrientes</p>
                                   </div>

                                   <div className="flex gap-2">
                                          {/* Future: Add Client Button */}
                                   </div>
                            </div>

                            {/* Search */}
                            <div className="bg-bg-card p-4 rounded-2xl border border-white/5 shadow-lg">
                                   <form className="relative">
                                          <span className="absolute left-4 top-3.5 text-text-grey">🔍</span>
                                          <input
                                                 name="q"
                                                 defaultValue={query}
                                                 placeholder="Buscar por nombre, teléfono..."
                                                 className="w-full bg-bg-surface border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-brand-blue outline-none transition-all placeholder:text-white/20"
                                          />
                                          <button type="submit" className="hidden"></button>
                                   </form>
                            </div>

                            {/* List */}
                            <div className="grid gap-3">
                                   {clients.length === 0 ? (
                                          <div className="text-center py-12 text-text-grey opacity-50">
                                                 No se encontraron clientes.
                                          </div>
                                   ) : (
                                          clients.map(client => (
                                                 <Link
                                                        key={client.id}
                                                        href={`/clientes/${client.id}`}
                                                        className="block bg-bg-card hover:bg-white/5 border border-white/5 rounded-xl p-4 transition-all group active:scale-[0.99]"
                                                 >
                                                        <div className="flex justify-between items-center">
                                                               <div className="flex items-center gap-4">
                                                                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-blue/20 to-brand-blue/5 flex items-center justify-center text-brand-blue font-bold text-lg">
                                                                             {client.name.charAt(0).toUpperCase()}
                                                                      </div>
                                                                      <div>
                                                                             <h3 className="font-bold text-white group-hover:text-brand-blue transition-colors">{client.name}</h3>
                                                                             <p className="text-xs text-text-grey">{client.phone} {client.email ? `• ${client.email}` : ''}</p>
                                                                      </div>
                                                               </div>

                                                               <div className="text-right">
                                                                      <p className="text-[10px] text-text-grey uppercase font-bold tracking-wider mb-0.5">Saldo</p>
                                                                      <p className={cn(
                                                                             "font-mono font-bold text-lg",
                                                                             client.balance < 0 ? "text-red-400" : "text-brand-green"
                                                                      )}>
                                                                             {client.balance < 0 ? '-' : ''} ${Math.abs(client.balance).toLocaleString('es-AR')}
                                                                      </p>
                                                               </div>
                                                        </div>
                                                 </Link>
                                          ))
                                   )}
                            </div>

                     </div>
              </div>
       )
}
