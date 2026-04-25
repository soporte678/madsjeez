import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// 1. Configuramos el Pool de conexiones nativo de Postgres
const connectionString = `${process.env.DATABASE_URL}`
const pool = new Pool({ connectionString })

// 2. Creamos el adaptador de Prisma
const adapter = new PrismaPg(pool)

// 3. Inicializamos el cliente EXCLUSIVAMENTE con el adapter
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
