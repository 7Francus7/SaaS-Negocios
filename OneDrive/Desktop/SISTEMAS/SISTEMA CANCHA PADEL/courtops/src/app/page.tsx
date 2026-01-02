
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import DashboardClient from "@/components/DashboardClient"
import prisma from "@/lib/db"

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    redirect('/login')
  }

  // SUPER ADMIN REDIRECT
  // Si es el usuario maestro, lo mandamos directo al panel de control
  if (session.user.email === 'dellorsif@gmail.com' || session.user.email === 'admin@courtops.com') {
    redirect('/god-mode')
  }

  if (!session.user.clubId) {
    return <div>Error: Usuario sin club asignado.</div>
  }

  // Fetch fresh club data to show updated name & features
  const club = await prisma.club.findUnique({
    where: { id: session.user.clubId },
    select: {
      name: true,
      logoUrl: true,
      slug: true,
      hasKiosco: true, // Fetch Feature Flag
      hasAdvancedReports: true
    }
  })

  // Fallback if something weird happens and club is not found, though auth checks prevent this mostly
  const clubName = club?.name || 'Club Deportivo'

  const features = {
    hasKiosco: club?.hasKiosco ?? true,
    hasAdvancedReports: club?.hasAdvancedReports ?? true
  }

  return <DashboardClient user={session.user} clubName={clubName} logoUrl={club?.logoUrl} slug={club?.slug} features={features} />
}
