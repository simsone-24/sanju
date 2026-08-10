import fs from 'fs';
import path from 'path';
import { EnquiryStatus, OrderStatus, Prisma, QuotationSource, QuotationStatus, SequenceType } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';
import { logActivity } from '../../utils/activityLogger';
import { generateDocumentNumber } from '../../utils/numberGenerator';
import { buildPaginationMeta } from '../../utils/pagination';
import * as enquiriesRepository from '../enquiries/repository';
import * as enquiriesService from '../enquiries/service';
import * as customersRepository from '../customers/repository';
import * as ordersRepository from '../orders/repository';
import * as settingsRepository from '../settings/repository';
import { generateQuotationPdf } from './pdf';
import * as quotationsRepository from './repository';
import { QuotationBaseRecord, QuotationDetailRecord } from './repository';
import {
  CreateQuotationInput,
  CustomerSnapshot,
  ListQuotationsParams,
  QuotationItemInput,
  UpdateQuotationInput,
} from './types';

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function computeItemsWithAmount(items: QuotationItemInput[]) {
  return items.map((item) => ({ ...item, amount: roundCurrency(item.quantity * item.rate) }));
}

// Resolve the recipient from whichever source the quotation came from — the single place that
// encodes the "customer of a quotation" rule across all four sources.
function buildSnapshot(record: QuotationBaseRecord): CustomerSnapshot {
  switch (record.source) {
    case QuotationSource.ENQUIRY: {
      const customer = record.enquiry?.customer;
      return {
        name: customer?.customerName ?? record.enquiry?.prospectName ?? null,
        phone: customer?.mobile ?? record.enquiry?.prospectMobile ?? null,
        whatsapp: customer?.whatsapp ?? record.enquiry?.prospectWhatsapp ?? null,
        email: customer?.email ?? record.enquiry?.prospectEmail ?? null,
        address: customer?.address ?? record.enquiry?.prospectAddress ?? null,
        gst: null,
      };
    }
    case QuotationSource.CUSTOMER:
      return {
        name: record.customer?.customerName ?? null,
        phone: record.customer?.mobile ?? null,
        whatsapp: record.customer?.whatsapp ?? null,
        email: record.customer?.email ?? null,
        address: record.customer?.address ?? null,
        gst: null,
      };
    case QuotationSource.ORDER: {
      const customer = record.sourceOrder?.customer;
      return {
        name: customer?.customerName ?? null,
        phone: customer?.mobile ?? null,
        whatsapp: customer?.whatsapp ?? null,
        email: customer?.email ?? null,
        address: customer?.address ?? null,
        gst: null,
      };
    }
    case QuotationSource.MANUAL:
    default:
      return {
        name: record.manualCustomerName,
        phone: record.manualPhone,
        whatsapp: record.manualWhatsapp,
        email: record.manualEmail,
        address: record.manualAddress,
        gst: record.manualGst,
      };
  }
}

// The event a quotation is priced for. Only an enquiry describes one, so Customer/Order/Manual
// quotations legitimately have none and the UI shows the card as not applicable rather than empty.
function buildEvent(record: QuotationBaseRecord) {
  if (!record.enquiry) return null;
  return {
    eventType: record.enquiry.eventType.eventName,
    colorCode: record.enquiry.eventType.colorCode,
    eventName: record.enquiry.eventName,
    eventDate: record.enquiry.eventDate,
    mahal: record.enquiry.mahal,
    venue: record.enquiry.venue,
  };
}

// Who the quotation belongs to: the source enquiry's assigned user, falling back to whoever
// created the document when there is no enquiry to carry an assignment.
function buildOwner(record: QuotationBaseRecord) {
  return record.enquiry?.assignedUser ?? record.createdBy ?? null;
}

function mapBase(record: QuotationBaseRecord) {
  return {
    id: record.id,
    source: record.source,
    quotationNumber: record.quotationNumber,
    version: record.version,
    quotationDate: record.quotationDate,
    subtotal: record.subtotal,
    discount: record.discount,
    cgstPercent: record.cgstPercent,
    sgstPercent: record.sgstPercent,
    tax: record.tax,
    totalAmount: record.totalAmount,
    status: record.status,
    pdfPath: record.pdfPath,
    createdAt: record.createdAt,
    recipient: buildSnapshot(record),
    event: buildEvent(record),
    owner: buildOwner(record),
    link: {
      enquiry: record.enquiry
        ? { id: record.enquiry.id, enquiryNumber: record.enquiry.enquiryNumber, status: record.enquiry.status }
        : null,
      customer: record.customer ? { id: record.customer.id, customerName: record.customer.customerName } : null,
      order: record.sourceOrder ? { id: record.sourceOrder.id, orderNumber: record.sourceOrder.orderNumber } : null,
    },
  };
}

interface QuotationDetailExtras {
  /** Every revision raised against the same enquiry; empty for standalone quotations. */
  revisions?: QuotationRevisionSummary[];
  /** The order this quotation was converted into, if any. */
  convertedOrder?: { id: string; orderNumber: string; status: OrderStatus } | null;
  /** The company's standing Terms & Conditions (Settings), shown alongside the quotation's notes. */
  termsAndConditions?: string | null;
}

interface QuotationRevisionSummary {
  id: string;
  quotationNumber: string;
  version: number;
  quotationDate: Date;
  totalAmount: Prisma.Decimal;
  status: QuotationStatus;
  createdAt: Date;
  createdBy: { id: string; fullName: string } | null;
}

function mapDetail(record: QuotationDetailRecord, extras: QuotationDetailExtras = {}) {
  const snapshot = buildSnapshot(record);
  return {
    ...mapBase(record),
    remarks: record.remarks,
    updatedAt: record.updatedAt,
    createdBy: record.createdBy,
    whatsappNumber: snapshot.whatsapp ?? snapshot.phone,
    items: record.items,
    images: record.images,
    revisions: extras.revisions ?? [],
    convertedOrder: extras.convertedOrder ?? null,
    termsAndConditions: extras.termsAndConditions ?? null,
  };
}

// Renders (or re-renders) the PDF and persists its path. Isolated so a PDF failure never rolls back
// a successfully-saved quotation — the download route can regenerate on demand.
async function regeneratePdf(companyId: string, record: QuotationDetailRecord): Promise<string | null> {
  const company = await settingsRepository.findCompanyById(companyId);
  if (!company) return null;

  const snapshot = buildSnapshot(record);
  const pdfPath = await generateQuotationPdf(
    record.id,
    {
      quotationNumber: record.quotationNumber,
      version: record.version,
      quotationDate: record.quotationDate,
      status: record.status,
      recipient: snapshot,
      items: record.items.map((item) => ({
        itemName: item.itemName,
        description: item.description,
        quantity: Number(item.quantity),
        unit: item.unit,
        rate: Number(item.rate),
        amount: Number(item.amount),
      })),
      subtotal: Number(record.subtotal),
      discount: Number(record.discount),
      cgstPercent: Number(record.cgstPercent),
      sgstPercent: Number(record.sgstPercent),
      tax: Number(record.tax),
      totalAmount: Number(record.totalAmount),
      remarks: record.remarks,
      imagePaths: record.images.map((image) => path.resolve(env.uploadPath, image.filePath)),
    },
    {
      companyName: company.companyName,
      address: company.address,
      gstNumber: company.gstNumber,
      mobile: company.mobile,
      email: company.email,
      website: company.website,
      logoAbsolutePath: company.logo ? path.resolve(env.uploadPath, company.logo) : null,
      bankName: company.bankName,
      bankAccountName: company.bankAccountName,
      bankAccountNumber: company.bankAccountNumber,
      bankBranch: company.bankBranch,
      bankIfsc: company.bankIfsc,
      bankUpi: company.bankUpi,
      authorizedSignatory: company.authorizedSignatory,
      footerMessage: company.footerMessage,
      termsAndConditions: company.termsAndConditions,
    },
  );

  await quotationsRepository.updateQuotationPdfPath(record.id, pdfPath);
  return pdfPath;
}

export async function list(params: ListQuotationsParams) {
  const { records, totalRecords } = await quotationsRepository.listQuotations(params);
  return { records: records.map(mapBase), meta: buildPaginationMeta(params.page, params.limit, totalRecords) };
}

// The Quotations module's default view: one row per enquiry (its latest quotation revision —
// older REVISED versions live on the enquiry's own page instead), plus an individual row for each
// Customer/Order/Manual-sourced quotation, which have no enquiry to group under. Combined and
// sorted by most-recent activity, then paginated in memory — company-scale quotation volume makes
// this cheap, and it's the only way to page a set stitched together from two different tables.
export async function listGrouped(params: ListQuotationsParams) {
  const wantEnquiryGroups = !params.source || params.source === QuotationSource.ENQUIRY;
  const wantIndividual = !params.source || params.source !== QuotationSource.ENQUIRY;

  const [enquiryGroups, individualQuotations] = await Promise.all([
    wantEnquiryGroups ? quotationsRepository.listEnquiryQuotationGroups(params) : Promise.resolve([]),
    wantIndividual
      ? quotationsRepository.listNonEnquiryQuotations({
          ...params,
          source: params.source && params.source !== QuotationSource.ENQUIRY ? params.source : undefined,
        })
      : Promise.resolve([]),
  ]);

  const groupRows = enquiryGroups.map((enquiry) => {
    const latest = enquiry.quotations[0];
    return {
      kind: 'ENQUIRY' as const,
      enquiry: {
        id: enquiry.id,
        enquiryNumber: enquiry.enquiryNumber,
        customerName: enquiry.customer?.customerName ?? enquiry.prospectName ?? '',
        customerMobile: enquiry.customer?.mobile ?? enquiry.prospectMobile ?? '',
        eventType: enquiry.eventType.eventName,
        colorCode: enquiry.eventType.colorCode,
        eventName: enquiry.eventName,
        eventDate: enquiry.eventDate,
        assignedUser: enquiry.assignedUser,
      },
      quotationCount: enquiry._count.quotations,
      latestQuotation: {
        id: latest.id,
        quotationNumber: latest.quotationNumber,
        version: latest.version,
        quotationDate: latest.quotationDate,
        totalAmount: latest.totalAmount,
        status: latest.status,
      },
      sortDate: latest.createdAt,
    };
  });

  const quotationRows = individualQuotations.map((quotation) => ({
    kind: 'QUOTATION' as const,
    quotation: mapBase(quotation),
    sortDate: quotation.createdAt,
  }));

  const combined = [...groupRows, ...quotationRows].sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());

  const totalRecords = combined.length;
  const start = (params.page - 1) * params.limit;
  const records = combined
    .slice(start, start + params.limit)
    .map(({ sortDate: _sortDate, ...row }) => row);

  return { records, meta: buildPaginationMeta(params.page, params.limit, totalRecords) };
}

export async function getStats(companyId: string) {
  return quotationsRepository.getQuotationStats(companyId);
}

// The quotation view page is a workspace, not just the document: alongside the quotation it needs
// its sibling revisions, whether it has already become an order, and the standing terms it prints.
// Gathered here so the page is one request rather than four.
export async function getById(companyId: string, id: string) {
  const quotation = await quotationsRepository.findQuotationById(companyId, id);
  if (!quotation) throw new AppError(404, 'Quotation not found.');

  const [revisions, convertedOrder, company] = await Promise.all([
    quotation.enquiry
      ? quotationsRepository.listQuotationRevisions(companyId, quotation.enquiry.id)
      : Promise.resolve([]),
    ordersRepository.findOrderByQuotationId(companyId, id),
    settingsRepository.findCompanyById(companyId),
  ]);

  return mapDetail(quotation, {
    revisions,
    convertedOrder: convertedOrder
      ? { id: convertedOrder.id, orderNumber: convertedOrder.orderNumber, status: convertedOrder.status }
      : null,
    termsAndConditions: company?.termsAndConditions ?? null,
  });
}

// Audit trail for one quotation (created, edited, sent, approved, PDF downloaded, ...), rendered
// on the view page's activity timeline. Existence-checked first so a bad id 404s instead of
// returning an empty list that reads as "no activity".
export async function getTimeline(companyId: string, id: string) {
  const quotation = await quotationsRepository.findQuotationById(companyId, id);
  if (!quotation) throw new AppError(404, 'Quotation not found.');
  return quotationsRepository.getQuotationActivityLog(id);
}

// Company letterhead + banking block used to render the quotation live preview / PDF. Exposed to
// any user who can view quotations (not just Settings admins) since it's the quotation's own header.
export async function getBranding(companyId: string) {
  const company = await settingsRepository.findCompanyById(companyId);
  if (!company) throw new AppError(404, 'Company not found.');
  return company;
}

// Validates the chosen source and returns the resolved link columns to persist. Never invents a
// source combination — the required id per source is documented in "md files/Quotation/quotation.md".
async function resolveSource(companyId: string, input: CreateQuotationInput) {
  switch (input.source) {
    case QuotationSource.ENQUIRY: {
      const enquiry = await enquiriesRepository.findEnquiryById(companyId, input.enquiryId!);
      if (!enquiry) {
        throw new AppError(400, 'Selected enquiry does not exist.', [
          { field: 'enquiryId', message: 'Selected enquiry does not exist.' },
        ]);
      }
      // No status or existing-approval guard: "md files/Enquiry/enq.md" §2/§7 require unlimited
      // quotations per enquiry with no rule blocking creation after one has been sent, approved, or
      // after the enquiry itself has been confirmed or lost. The enquiry is the parent record and
      // never restricts its children.
      return { enquiryId: input.enquiryId };
    }
    case QuotationSource.CUSTOMER: {
      const customer = await customersRepository.findCustomerById(companyId, input.customerId!);
      if (!customer) {
        throw new AppError(400, 'Selected customer does not exist.', [
          { field: 'customerId', message: 'Selected customer does not exist.' },
        ]);
      }
      return { customerId: input.customerId };
    }
    case QuotationSource.ORDER: {
      const order = await ordersRepository.findOrderById(companyId, input.orderId!);
      if (!order) {
        throw new AppError(400, 'Selected order does not exist.', [
          { field: 'orderId', message: 'Selected order does not exist.' },
        ]);
      }
      return { orderId: input.orderId };
    }
    case QuotationSource.MANUAL:
    default:
      return { manualCustomer: input.manualCustomer };
  }
}

/**
 * Applies a status chosen on the quotation form.
 *
 * APPROVED is never written directly for an enquiry-sourced quotation: approve() is what confirms
 * the enquiry, raises the Order and its Payment Tracker row, and re-sums the enquiry's final
 * budget. Writing the column alone would leave an approved quotation with none of that, so the
 * form's dropdown routes through exactly the same action the Confirm button uses. Customer /
 * Order / Manual quotations have no enquiry to confirm, so for them APPROVED is just a label.
 */
async function applyFormStatus(
  companyId: string,
  actorId: string,
  id: string,
  status: QuotationStatus,
  source: QuotationSource,
) {
  if (status === QuotationStatus.APPROVED && source === QuotationSource.ENQUIRY) {
    return approve(companyId, actorId, id);
  }

  const updated = await quotationsRepository.updateQuotationStatus(id, status);

  await logActivity({
    companyId,
    module: 'QUOTATIONS',
    referenceId: id,
    action: 'STATUS_CHANGE',
    description: `Quotation "${updated.quotationNumber}" (v${updated.version}) marked as ${status}.`,
    performedById: actorId,
  });

  return mapDetail(updated);
}

export async function create(companyId: string, actorId: string, input: CreateQuotationInput) {
  const resolved = await resolveSource(companyId, input);

  const itemsWithAmount = computeItemsWithAmount(input.items);
  const subtotal = roundCurrency(itemsWithAmount.reduce((sum, item) => sum + item.amount, 0));
  const discount = input.discount ?? 0;
  const cgstPercent = input.cgstPercent ?? 0;
  const sgstPercent = input.sgstPercent ?? 0;
  // CGST and SGST are computed independently on the discounted subtotal; `tax` is their sum.
  const taxable = subtotal - discount;
  const tax = roundCurrency((taxable * cgstPercent) / 100) + roundCurrency((taxable * sgstPercent) / 100);
  const totalAmount = roundCurrency(subtotal - discount + tax);

  if (totalAmount < 0) {
    throw new AppError(400, 'Total amount cannot be negative. Check the discount amount.', [
      { field: 'discount', message: 'Discount exceeds subtotal plus tax.' },
    ]);
  }

  const created = await prisma.$transaction(async (tx) => {
    let quotationNumber: string;
    let version = 1;

    // Only enquiry-sourced quotations are versioned revisions; every other source is a standalone
    // v1 with a fresh number.
    if (input.source === QuotationSource.ENQUIRY) {
      const latest = await quotationsRepository.findLatestQuotationForEnquiry(companyId, input.enquiryId!, tx);
      if (latest) {
        quotationNumber = latest.quotationNumber;
        version = latest.version + 1;
        if (latest.status === QuotationStatus.DRAFT || latest.status === QuotationStatus.SENT) {
          await quotationsRepository.markQuotationRevised(latest.id, tx);
        }
      } else {
        quotationNumber = await generateDocumentNumber(companyId, SequenceType.QUOTATION);
      }
    } else {
      quotationNumber = await generateDocumentNumber(companyId, SequenceType.QUOTATION);
    }

    const quotation = await quotationsRepository.createQuotation(
      {
        companyId,
        source: input.source,
        enquiryId: resolved.enquiryId,
        customerId: resolved.customerId,
        orderId: resolved.orderId,
        manualCustomer: resolved.manualCustomer,
        quotationNumber,
        version,
        quotationDate: input.quotationDate ?? new Date(),
        subtotal,
        discount,
        cgstPercent,
        sgstPercent,
        tax,
        totalAmount,
        remarks: input.remarks,
        createdById: actorId,
        items: itemsWithAmount,
      },
      tx,
    );

    if (input.source === QuotationSource.ENQUIRY) {
      // Amount/version only. "md files/Enquiry/enq.md" §1: creating a quotation must NOT change the
      // enquiry's status — the two lifecycles are independent, and the user moves the enquiry on
      // when they decide to, not as a side effect of raising a document.
      await enquiriesRepository.updateEnquiry(
        input.enquiryId!,
        { quotationAmount: totalAmount, quotationVersion: version },
        tx,
      );
    }

    return quotation;
  });

  await regeneratePdf(companyId, created);

  await logActivity({
    companyId,
    module: 'QUOTATIONS',
    referenceId: created.id,
    action: 'CREATE',
    description: `Quotation "${created.quotationNumber}" (v${created.version}) created from ${created.source}.`,
    performedById: actorId,
  });

  // Saved as DRAFT by the repository, so anything else the form asked for is applied on top —
  // after the create is logged, so the timeline reads "created" then "marked as ...".
  if (input.status && input.status !== QuotationStatus.DRAFT) {
    return applyFormStatus(companyId, actorId, created.id, input.status, created.source);
  }

  const refreshed = await quotationsRepository.findQuotationById(companyId, created.id);
  return mapDetail(refreshed ?? created);
}

export async function update(companyId: string, actorId: string, id: string, input: UpdateQuotationInput) {
  const existing = await quotationsRepository.findQuotationById(companyId, id);
  if (!existing) throw new AppError(404, 'Quotation not found.');

  // No status-based edit lock: "md files/Enquiry/enq.md" §6/§7 — a quotation stays editable at every
  // stage, including after it has been sent, revised, rejected or approved. The only remaining guard
  // is the one below, which protects banked money rather than the workflow.

  // An approved quotation may already have become an order, whose totalAmount/pendingAmount are
  // stored copies of this quotation's total. Both terminal order statuses are off limits:
  // ORDER_CLOSED is only reachable at a zero balance (orders/service.ts), so re-opening the amount
  // would leave a closed order owing money, and a REJECTED order should not move at all.
  const linkedOrder = await ordersRepository.findOrderByQuotationId(companyId, id);
  if (linkedOrder && (linkedOrder.status === OrderStatus.ORDER_CLOSED || linkedOrder.status === OrderStatus.REJECTED)) {
    throw new AppError(
      400,
      `Cannot edit this quotation because order "${linkedOrder.orderNumber}" is ${linkedOrder.status}.`,
    );
  }

  // The manual customer snapshot only exists on MANUAL quotations.
  if (input.manualCustomer && existing.source !== QuotationSource.MANUAL) {
    throw new AppError(400, 'Customer details can only be edited on a manual quotation.');
  }

  const itemsWithAmount = input.items ? computeItemsWithAmount(input.items) : undefined;
  const subtotal = itemsWithAmount
    ? roundCurrency(itemsWithAmount.reduce((sum, item) => sum + item.amount, 0))
    : Number(existing.subtotal);
  const discount = input.discount ?? Number(existing.discount);
  const cgstPercent = input.cgstPercent ?? Number(existing.cgstPercent);
  const sgstPercent = input.sgstPercent ?? Number(existing.sgstPercent);
  const taxable = subtotal - discount;
  const tax = roundCurrency((taxable * cgstPercent) / 100) + roundCurrency((taxable * sgstPercent) / 100);
  const totalAmount = roundCurrency(subtotal - discount + tax);

  if (totalAmount < 0) {
    throw new AppError(400, 'Total amount cannot be negative. Check the discount amount.', [
      { field: 'discount', message: 'Discount exceeds subtotal plus tax.' },
    ]);
  }

  const { updated, orderTotal } = await prisma.$transaction(async (tx) => {
    const quotation = await quotationsRepository.updateQuotation(
      id,
      {
        quotationDate: input.quotationDate,
        subtotal,
        discount,
        cgstPercent,
        sgstPercent,
        tax,
        totalAmount,
        remarks: input.remarks,
        manualCustomer: input.manualCustomer,
      },
      itemsWithAmount,
      tx,
    );

    const isApproved = existing.status === QuotationStatus.APPROVED;
    // Read back after the write above, so the edited amount is already part of the sum.
    const approvedTotal =
      existing.source === QuotationSource.ENQUIRY && existing.enquiry && isApproved
        ? await quotationsRepository.sumApprovedQuotationTotalForEnquiry(companyId, existing.enquiry.id, tx)
        : null;

    if (existing.source === QuotationSource.ENQUIRY && existing.enquiry) {
      const latest = await quotationsRepository.findLatestQuotationForEnquiry(companyId, existing.enquiry.id, tx);
      const isLatest = Boolean(latest && latest.id === id);
      if (isLatest || isApproved) {
        await enquiriesRepository.updateEnquiry(
          existing.enquiry.id,
          {
            ...(isLatest ? { quotationAmount: totalAmount, quotationVersion: existing.version } : {}),
            // finalBudgetAmount is the combined total of every confirmed quotation (see approve()),
            // so editing one of them has to re-sum rather than overwrite with this one's total.
            ...(approvedTotal !== null ? { finalBudgetAmount: approvedTotal } : {}),
          },
          tx,
        );
      }
    }

    // Keep the order's stored money in step with the quotation it was raised from. Payments already
    // banked are untouched — only the total moves, so the balance absorbs the difference exactly as
    // payments/service.ts computes it (pending = total − paid).
    const effectiveOrderTotal = approvedTotal ?? totalAmount;
    if (linkedOrder) {
      await ordersRepository.updateOrder(
        linkedOrder.id,
        {
          totalAmount: effectiveOrderTotal,
          pendingAmount: roundCurrency(effectiveOrderTotal - Number(linkedOrder.paidAmount)),
        },
        tx,
      );
    }

    return { updated: quotation, orderTotal: effectiveOrderTotal };
  });

  await regeneratePdf(companyId, updated);

  await logActivity({
    companyId,
    module: 'QUOTATIONS',
    referenceId: id,
    action: 'UPDATE',
    description: `Quotation "${existing.quotationNumber}" (v${existing.version}) updated.`,
    performedById: actorId,
  });

  // Logged against the order too, so its timeline explains why the total moved without the reader
  // having to go looking at the quotation.
  if (linkedOrder) {
    await logActivity({
      companyId,
      module: 'ORDERS',
      referenceId: linkedOrder.id,
      action: 'UPDATE',
      description: `Order total changed to ${orderTotal} after quotation "${existing.quotationNumber}" (v${existing.version}) was edited.`,
      performedById: actorId,
    });
  }

  // Applied last, so approve()'s re-sum of the enquiry's final budget and the linked order's total
  // reads the amounts this edit just saved rather than the ones it replaced.
  if (input.status && input.status !== existing.status) {
    return applyFormStatus(companyId, actorId, id, input.status, existing.source);
  }

  const refreshed = await quotationsRepository.findQuotationById(companyId, id);
  return mapDetail(refreshed ?? updated);
}

// SENT/REJECTED only — APPROVED is a dedicated action (see approve()) and REVISED is set
// automatically when a new version supersedes this one (see create()). No current-status check:
// callers may mark any quotation SENT or REJECTED regardless of its existing status.
export async function changeStatus(
  companyId: string,
  actorId: string,
  id: string,
  targetStatus: 'SENT' | 'REJECTED',
  remarks?: string,
) {
  const existing = await quotationsRepository.findQuotationById(companyId, id);
  if (!existing) throw new AppError(404, 'Quotation not found.');

  // No enquiry lifecycle sync. "md files/Enquiry/enq.md" §3: changing a quotation's status must NOT
  // change the enquiry's — sending or rejecting a revision says nothing about where the enquiry
  // itself stands, and the user moves that on deliberately (or via Confirm, see approve()).
  const updated = await quotationsRepository.updateQuotationStatus(id, targetStatus as QuotationStatus);

  await logActivity({
    companyId,
    module: 'QUOTATIONS',
    referenceId: id,
    action: 'STATUS_CHANGE',
    description: `Quotation "${existing.quotationNumber}" (v${existing.version}) marked as ${targetStatus}.${
      remarks ? ` Remarks: ${remarks}` : ''
    }`,
    performedById: actorId,
  });

  return mapDetail(updated);
}

/**
 * "Confirm Quotation" — "md files/Enquiry/enq.md" §5.
 *
 * The one manual action that does move the enquiry on: it marks this quotation confirmed, converts
 * the enquiry to Order Confirmed, and lets the existing flow raise the Order and its Payment Tracker
 * row. Other quotations are left exactly as they are, available as history (§5), and any number of
 * them may be confirmed (§2) — the enquiry's committed figure is their combined total.
 */
export async function approve(companyId: string, actorId: string, id: string) {
  const existing = await quotationsRepository.findQuotationById(companyId, id);
  if (!existing) throw new AppError(404, 'Quotation not found.');

  // Only enquiry-sourced quotations feed the enquiry→order workflow.
  if (existing.source !== QuotationSource.ENQUIRY || !existing.enquiry) {
    throw new AppError(400, 'Only an enquiry-based quotation can be confirmed for conversion to an order.');
  }

  const enquiryId = existing.enquiry.id;
  const enquiryStatusBefore = existing.enquiry.status;

  const { updated, approvedTotal } = await prisma.$transaction(async (tx) => {
    const approved = await quotationsRepository.updateQuotationStatus(id, QuotationStatus.APPROVED, tx);

    // Summed after this quotation is already APPROVED, so it is included. finalBudgetAmount stays a
    // stored, user-editable field — a manual override made later sticks until the next confirmation.
    const total = await quotationsRepository.sumApprovedQuotationTotalForEnquiry(companyId, enquiryId, tx);

    await enquiriesRepository.updateEnquiry(
      enquiryId,
      { quotationAmount: existing.totalAmount, quotationVersion: existing.version, finalBudgetAmount: total },
      tx,
    );

    return { updated: approved, approvedTotal: total };
  });

  await logActivity({
    companyId,
    module: 'QUOTATIONS',
    referenceId: id,
    action: 'APPROVE',
    description: `Quotation "${existing.quotationNumber}" (v${existing.version}) confirmed.`,
    performedById: actorId,
  });

  // Delegated rather than written here: changeStatus() also materialises an unconfirmed prospect
  // into a Customer, logs the transition, and runs the auto-conversion into Orders/Payment Tracker.
  // Skipped when the enquiry is already confirmed, so re-confirming a second quotation does not
  // repeat the transition.
  if (enquiryStatusBefore !== EnquiryStatus.ORDER_CONFIRMED) {
    await enquiriesService.changeStatus(companyId, actorId, enquiryId, EnquiryStatus.ORDER_CONFIRMED);
  }

  // The order is raised from a single quotation, so once more than one is confirmed its total has to
  // be lifted to the combined figure. Banked payments are untouched — only the total moves, and the
  // balance absorbs the difference (pending = total − paid), as payments/service.ts computes it.
  const linkedOrder = await ordersRepository.findOrderByEnquiryId(companyId, enquiryId);
  if (linkedOrder && linkedOrder.status !== OrderStatus.ORDER_CLOSED && linkedOrder.status !== OrderStatus.REJECTED) {
    const totalChanged = roundCurrency(Number(linkedOrder.totalAmount)) !== roundCurrency(approvedTotal);
    // An order raised before any quotation existed (or confirmed straight to Order Confirmed) has
    // quotationId null — the first quotation approved for it afterwards is the one it should point
    // to, so its Quotation tab and downloads stop coming up empty.
    const quotationLinkMissing = !linkedOrder.quotationId;

    if (totalChanged || quotationLinkMissing) {
      await ordersRepository.updateOrder(linkedOrder.id, {
        ...(totalChanged && {
          totalAmount: approvedTotal,
          pendingAmount: roundCurrency(approvedTotal - Number(linkedOrder.paidAmount)),
        }),
        ...(quotationLinkMissing && { quotationId: id }),
      });

      await logActivity({
        companyId,
        module: 'ORDERS',
        referenceId: linkedOrder.id,
        action: 'UPDATE',
        description: totalChanged
          ? `Order total changed to ${approvedTotal} after quotation "${existing.quotationNumber}" (v${existing.version}) was confirmed.`
          : `Order linked to quotation "${existing.quotationNumber}" (v${existing.version}) after it was confirmed.`,
        performedById: actorId,
      });
    }
  }

  return mapDetail(updated);
}

const MAX_QUOTATION_IMAGES = 12;

// Attaches sample decor images to a quotation and regenerates the PDF so they appear on its gallery
// page. `files` carry the already-stored relative path + original name.
export async function addImages(
  companyId: string,
  actorId: string,
  quotationId: string,
  files: { fileName: string; filePath: string }[],
) {
  const quotation = await quotationsRepository.findQuotationById(companyId, quotationId);
  if (!quotation) throw new AppError(404, 'Quotation not found.');

  const existingCount = await quotationsRepository.countQuotationImages(quotationId);
  if (existingCount + files.length > MAX_QUOTATION_IMAGES) {
    throw new AppError(400, `A quotation can hold at most ${MAX_QUOTATION_IMAGES} images.`);
  }

  await quotationsRepository.createQuotationImages(
    files.map((file, index) => ({
      quotationId,
      fileName: file.fileName,
      filePath: file.filePath,
      sortOrder: existingCount + index,
    })),
  );

  const refreshed = await quotationsRepository.findQuotationById(companyId, quotationId);
  if (refreshed) await regeneratePdf(companyId, refreshed);

  await logActivity({
    companyId,
    module: 'QUOTATIONS',
    referenceId: quotationId,
    action: 'UPDATE',
    description: `${files.length} sample image(s) added to quotation "${quotation.quotationNumber}".`,
    performedById: actorId,
  });

  return mapDetail(refreshed ?? quotation);
}

export async function removeImage(companyId: string, actorId: string, quotationId: string, imageId: string) {
  const quotation = await quotationsRepository.findQuotationById(companyId, quotationId);
  if (!quotation) throw new AppError(404, 'Quotation not found.');

  const image = await quotationsRepository.findQuotationImageById(imageId);
  if (!image || image.quotationId !== quotationId) throw new AppError(404, 'Image not found.');

  await quotationsRepository.softDeleteQuotationImage(imageId);

  const refreshed = await quotationsRepository.findQuotationById(companyId, quotationId);
  if (refreshed) await regeneratePdf(companyId, refreshed);

  await logActivity({
    companyId,
    module: 'QUOTATIONS',
    referenceId: quotationId,
    action: 'UPDATE',
    description: `Sample image removed from quotation "${quotation.quotationNumber}".`,
    performedById: actorId,
  });

  return mapDetail(refreshed ?? quotation);
}

// Returns an absolute filesystem path to the PDF, generating it on demand if it was never rendered
// or the file is missing (e.g. after a storage reset). Used by the authenticated download route.
export async function getPdfForDownload(companyId: string, id: string) {
  const quotation = await quotationsRepository.findQuotationById(companyId, id);
  if (!quotation) throw new AppError(404, 'Quotation not found.');

  let relativePath = quotation.pdfPath;
  const exists = relativePath ? fs.existsSync(path.resolve(env.uploadPath, relativePath)) : false;
  if (!relativePath || !exists) {
    relativePath = await regeneratePdf(companyId, quotation);
    if (!relativePath) throw new AppError(500, 'Unable to generate the quotation PDF.');
  }

  return {
    absolutePath: path.resolve(env.uploadPath, relativePath),
    fileName: `${quotation.quotationNumber}-v${quotation.version}.pdf`,
  };
}
