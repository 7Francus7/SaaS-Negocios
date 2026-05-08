import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { Pool } from '@neondatabase/serverless'

function createPrismaClient() {
       let url = process.env.DATABASE_URL ?? ''
       if (url.startsWith('neondb://')) {
              url = url.replace('neondb://', 'postgresql://')
       }
       const pool = new Pool({ connectionString: url })
       const adapter = new PrismaNeon(pool)
       return new PrismaClient({ adapter })
}

declare global {
       var prismaGlobal: undefined | ReturnType<typeof createPrismaClient>
}

const prisma = globalThis.prismaGlobal ?? createPrismaClient()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
