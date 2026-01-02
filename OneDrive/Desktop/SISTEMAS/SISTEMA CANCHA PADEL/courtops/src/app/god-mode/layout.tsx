
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

import GodModeHeader from "@/components/super-admin/GodModeHeader"

export default async function SuperAdminLayout({
       children,
}: {
       children: React.ReactNode
}) {
       const session = await getServerSession(authOptions)

       // HARDCODED SECURITY CHECK
       // Solo tu email específico puede ver esto. 
       // En producción podrías usar una env variable SUPER_ADMIN_EMAIL
       const SUPER_ADMINS = ['admin@courtops.com', 'dello@example.com', 'dellorsif@gmail.com'] // Agregá tu email real aquí si querés

       if (!session || !session.user || !session.user.email || !SUPER_ADMINS.includes(session.user.email)) {
              console.log("Acceso denegado a SuperAdmin:", session?.user?.email)
              redirect('/')
       }

       return (
              <div className="min-h-screen bg-black text-white">
                     <GodModeHeader />
                     <div className="max-w-7xl mx-auto p-4 md:p-8">
                            {children}
                     </div>
              </div>
       )
}
