
import prisma from './src/lib/db'

async function checkUser() {
       const user = await prisma.user.findUnique({
              where: { email: 'admin@courtops.com' }
       })
       console.log('User found:', user)
}

checkUser()
       .catch(e => console.error(e))
       .finally(() => prisma.$disconnect())
