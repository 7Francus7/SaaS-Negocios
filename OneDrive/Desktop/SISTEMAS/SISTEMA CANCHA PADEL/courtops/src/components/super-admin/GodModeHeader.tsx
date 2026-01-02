'use client'

import { signOut } from 'next-auth/react'

export default function GodModeHeader() {
       return (
              <div className="border-b border-red-900/30 bg-red-900/10 p-4">
                     <div className="max-w-7xl mx-auto flex items-center justify-between">
                            <h1 className="text-xl font-bold text-red-500 tracking-wider">
                                   ⚡ GOD MODE
                                   <span className="text-white/40 text-sm font-normal ml-2">Panel de Control Global</span>
                            </h1>
                            <button
                                   onClick={() => signOut({ callbackUrl: '/login' })}
                                   className="text-xs text-white/50 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded transition-colors flex items-center gap-1"
                            >
                                   ← Cerrar Sesión
                            </button>
                     </div>
              </div>
       )
}
