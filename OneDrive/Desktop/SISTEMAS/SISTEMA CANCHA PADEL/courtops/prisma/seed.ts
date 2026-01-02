import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
       console.log('Seeding database...')

       // Hash password
       const hashedPassword = await hash('securepassword123', 12)

       // 1. Create Tenant (Club)
       const club = await prisma.club.create({
              data: {
                     name: 'CourtOps Club',
                     slug: 'courtops-demo',
                     logoUrl: 'https://placehold.co/100x100?text=CO',
                     openTime: '14:00',
                     closeTime: '00:30',
                     slotDuration: 90,
                     cancelHours: 6,

                     // Default Admin User
                     users: {
                            create: {
                                   email: 'admin@courtops.com',
                                   name: 'Admin Demo',
                                   password: hashedPassword,
                                   role: 'OWNER'
                            }
                     },

                     // Default Courts
                     courts: {
                            create: [
                                   { name: 'Cancha 1 (Muro)', surface: 'Cesped', isIndoor: true, sortOrder: 1 },
                                   { name: 'Cancha 2 (Blindex)', surface: 'Cesped', isIndoor: true, sortOrder: 2 }
                            ]
                     },

                     // Default Price Rules (Replacing Seasons)
                     priceRules: {
                            create: [
                                   {
                                          name: 'Base - Tarde',
                                          startTime: '14:00',
                                          endTime: '18:00',
                                          price: 8000,
                                          priority: 1
                                   },
                                   {
                                          name: 'Prime Time - Noche',
                                          startTime: '18:00',
                                          endTime: '00:30',
                                          price: 12000,
                                          priority: 2
                                   }
                            ]
                     },

                     // Initial Cash Register
                     cashRegisters: {
                            create: {
                                   status: 'OPEN',
                                   startAmount: 5000
                            }
                     }
              }
       })

       console.log(`Club created with ID: ${club.id}`)
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
