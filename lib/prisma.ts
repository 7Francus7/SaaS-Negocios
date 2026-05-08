import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
       let url = process.env.DATABASE_URL ?? ''
       if (url.startsWith('neondb://')) {
              url = url.replace('neondb://', 'postgresql://')
       }
       return new PrismaClient({
              datasources: { db: { url } }
       })
}

declare global {
       var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
