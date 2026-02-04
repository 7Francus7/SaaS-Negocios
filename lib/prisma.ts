import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
       const url = process.env.DATABASE_URL;

       if (url && url.startsWith('neondb://')) {
              process.env.DATABASE_URL = url.replace('neondb://', 'postgresql://');
       }

       return new PrismaClient()
}

declare global {
       var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
