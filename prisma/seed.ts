
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
       const password = await bcrypt.hash('password123', 10)

       // Create Store
       const store = await prisma.store.create({
              data: {
                     name: 'Mi Negocio Demo',
                     slug: 'demo-store',
                     isActive: true,
                     hasCompletedOnboarding: false,
              },
       })

       // Create User
       const user = await prisma.user.create({
              data: {
                     email: 'admin@demo.com',
                     password,
                     role: 'OWNER',
                     storeId: store.id,
              },
       })

       // Create Default Category
       const category = await prisma.category.create({
              data: {
                     name: 'General',
                     storeId: store.id,
              },
       })

       // Create Default Product
       await prisma.product.create({
              data: {
                     name: 'Producto Ejemplo',
                     description: 'Producto de prueba',
                     active: true,
                     storeId: store.id,
                     categoryId: category.id,
                     variants: {
                            create: {
                                   variantName: 'Unidad',
                                   costPrice: 100,
                                   salePrice: 150,
                                   stockQuantity: 50,
                                   storeId: store.id,
                            },
                     },
              },
       })

       console.log('Seeding completed.')
       console.log('Store ID:', store.id)
       console.log('User Email: admin@demo.com')
       console.log('Password: password123')
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
