import { getClientDetails } from '@/actions/clients'
import ClientDetailView from './ClientDetailView'
import Link from 'next/link'

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
       const resolvedParams = await params
       const client = await getClientDetails(Number(resolvedParams.id))

       return (
              <div>
                     <div className="p-4 lg:px-8">
                            <Link href="/clientes" className="text-text-grey hover:text-white mb-4 inline-block text-sm transition-colors">← Volver a Clientes</Link>
                     </div>
                     <ClientDetailView client={client} />
              </div>
       )
}
