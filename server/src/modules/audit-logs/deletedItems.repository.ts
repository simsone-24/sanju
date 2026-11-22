import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { DeletedItemRow, DeletedItemType, DeletedItemTypeSummary, ListDeletedItemsParams } from './types';

// ---------------------------------------------------------------------------------------------
// Who deleted a record
//
// A delete writes a DELETE entry to the activity log naming the person, keyed (module, referenceId).
// A record taken by a cascade — an order with its enquiry, a payment with its order — has no entry of
// its own, so it falls back to its parent's: the person who deleted the parent deleted it too.
// ---------------------------------------------------------------------------------------------

export interface LogKey {
  module: string;
  referenceId: number;
}

/** A parent whose own deletion would explain this record's, with how to name it on screen. */
export interface ParentKey extends LogKey {
  label: string;
}

/** A row as the adapters read it, before the deleter is looked up. */
type RawRow = Omit<DeletedItemRow, 'deletedBy' | 'deletedWith'> & {
  own: LogKey;
  parents: ParentKey[];
};

const keyOf = (module: string, referenceId: number) => `${module}:${referenceId}`;

/** Whose deletion a record is attributed to: its own entry, else the parent's that took it. */
export interface DeleterAttribution {
  deletedBy: { id: number; fullName: string } | null;
  deletedWith: string | null;
}

/**
 * Looks up who deleted each subject. One query for all of them; the answer for a subject is its own
 * DELETE entry if it has one, otherwise the first of its parents that does.
 */
export async function resolveDeleters(
  companyId: number,
  subjects: { own: LogKey; parents: ParentKey[] }[],
): Promise<DeleterAttribution[]> {
  const wanted = new Map<string, LogKey>();
  for (const subject of subjects) {
    for (const key of [subject.own, ...subject.parents]) wanted.set(keyOf(key.module, key.referenceId), key);
  }

  const entries = wanted.size
    ? await prisma.activityLog.findMany({
        where: {
          companyId,
          action: 'DELETE',
          OR: [...wanted.values()].map((key) => ({ module: key.module, referenceId: key.referenceId })),
        },
        // Newest first, so the first entry seen for a record is its most recent deletion.
        orderBy: [{ performedAt: 'desc' }, { id: 'desc' }],
        select: { module: true, referenceId: true, performedBy: { select: { id: true, fullName: true } } },
      })
    : [];

  const deleterByKey = new Map<string, { id: number; fullName: string } | null>();
  for (const entry of entries) {
    const key = keyOf(entry.module, entry.referenceId);
    if (!deleterByKey.has(key)) deleterByKey.set(key, entry.performedBy);
  }

  return subjects.map(({ own, parents }) => {
    const ownDeleter = deleterByKey.get(keyOf(own.module, own.referenceId));
    if (ownDeleter) return { deletedBy: ownDeleter, deletedWith: null };

    for (const parent of parents) {
      const parentDeleter = deleterByKey.get(keyOf(parent.module, parent.referenceId));
      if (parentDeleter) return { deletedBy: parentDeleter, deletedWith: parent.label };
    }
    return { deletedBy: null, deletedWith: null };
  });
}

async function attachDeleters(companyId: number, rows: RawRow[]): Promise<DeletedItemRow[]> {
  const attributions = await resolveDeleters(companyId, rows);
  return rows.map(({ own, parents, ...row }, index) => ({ ...row, ...attributions[index] }));
}

// ---------------------------------------------------------------------------------------------
// One adapter per kind. Each reads only what its row needs and maps it to the common shape.
// ---------------------------------------------------------------------------------------------

const DELETED = { not: null } as const;

interface Page {
  skip: number;
  take: number;
}

type Adapter = (params: ListDeletedItemsParams, page: Page) => Promise<{ rows: RawRow[]; total: number }>;

const decimal = (value: Prisma.Decimal): string => value.toString();

const enquiries: Adapter = async ({ companyId, search }, page) => {
  const where: Prisma.EnquiryWhereInput = {
    companyId,
    deletedAt: DELETED,
    ...(search
      ? {
          OR: [
            { enquiryNumber: { contains: search } },
            { prospectName: { contains: search } },
            { eventName: { contains: search } },
            { customer: { customerName: { contains: search } } },
          ],
        }
      : {}),
  };
  const [records, total] = await Promise.all([
    prisma.enquiry.findMany({
      where,
      orderBy: [{ deletedAt: 'desc' }, { id: 'desc' }],
      ...page,
      select: {
        id: true,
        enquiryNumber: true,
        prospectName: true,
        eventName: true,
        status: true,
        deletedAt: true,
        customer: { select: { customerName: true } },
      },
    }),
    prisma.enquiry.count({ where }),
  ]);
  return {
    total,
    rows: records.map((record) => ({
      id: record.id,
      reference: record.enquiryNumber,
      title: record.customer?.customerName ?? record.prospectName ?? '—',
      detail: record.eventName,
      amount: null,
      status: record.status,
      deletedAt: record.deletedAt as Date,
      own: { module: 'ENQUIRIES', referenceId: record.id },
      parents: [],
    })),
  };
};

const quotations: Adapter = async ({ companyId, search }, page) => {
  const where: Prisma.QuotationWhereInput = {
    companyId,
    deletedAt: DELETED,
    ...(search
      ? { OR: [{ quotationNumber: { contains: search } }, { customer: { customerName: { contains: search } } }] }
      : {}),
  };
  const [records, total] = await Promise.all([
    prisma.quotation.findMany({
      where,
      orderBy: [{ deletedAt: 'desc' }, { id: 'desc' }],
      ...page,
      select: {
        id: true,
        quotationNumber: true,
        totalAmount: true,
        status: true,
        deletedAt: true,
        customer: { select: { customerName: true } },
        // A quotation raised for a prospect has no customer of its own yet — the enquiry names them.
        enquiry: {
          select: {
            id: true,
            enquiryNumber: true,
            prospectName: true,
            customer: { select: { customerName: true } },
          },
        },
      },
    }),
    prisma.quotation.count({ where }),
  ]);
  return {
    total,
    rows: records.map((record) => ({
      id: record.id,
      reference: record.quotationNumber,
      title:
        record.customer?.customerName ??
        record.enquiry?.customer?.customerName ??
        record.enquiry?.prospectName ??
        '—',
      detail: null,
      amount: decimal(record.totalAmount),
      status: record.status,
      deletedAt: record.deletedAt as Date,
      own: { module: 'QUOTATIONS', referenceId: record.id },
      parents: record.enquiry
        ? [{ module: 'ENQUIRIES', referenceId: record.enquiry.id, label: `Enquiry ${record.enquiry.enquiryNumber}` }]
        : [],
    })),
  };
};

const orders: Adapter = async ({ companyId, search }, page) => {
  const where: Prisma.OrderWhereInput = {
    companyId,
    deletedAt: DELETED,
    ...(search
      ? { OR: [{ orderNumber: { contains: search } }, { customer: { customerName: { contains: search } } }] }
      : {}),
  };
  const [records, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: [{ deletedAt: 'desc' }, { id: 'desc' }],
      ...page,
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        status: true,
        deletedAt: true,
        customer: { select: { customerName: true } },
        enquiry: { select: { id: true, enquiryNumber: true, eventName: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);
  return {
    total,
    rows: records.map((record) => ({
      id: record.id,
      reference: record.orderNumber,
      title: record.customer.customerName,
      detail: record.enquiry.eventName,
      amount: decimal(record.totalAmount),
      status: record.status,
      deletedAt: record.deletedAt as Date,
      own: { module: 'ORDERS', referenceId: record.id },
      parents: [
        { module: 'ENQUIRIES', referenceId: record.enquiry.id, label: `Enquiry ${record.enquiry.enquiryNumber}` },
      ],
    })),
  };
};

const payments: Adapter = async ({ companyId, search }, page) => {
  const where: Prisma.PaymentWhereInput = {
    deletedAt: DELETED,
    order: { companyId },
    ...(search
      ? {
          OR: [
            { receiptNumber: { contains: search } },
            { order: { orderNumber: { contains: search } } },
            { order: { customer: { customerName: { contains: search } } } },
          ],
        }
      : {}),
  };
  const [records, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: [{ deletedAt: 'desc' }, { id: 'desc' }],
      ...page,
      select: {
        id: true,
        receiptNumber: true,
        amount: true,
        paymentMethod: true,
        deletedAt: true,
        order: {
          select: {
            id: true,
            orderNumber: true,
            customer: { select: { customerName: true } },
            enquiry: { select: { id: true, enquiryNumber: true } },
          },
        },
      },
    }),
    prisma.payment.count({ where }),
  ]);
  return {
    total,
    rows: records.map((record) => ({
      id: record.id,
      reference: record.receiptNumber,
      title: record.order.customer.customerName,
      detail: `Order ${record.order.orderNumber} · ${record.paymentMethod}`,
      amount: decimal(record.amount),
      status: null,
      deletedAt: record.deletedAt as Date,
      own: { module: 'PAYMENTS', referenceId: record.id },
      // Deleted alone, or taken with its order — and that order may itself have gone with its enquiry.
      parents: [
        { module: 'ORDERS', referenceId: record.order.id, label: `Order ${record.order.orderNumber}` },
        {
          module: 'ENQUIRIES',
          referenceId: record.order.enquiry.id,
          label: `Enquiry ${record.order.enquiry.enquiryNumber}`,
        },
      ],
    })),
  };
};

const expenses: Adapter = async ({ companyId, search }, page) => {
  const where: Prisma.ExpenseWhereInput = {
    companyId,
    deletedAt: DELETED,
    ...(search ? { OR: [{ description: { contains: search } }, { category: { name: { contains: search } } }] } : {}),
  };
  const [records, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: [{ deletedAt: 'desc' }, { id: 'desc' }],
      ...page,
      select: {
        id: true,
        amount: true,
        description: true,
        deletedAt: true,
        category: { select: { name: true } },
      },
    }),
    prisma.expense.count({ where }),
  ]);
  return {
    total,
    rows: records.map((record) => ({
      id: record.id,
      reference: `#${record.id}`,
      title: record.category.name,
      detail: record.description,
      amount: decimal(record.amount),
      status: null,
      deletedAt: record.deletedAt as Date,
      own: { module: 'EXPENSES', referenceId: record.id },
      parents: [],
    })),
  };
};

const users: Adapter = async ({ companyId, search }, page) => {
  const where: Prisma.UserWhereInput = {
    companyId,
    deletedAt: DELETED,
    ...(search ? { OR: [{ fullName: { contains: search } }, { username: { contains: search } }] } : {}),
  };
  const [records, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: [{ deletedAt: 'desc' }, { id: 'desc' }],
      ...page,
      select: {
        id: true,
        fullName: true,
        username: true,
        deletedAt: true,
        userGroup: { select: { groupName: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);
  return {
    total,
    rows: records.map((record) => ({
      id: record.id,
      reference: record.username,
      title: record.fullName,
      detail: record.userGroup.groupName,
      amount: null,
      status: null,
      deletedAt: record.deletedAt as Date,
      own: { module: 'USERS', referenceId: record.id },
      parents: [],
    })),
  };
};

const ADAPTERS: Record<DeletedItemType, Adapter> = {
  ENQUIRIES: enquiries,
  QUOTATIONS: quotations,
  ORDERS: orders,
  PAYMENTS: payments,
  EXPENSES: expenses,
  USERS: users,
};

export async function listDeletedItems(params: ListDeletedItemsParams) {
  const { rows, total } = await ADAPTERS[params.type](params, {
    skip: (params.page - 1) * params.limit,
    take: params.limit,
  });
  return { records: await attachDeleters(params.companyId, rows), totalRecords: total };
}

const TYPE_LABELS: Record<DeletedItemType, string> = {
  ENQUIRIES: 'Enquiries',
  QUOTATIONS: 'Quotations',
  ORDERS: 'Orders',
  PAYMENTS: 'Payments',
  EXPENSES: 'Expenses',
  USERS: 'Users',
};

/** How many deleted records of each kind there are — the counts on the Deleted Items tabs. */
export async function countDeletedItems(companyId: number): Promise<DeletedItemTypeSummary[]> {
  const [enquiryCount, quotationCount, orderCount, paymentCount, expenseCount, userCount] = await Promise.all([
    prisma.enquiry.count({ where: { companyId, deletedAt: DELETED } }),
    prisma.quotation.count({ where: { companyId, deletedAt: DELETED } }),
    prisma.order.count({ where: { companyId, deletedAt: DELETED } }),
    prisma.payment.count({ where: { deletedAt: DELETED, order: { companyId } } }),
    prisma.expense.count({ where: { companyId, deletedAt: DELETED } }),
    prisma.user.count({ where: { companyId, deletedAt: DELETED } }),
  ]);
  const counts: Record<DeletedItemType, number> = {
    ENQUIRIES: enquiryCount,
    QUOTATIONS: quotationCount,
    ORDERS: orderCount,
    PAYMENTS: paymentCount,
    EXPENSES: expenseCount,
    USERS: userCount,
  };
  return (Object.keys(TYPE_LABELS) as DeletedItemType[]).map((type) => ({
    type,
    label: TYPE_LABELS[type],
    count: counts[type],
  }));
}
