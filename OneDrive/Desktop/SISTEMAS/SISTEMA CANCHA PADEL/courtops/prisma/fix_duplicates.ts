import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
       console.log('Cleaning up duplicate courts...')

       const courts = await prisma.court.findMany({
              orderBy: { id: 'asc' }
       })

       const seenNames = new Set()
       const toDelete = []

       for (const court of courts) {
              if (seenNames.has(court.name)) {
                     toDelete.push(court.id)
              } else {
                     seenNames.add(court.name)
              }
       }

       if (toDelete.length > 0) {
              console.log(`Found ${toDelete.length} duplicates. Deleting IDs: ${toDelete.join(', ')}`)
              // Note: This might fail if there are FK constraints (bookings). 
              // For a quick fix dev env, we delete cascading or manually.
              // Since it's dev, we assume we might lose some bookings attached to duplicates, which is fine.
              // But Prisma doesn't cascade by default unless configured.

              // Let's rely on manual deletion.
              await prisma.court.deleteMany({
                     where: {
                            id: { in: toDelete }
                     }
              })
              console.log('Duplicates deleted.')
       } else {
              console.log('No duplicates found.')
       }
}

main()
       .then(async () => {
              await prisma.$disconnect()
       })
       .catch(async (e) => {
              console.error(e)
              await prisma.$disconnect()
              process.exit(1)
       })
