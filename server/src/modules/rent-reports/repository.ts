import { Prisma, StockOutStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';

/**
 * Queries that exist only for the rent reports.
 *
 * Everything the reports can express with an existing module's filters is read through that
 * module's repository instead (see service.ts) — only the shapes no other screen needs live here.
 */

const personSummarySelect = {
  id: true,
  name: true,
  phone: true,
  city: true,
  status: true,
} satisfies Prisma.RentalPersonSelect;

export type PersonSummaryRecord = Prisma.RentalPersonGetPayload<{ select: typeof personSummarySelect }>;

/**
 * Every person who either has rent history or is still active — the person-wise report's row set
 * (stock.md §24, §27). An inactive person with no transactions has nothing to report on, so they
 * drop out; an inactive person who still owes money does not.
 */
export function listPersonsForSummary(companyId: string, search: string | undefined, take: number) {
  return prisma.rentalPerson.findMany({
    where: {
      companyId,
      deletedAt: null,
      // Two independent disjunctions — the search and the "has history or is active" rule — so they
      // go in an AND array. Spreading two `OR` keys into one object would drop the first.
      AND: [
        { OR: [{ status: 'ACTIVE' }, { stockOuts: { some: { deletedAt: null, status: StockOutStatus.ACTIVE } } }] },
        ...(search
          ? [
              {
                OR: [
                  { name: { contains: search } },
                  { phone: { contains: search } },
                  { city: { contains: search } },
                ],
              },
            ]
          : []),
      ],
    },
    select: personSummarySelect,
    orderBy: { name: 'asc' },
    take,
  });
}
