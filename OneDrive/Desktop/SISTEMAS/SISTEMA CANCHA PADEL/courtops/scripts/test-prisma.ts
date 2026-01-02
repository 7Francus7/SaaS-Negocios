
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
       console.log('Testing Prisma Client...')
       try {
              const club = await prisma.club.findFirst()
              console.log('Club found:', club?.name)
              if (club) {
                     console.log('Club ID:', club.id)
                     const courts = await prisma.court.findMany({ where: { clubId: club.id } })
                     console.log('Courts found:', courts.length)
              }
       } catch (e: any) {
              console.error('Prisma Error:', e.message)
       } finally {
              await prisma.$disconnect()
       }
}

main()
