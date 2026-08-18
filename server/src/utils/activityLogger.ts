import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

interface LogActivityInput {
  companyId?: number | null;
  module: string;
  referenceId: number;
  action: string;
  description?: string;
  performedById?: number | null;
  metadata?: Prisma.InputJsonValue;
}

export async function logActivity(input: LogActivityInput): Promise<void> {
  await prisma.activityLog.create({
    data: {
      companyId: input.companyId ?? null,
      module: input.module,
      referenceId: input.referenceId,
      action: input.action,
      description: input.description,
      performedById: input.performedById ?? null,
      metadata: input.metadata,
    },
  });
}
