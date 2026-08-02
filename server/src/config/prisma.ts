import { Prisma, PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export type PrismaClientOrTx = PrismaClient | Prisma.TransactionClient;
