import { getPublicClubBySlug } from '@/actions/public-booking'
import PublicBookingWizard from '@/components/public/PublicBookingWizard'
import { notFound } from 'next/navigation'

export default async function PublicSlugPage({ params }: { params: Promise<{ slug: string }> }) {
       const resolvedParams = await params
       const club = await getPublicClubBySlug(resolvedParams.slug)

       if (!club) {
              notFound()
       }

       const now = new Date().toISOString()

       return <PublicBookingWizard club={club} initialDateStr={now} />
}
