import { config as dotenvConfig } from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenvConfig();

if (!process.env.DATABASE_URL) {
  throw new Error('Missing DATABASE_URL environment variable. Please add it to .env.');
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
