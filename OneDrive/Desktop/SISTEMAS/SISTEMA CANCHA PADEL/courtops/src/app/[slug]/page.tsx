import { notFound } from 'next/navigation'
import prisma from '@/lib/db'
import { startOfDay, addDays, format } from 'date-fns'
import { es } from 'date-fns/locale'
import PublicBookingInterface from '@/components/public/PublicBookingInterface'

export default async function PublicClubPage({ params }: { params: Promise<{ slug: string }> }) {
       const { slug } = await params

       // 1. Fetch Club by Slug
       const club = await prisma.club.findUnique({
              where: { slug: slug },
              include: {
                     courts: {
                            orderBy: { sortOrder: 'asc' }
                     },
                     priceRules: true
              }
       })

       // 2. Handle 404
       if (!club) {
              notFound()
       }

       // 3. Render Public Interface
       return (
              <div className="min-h-screen bg-bg-dark text-text-white font-sans">
                     <PublicBookingInterface club={club} />
              </div>
       )
}
