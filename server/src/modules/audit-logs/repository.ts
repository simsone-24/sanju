import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ListAuditLogsParams } from './types';

// Only what the page shows. `metadata` is the structured detail some entries carry (e.g. the from/to
// of a status change); the performer is reduced to a name — never the whole user row.
const auditLogSelect = {
  id: true,
  module: true,
  action: true,
  referenceId: true,
  description: true,
  metadata: true,
  performedAt: true,
  performedBy: { select: { id: true, fullName: true, username: true } },
} satisfies Prisma.ActivityLogSelect;

export async function listAuditLogs(params: ListAuditLogsParams) {
  const where: Prisma.ActivityLogWhereInput = {
    companyId: params.companyId,
    ...(params.module ? { module: params.module } : {}),
    ...(params.action ? { action: params.action } : {}),
    ...(params.userId ? { performedById: params.userId } : {}),
    ...(params.search ? { description: { contains: params.search } } : {}),
    ...(params.dateFrom || params.dateTo
      ? {
          performedAt: {
            ...(params.dateFrom ? { gte: params.dateFrom } : {}),
            ...(params.dateTo ? { lte: params.dateTo } : {}),
          },
        }
      : {}),
  };

  const [records, totalRecords] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      select: auditLogSelect,
      // id breaks ties so two entries written in the same instant never swap places between pages.
      orderBy: [{ performedAt: 'desc' }, { id: 'desc' }],
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.activityLog.count({ where }),
  ]);

  return { records, totalRecords };
}

/** The modules and actions that actually appear in this company's log, for the filter dropdowns. */
export async function listFilterOptions(companyId: number) {
  const [modules, actions] = await Promise.all([
    prisma.activityLog.groupBy({ by: ['module'], where: { companyId }, orderBy: { module: 'asc' } }),
    prisma.activityLog.groupBy({ by: ['action'], where: { companyId }, orderBy: { action: 'asc' } }),
  ]);

  return {
    modules: modules.map((entry) => entry.module),
    actions: actions.map((entry) => entry.action),
  };
}
