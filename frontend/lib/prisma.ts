import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  try {
    return new PrismaClient();
  } catch (err) {
    console.warn("⚠️ PrismaClient gagal diinisialisasi, gunakan fallback/backend API:", err);
    return {} as PrismaClient;
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
