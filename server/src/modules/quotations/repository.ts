import { Prisma, QuotationSource, QuotationStatus } from '@prisma/client';
import { PrismaClientOrTx, prisma } from '../../config/prisma';
import { ListQuotationsParams, QuotationItemInput, QuotationSectionInput } from './types';

const customerMiniSelect = {
  id: true,
  customerName: true,
  mobile: true,
  whatsapp: true,
  email: true,
  address: true,
} satisfies Prisma.CustomerSelect;

// Event context for the quotation view page's Event card and the list's Event column. Read from
// the source enquiry — the only place an event is described, so Customer/Order/Manual quotations
// simply have none.
const enquiryEventSelect = {
  eventName: true,
  eventDate: true,
  mahal: true,
  venue: true,
  eventType: { select: { id: true, eventName: true, colorCode: true } },
} satisfies Prisma.EnquirySelect;

const userMiniSelect = { id: true, fullName: true } satisfies Prisma.UserSelect;

// Everything the response mapper + PDF renderer need to resolve a recipient regardless of source.
const quotationBaseSelect = {
  id: true,
  source: true,
  quotationNumber: true,
  version: true,
  quotationDate: true,
  subtotal: true,
  discount: true,
  cgstPercent: true,
  sgstPercent: true,
  tax: true,
  totalAmount: true,
  advanceAmount: true,
  status: true,
  pdfPath: true,
  createdAt: true,
  // Drives the "Last Updated" column the enquiry's quotation table requires
  // ("md files/Enquiry/enq.md" §9).
  updatedAt: true,
  manualCustomerName: true,
  manualPhone: true,
  manualWhatsapp: true,
  manualEmail: true,
  manualAddress: true,
  manualGst: true,
  enquiry: {
    select: {
      id: true,
      enquiryNumber: true,
      status: true,
      advanceAmount: true,
      prospectName: true,
      prospectMobile: true,
      prospectWhatsapp: true,
      prospectEmail: true,
      prospectAddress: true,
      prospectCity: true,
      customer: { select: customerMiniSelect },
      assignedUser: { select: userMiniSelect },
      ...enquiryEventSelect,
    },
  },
  customer: { select: customerMiniSelect },
  sourceOrder: { select: { id: true, orderNumber: true, customer: { select: customerMiniSelect } } },
  createdBy: { select: userMiniSelect },
} satisfies Prisma.QuotationSelect;

const quotationDetailSelect = {
  ...quotationBaseSelect,
  remarks: true,
  items: {
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      sectionId: true,
      itemName: true,
      description: true,
      sizeQty: true,
      quantity: true,
      unit: true,
      rate: true,
      amount: true,
      sortOrder: true,
    },
  },
  sections: {
    orderBy: { sortOrder: 'asc' },
    select: { id: true, title: true, amount: true, sortOrder: true },
  },
  images: {
    where: { deletedAt: null },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, fileName: true, filePath: true, caption: true, sortOrder: true },
  },
} satisfies Prisma.QuotationSelect;

export type QuotationBaseRecord = Prisma.QuotationGetPayload<{ select: typeof quotationBaseSelect }>;
export type QuotationDetailRecord = Prisma.QuotationGetPayload<{ select: typeof quotationDetailSelect }>;

export async function listQuotations(params: ListQuotationsParams) {
  const where: Prisma.QuotationWhereInput = {
    deletedAt: null,
    companyId: params.companyId,
    ...(params.source ? { source: params.source } : {}),
    ...(params.status ? { status: params.status } : {}),
    ...(params.enquiryId ? { enquiryId: params.enquiryId } : {}),
    ...(params.customerId ? { customerId: params.customerId } : {}),
    ...(params.orderId ? { orderId: params.orderId } : {}),
    ...(params.dateFrom || params.dateTo
      ? {
          quotationDate: {
            ...(params.dateFrom ? { gte: params.dateFrom } : {}),
            ...(params.dateTo ? { lte: params.dateTo } : {}),
          },
        }
      : {}),
    ...(params.search
      ? {
          OR: [
            { quotationNumber: { contains: params.search } },
            { manualCustomerName: { contains: params.search } },
            { manualPhone: { contains: params.search } },
            { manualWhatsapp: { contains: params.search } },
            { enquiry: { enquiryNumber: { contains: params.search } } },
            { enquiry: { prospectName: { contains: params.search } } },
            { enquiry: { customer: { customerName: { contains: params.search } } } },
            { customer: { customerName: { contains: params.search } } },
            { customer: { mobile: { contains: params.search } } },
            { sourceOrder: { orderNumber: { contains: params.search } } },
            { sourceOrder: { customer: { customerName: { contains: params.search } } } },
          ],
        }
      : {}),
  };

  const [records, totalRecords] = await Promise.all([
    prisma.quotation.findMany({
      where,
      select: quotationBaseSelect,
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.quotation.count({ where }),
  ]);

  return { records, totalRecords };
}

// KPI tiles above the Quotations list. Revenue counts APPROVED quotations only — the value
// actually won, rather than every draft ever raised.
export async function getQuotationStats(companyId: number) {
  const baseWhere: Prisma.QuotationWhereInput = { companyId, deletedAt: null };

  const [draft, sent, approved, rejected, revenue] = await Promise.all([
    prisma.quotation.count({ where: { ...baseWhere, status: QuotationStatus.DRAFT } }),
    prisma.quotation.count({ where: { ...baseWhere, status: QuotationStatus.SENT } }),
    prisma.quotation.count({ where: { ...baseWhere, status: QuotationStatus.APPROVED } }),
    prisma.quotation.count({ where: { ...baseWhere, status: QuotationStatus.REJECTED } }),
    prisma.quotation.aggregate({
      where: { ...baseWhere, status: QuotationStatus.APPROVED },
      _sum: { totalAmount: true },
    }),
  ]);

  return { draft, sent, approved, rejected, revenue: (revenue._sum.totalAmount ?? 0).toString() };
}

// Powers the Quotations module's grouped list (one row per enquiry) — queried from the Enquiry
// side so each enquiry naturally carries just its latest quotation revision, with older revisions
// (REVISED) reachable from the enquiry's own page instead of cluttering this list.
export async function listEnquiryQuotationGroups(params: ListQuotationsParams) {
  const where: Prisma.EnquiryWhereInput = {
    companyId: params.companyId,
    deletedAt: null,
    quotations: { some: { deletedAt: null } },
    // An enquiry-sourced quotation belongs to the enquiry's customer and is owned by the enquiry's
    // assigned user — both filters read straight off the enquiry rather than the quotation.
    ...(params.customerId ? { customerId: params.customerId } : {}),
    ...(params.assignedUserId ? { assignedUserId: params.assignedUserId } : {}),
    ...(params.search
      ? {
          OR: [
            { enquiryNumber: { contains: params.search } },
            { customer: { customerName: { contains: params.search } } },
            { customer: { mobile: { contains: params.search } } },
            { prospectName: { contains: params.search } },
            { prospectMobile: { contains: params.search } },
            { eventName: { contains: params.search } },
            { quotations: { some: { quotationNumber: { contains: params.search } } } },
          ],
        }
      : {}),
  };

  const enquiries = await prisma.enquiry.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      enquiryNumber: true,
      prospectName: true,
      prospectMobile: true,
      customer: { select: customerMiniSelect },
      assignedUser: { select: userMiniSelect },
      ...enquiryEventSelect,
      quotations: {
        where: { deletedAt: null },
        orderBy: { version: 'desc' },
        take: 1,
        select: {
          id: true,
          quotationNumber: true,
          version: true,
          quotationDate: true,
          totalAmount: true,
          status: true,
          createdAt: true,
        },
      },
      _count: { select: { quotations: { where: { deletedAt: null } } } },
    },
  });

  // Status and date filters apply to the LATEST revision — the one this row actually represents —
  // so they're applied here rather than in the `where` above (which would match on any revision).
  return enquiries
    .filter((enquiry) => enquiry.quotations.length > 0)
    .filter((enquiry) => !params.status || enquiry.quotations[0].status === params.status)
    .filter((enquiry) => !params.dateFrom || enquiry.quotations[0].quotationDate >= params.dateFrom)
    .filter((enquiry) => !params.dateTo || enquiry.quotations[0].quotationDate <= params.dateTo);
}

// The other half of the grouped list — quotations with no enquiry to group under (Customer/Order/
// Manual sources) still appear as individual rows.
export function listNonEnquiryQuotations(params: ListQuotationsParams) {
  const where: Prisma.QuotationWhereInput = {
    deletedAt: null,
    companyId: params.companyId,
    source: params.source ?? { not: QuotationSource.ENQUIRY },
    ...(params.status ? { status: params.status } : {}),
    // With no enquiry to assign it, a standalone quotation's owner is whoever created it.
    ...(params.assignedUserId ? { createdById: params.assignedUserId } : {}),
    ...(params.dateFrom || params.dateTo
      ? {
          quotationDate: {
            ...(params.dateFrom ? { gte: params.dateFrom } : {}),
            ...(params.dateTo ? { lte: params.dateTo } : {}),
          },
        }
      : {}),
    // Customer and search are both disjunctions, so they go in an AND array — spreading two `OR`
    // keys into the same object would silently drop the first.
    AND: [
      // A standalone quotation is addressed either to a linked customer (CUSTOMER source) or to the
      // customer of the order it was raised against (ORDER source); MANUAL ones have no customer
      // record at all, so they drop out whenever a customer filter is applied.
      ...(params.customerId
        ? [{ OR: [{ customerId: params.customerId }, { sourceOrder: { customerId: params.customerId } }] }]
        : []),
      ...(params.search
        ? [
            {
              OR: [
                { quotationNumber: { contains: params.search } },
                { manualCustomerName: { contains: params.search } },
                { manualPhone: { contains: params.search } },
                { manualWhatsapp: { contains: params.search } },
                { customer: { customerName: { contains: params.search } } },
                { customer: { mobile: { contains: params.search } } },
                { sourceOrder: { orderNumber: { contains: params.search } } },
                { sourceOrder: { customer: { customerName: { contains: params.search } } } },
              ],
            },
          ]
        : []),
    ],
  };

  return prisma.quotation.findMany({ where, select: quotationBaseSelect, orderBy: { createdAt: 'desc' } });
}

export function findQuotationById(companyId: number, id: number, client: PrismaClientOrTx = prisma) {
  return client.quotation.findFirst({
    where: { id, deletedAt: null, companyId },
    select: quotationDetailSelect,
  });
}

// Every revision raised against one enquiry, newest version first — feeds the quotation view
// page's revision-history drawer. Deliberately a thin projection: the drawer only lists versions
// and links to them, it never renders a full document.
export function listQuotationRevisions(companyId: number, enquiryId: number) {
  return prisma.quotation.findMany({
    where: { enquiryId, companyId, deletedAt: null },
    orderBy: { version: 'desc' },
    select: {
      id: true,
      quotationNumber: true,
      version: true,
      quotationDate: true,
      totalAmount: true,
      status: true,
      createdAt: true,
      createdBy: { select: userMiniSelect },
    },
  });
}

// Audit trail for one quotation — the same shape the Orders module's timeline uses, so the
// AppTimeline component renders both without branching.
export function getQuotationActivityLog(id: number, client: PrismaClientOrTx = prisma) {
  return client.activityLog.findMany({
    where: { module: 'QUOTATIONS', referenceId: id },
    orderBy: { performedAt: 'desc' },
    select: {
      id: true,
      action: true,
      description: true,
      performedAt: true,
      performedBy: { select: userMiniSelect },
    },
  });
}

// `includeDeleted` is for numbering only: a deleted revision still holds its (enquiry, version) pair
// under the unique index, so the next revision has to count past it.
export function findLatestQuotationForEnquiry(
  companyId: number,
  enquiryId: number,
  client: PrismaClientOrTx = prisma,
  includeDeleted = false,
) {
  return client.quotation.findFirst({
    where: { enquiryId, companyId, ...(includeDeleted ? {} : { deletedAt: null }) },
    orderBy: { version: 'desc' },
  });
}

// One statement for any number of quotations, so a bulk delete stamps them all with the same instant.
export function softDeleteQuotations(ids: number[], client: PrismaClientOrTx = prisma) {
  return client.quotation.updateMany({ where: { id: { in: ids }, deletedAt: null }, data: { deletedAt: new Date() } });
}

// Only what deleting needs: the fields its rules check, and the enquiry whose quotation summary has
// to follow. Lighter than findQuotationById, which loads the whole document.
export function findQuotationsForDelete(companyId: number, ids: number[], client: PrismaClientOrTx = prisma) {
  return client.quotation.findMany({
    where: { id: { in: ids }, companyId, deletedAt: null },
    select: { id: true, quotationNumber: true, version: true, status: true, source: true, enquiryId: true },
  });
}

export function findApprovedQuotationForEnquiry(
  companyId: number,
  enquiryId: number,
  client: PrismaClientOrTx = prisma,
) {
  return client.quotation.findFirst({
    where: { enquiryId, deletedAt: null, status: QuotationStatus.APPROVED, companyId },
    orderBy: { version: 'desc' },
  });
}

/**
 * Combined total of every approved quotation on an enquiry.
 *
 * "md files/Enquiry/enq.md" §2 removes the one-approval-per-enquiry limit, so the enquiry's
 * committed figure is the sum of what has been confirmed rather than a single quotation's total.
 * Returns 0 when nothing is approved.
 */
export async function sumApprovedQuotationTotalForEnquiry(
  companyId: number,
  enquiryId: number,
  client: PrismaClientOrTx = prisma,
): Promise<number> {
  const aggregate = await client.quotation.aggregate({
    where: { enquiryId, deletedAt: null, status: QuotationStatus.APPROVED, companyId },
    _sum: { totalAmount: true },
  });
  return Number(aggregate._sum.totalAmount ?? 0);
}

interface QuotationItemWithAmount extends QuotationItemInput {
  amount: number;
}

interface ManualCustomerData {
  name?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  gst?: string;
}

interface CreateQuotationData {
  companyId: number;
  source: QuotationSource;
  enquiryId?: number;
  customerId?: number;
  orderId?: number;
  manualCustomer?: ManualCustomerData;
  quotationNumber: string;
  version: number;
  quotationDate: Date;
  subtotal: number;
  discount: number;
  cgstPercent: number;
  sgstPercent: number;
  tax: number;
  totalAmount: number;
  advanceAmount?: number;
  remarks?: string;
  createdById: number;
  items: QuotationItemWithAmount[];
  sections?: QuotationSectionInput[];
}

// Sections and the items listed under them are written after the quotation row exists, because each
// item needs its section's id. Sort order is the position in the submitted list.
async function writeSections(quotationId: number, sections: QuotationSectionInput[], client: PrismaClientOrTx) {
  for (const [sectionIndex, section] of sections.entries()) {
    const created = await client.quotationSection.create({
      data: { quotationId, title: section.title || null, amount: section.amount, sortOrder: sectionIndex },
      select: { id: true },
    });
    await client.quotationItem.createMany({
      data: section.items.map((item, itemIndex) => ({
        quotationId,
        sectionId: created.id,
        itemName: item.description,
        sizeQty: item.sizeQty || null,
        sortOrder: itemIndex,
      })),
    });
  }
}

function itemCreateInput(items: QuotationItemWithAmount[]) {
  return items.map((item) => ({
    itemName: item.itemName,
    description: item.description,
    quantity: item.quantity,
    unit: item.unit,
    rate: item.rate,
    amount: item.amount,
    sortOrder: item.sortOrder ?? 0,
  }));
}

export async function createQuotation(data: CreateQuotationData, client: PrismaClientOrTx = prisma) {
  const created = await client.quotation.create({
    data: {
      companyId: data.companyId,
      source: data.source,
      enquiryId: data.enquiryId,
      customerId: data.customerId,
      orderId: data.orderId,
      manualCustomerName: data.manualCustomer?.name,
      manualPhone: data.manualCustomer?.phone,
      manualWhatsapp: data.manualCustomer?.whatsapp,
      manualEmail: data.manualCustomer?.email,
      manualAddress: data.manualCustomer?.address,
      manualGst: data.manualCustomer?.gst,
      quotationNumber: data.quotationNumber,
      version: data.version,
      quotationDate: data.quotationDate,
      subtotal: data.subtotal,
      discount: data.discount,
      cgstPercent: data.cgstPercent,
      sgstPercent: data.sgstPercent,
      tax: data.tax,
      totalAmount: data.totalAmount,
      advanceAmount: data.advanceAmount,
      remarks: data.remarks,
      createdById: data.createdById,
      status: QuotationStatus.DRAFT,
      items: { create: itemCreateInput(data.items) },
    },
    select: quotationDetailSelect,
  });

  if (!data.sections?.length) return created;
  await writeSections(created.id, data.sections, client);
  return client.quotation.findUniqueOrThrow({ where: { id: created.id }, select: quotationDetailSelect });
}

export function markQuotationRevised(id: number, client: PrismaClientOrTx = prisma) {
  return client.quotation.update({ where: { id }, data: { status: QuotationStatus.REVISED } });
}

interface UpdateQuotationData {
  quotationDate?: Date;
  subtotal?: number;
  discount?: number;
  cgstPercent?: number;
  sgstPercent?: number;
  tax?: number;
  totalAmount?: number;
  advanceAmount?: number;
  remarks?: string;
  manualCustomer?: ManualCustomerData;
}

export async function updateQuotation(
  id: number,
  data: UpdateQuotationData,
  items: QuotationItemWithAmount[] | undefined,
  sections: QuotationSectionInput[] | undefined,
  client: PrismaClientOrTx = prisma,
) {
  // Either replacement rewrites every line of the quotation, so both tables are cleared first.
  if (items || sections) {
    await client.quotationItem.deleteMany({ where: { quotationId: id } });
    await client.quotationSection.deleteMany({ where: { quotationId: id } });
  }

  const updated = await client.quotation.update({
    where: { id },
    data: {
      quotationDate: data.quotationDate,
      subtotal: data.subtotal,
      discount: data.discount,
      cgstPercent: data.cgstPercent,
      sgstPercent: data.sgstPercent,
      tax: data.tax,
      totalAmount: data.totalAmount,
      advanceAmount: data.advanceAmount,
      remarks: data.remarks,
      ...(data.manualCustomer
        ? {
            manualCustomerName: data.manualCustomer.name,
            // The form always sends the whole snapshot, and a number may now be cleared.
            manualPhone: data.manualCustomer.phone ?? null,
            manualWhatsapp: data.manualCustomer.whatsapp ?? null,
            manualEmail: data.manualCustomer.email,
            manualAddress: data.manualCustomer.address,
            manualGst: data.manualCustomer.gst,
          }
        : {}),
      ...(items ? { items: { create: itemCreateInput(items) } } : {}),
    },
    select: quotationDetailSelect,
  });

  if (!sections) return updated;
  await writeSections(id, sections, client);
  return client.quotation.findUniqueOrThrow({ where: { id }, select: quotationDetailSelect });
}

export function updateQuotationStatus(id: number, status: QuotationStatus, client: PrismaClientOrTx = prisma) {
  return client.quotation.update({ where: { id }, data: { status }, select: quotationDetailSelect });
}

export function updateQuotationPdfPath(id: number, pdfPath: string, client: PrismaClientOrTx = prisma) {
  return client.quotation.update({ where: { id }, data: { pdfPath } });
}

// ---- Quotation images -----------------------------------------------------

interface QuotationImageData {
  quotationId: number;
  fileName: string;
  filePath: string;
  caption: string | null;
  sortOrder: number;
}

export function createQuotationImages(rows: QuotationImageData[], client: PrismaClientOrTx = prisma) {
  return client.quotationImage.createMany({ data: rows });
}

export function countQuotationImages(quotationId: number, client: PrismaClientOrTx = prisma) {
  return client.quotationImage.count({ where: { quotationId, deletedAt: null } });
}

export function findQuotationImageById(id: number, client: PrismaClientOrTx = prisma) {
  return client.quotationImage.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, quotationId: true, filePath: true, fileName: true },
  });
}

export function updateQuotationImageCaption(id: number, caption: string | null, client: PrismaClientOrTx = prisma) {
  return client.quotationImage.update({ where: { id }, data: { caption } });
}

export function softDeleteQuotationImage(id: number, client: PrismaClientOrTx = prisma) {
  return client.quotationImage.update({ where: { id }, data: { deletedAt: new Date() } });
}

/** A quotation that has been soft-deleted, with the parents it depends on — what a restore checks first. */
export function findDeletedQuotationById(companyId: number, id: number, client: PrismaClientOrTx = prisma) {
  return client.quotation.findFirst({
    where: { id, companyId, deletedAt: { not: null } },
    select: {
      id: true,
      quotationNumber: true,
      version: true,
      source: true,
      deletedAt: true,
      enquiry: { select: { id: true, enquiryNumber: true, deletedAt: true } },
      sourceOrder: { select: { id: true, orderNumber: true, deletedAt: true } },
    },
  });
}

/**
 * The inverse of softDeleteQuotations, on the caller's transaction. Brings back the images that were
 * deleted with it (the same instant) — an image someone removed on its own earlier stays removed.
 */
export async function restoreQuotation(tx: PrismaClientOrTx, id: number, stamp: Date) {
  await tx.quotationImage.updateMany({ where: { quotationId: id, deletedAt: stamp }, data: { deletedAt: null } });
  return tx.quotation.update({ where: { id }, data: { deletedAt: null }, select: { id: true } });
}
