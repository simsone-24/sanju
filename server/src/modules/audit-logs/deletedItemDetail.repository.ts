import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { LogKey, ParentKey, resolveDeleters } from './deletedItems.repository';
import {
  DeletedItemDetail,
  DeletedItemHistoryEntry,
  DeletedItemType,
  DetailBadgeType,
  DetailField,
  DetailSection,
  RelatedGroup,
  RelatedRestoreEffect,
} from './types';

// ---------------------------------------------------------------------------------------------
// Small builders, so each kind below reads as a list of what to show rather than as plumbing.
// ---------------------------------------------------------------------------------------------

const text = (label: string, value: string | number | null | undefined): DetailField => ({
  label,
  value: value === null || value === undefined || value === '' ? null : String(value),
  format: 'text',
});

const currency = (label: string, value: Prisma.Decimal | null | undefined): DetailField => ({
  label,
  value: value === null || value === undefined ? null : value.toString(),
  format: 'currency',
});

const dateField = (label: string, value: Date | null | undefined): DetailField => ({
  label,
  value: value ? value.toISOString() : null,
  format: 'date',
});

const datetime = (label: string, value: Date | null | undefined): DetailField => ({
  label,
  value: value ? value.toISOString() : null,
  format: 'datetime',
});

const badge = (label: string, value: string, type: DetailBadgeType): DetailField => ({
  label,
  value,
  format: 'badge',
  badge: type,
});

/** "ENQ-2026-00012", or "ENQ-2026-00012 (deleted)" when that parent is itself deleted. */
const referenceWithState = (reference: string, deletedAt: Date | null): string =>
  deletedAt ? `${reference} (deleted)` : reference;

/**
 * What restoring the record would do with a related one. A cascade stamps everything it removes with
 * one instant, so a child carrying the parent's exact deletion time returns with it; one deleted at
 * another time was removed on its own and stays deleted.
 */
function effectOf(childDeletedAt: Date | null, parentStamp: Date): RelatedRestoreEffect {
  if (childDeletedAt === null) return 'live';
  return childDeletedAt.getTime() === parentStamp.getTime() ? 'returns' : 'stays_deleted';
}

/** What every kind's builder hands back; the shared tail (deleter, history) is added around it. */
interface Built {
  id: number;
  reference: string;
  title: string;
  amount: string | null;
  deletedAt: Date;
  own: LogKey;
  parents: ParentKey[];
  /** Activity-log keys whose entries make up this record's history. */
  historyKeys: LogKey[];
  /**
   * Entries logged against another record that are still about this one — a payment collected through
   * the Payment Tracker is logged on its order, with the receipt number only in the text.
   */
  historyMentions?: { keys: LogKey[]; contains: string };
  sections: DetailSection[];
  related: RelatedGroup[];
}

type Builder = (companyId: number, id: number) => Promise<Built | null>;

const DELETED = { not: null } as const;

// ---------------------------------------------------------------------------------------------
// One builder per kind.
// ---------------------------------------------------------------------------------------------

const enquiry: Builder = async (companyId, id) => {
  const record = await prisma.enquiry.findFirst({
    where: { id, companyId, deletedAt: DELETED },
    select: {
      id: true,
      enquiryNumber: true,
      status: true,
      prospectName: true,
      prospectMobile: true,
      prospectWhatsapp: true,
      prospectEmail: true,
      prospectAddress: true,
      prospectCity: true,
      eventName: true,
      eventDate: true,
      eventTime: true,
      estimatedBudget: true,
      notes: true,
      appointmentDate: true,
      appointmentTime: true,
      meetingLocation: true,
      appointmentNotes: true,
      followUpDate: true,
      quotationAmount: true,
      quotationVersion: true,
      finalBudgetAmount: true,
      advanceAmount: true,
      createdAt: true,
      deletedAt: true,
      customer: { select: { customerCode: true, customerName: true, mobile: true, whatsapp: true, email: true, address: true, city: true } },
      eventType: { select: { eventName: true } },
      assignedUser: { select: { fullName: true } },
      eventManager: { select: { fullName: true } },
      quotations: {
        select: { quotationNumber: true, version: true, totalAmount: true, status: true, deletedAt: true },
        orderBy: { version: 'asc' },
      },
      orders: { select: { orderNumber: true, totalAmount: true, status: true, deletedAt: true }, orderBy: { id: 'asc' } },
    },
  });
  if (!record || !record.deletedAt) return null;
  const stamp = record.deletedAt;
  const customer = record.customer;

  return {
    id: record.id,
    reference: record.enquiryNumber,
    title: customer?.customerName ?? record.prospectName ?? '—',
    deletedAt: stamp,
    amount: null,
    own: { module: 'ENQUIRIES', referenceId: record.id },
    parents: [],
    historyKeys: [{ module: 'ENQUIRIES', referenceId: record.id }],
    sections: [
      {
        title: 'Customer',
        fields: [
          text('Name', customer?.customerName ?? record.prospectName),
          text('Customer code', customer?.customerCode),
          text('Mobile', customer?.mobile ?? record.prospectMobile),
          text('WhatsApp', customer?.whatsapp ?? record.prospectWhatsapp),
          text('Email', customer?.email ?? record.prospectEmail),
          text('City', customer?.city ?? record.prospectCity),
          text('Address', customer?.address ?? record.prospectAddress),
        ],
      },
      {
        title: 'Event',
        fields: [
          text('Event name', record.eventName),
          text('Event type', record.eventType?.eventName),
          dateField('Event date', record.eventDate),
          text('Event time', record.eventTime),
          currency('Estimated budget', record.estimatedBudget),
          text('Notes', record.notes),
        ],
      },
      {
        title: 'Appointment',
        fields: [
          dateField('Appointment date', record.appointmentDate),
          text('Appointment time', record.appointmentTime),
          text('Meeting location', record.meetingLocation),
          text('Appointment notes', record.appointmentNotes),
          dateField('Follow-up date', record.followUpDate),
        ],
      },
      {
        title: 'Quotation & budget',
        fields: [
          currency('Latest quotation amount', record.quotationAmount),
          text('Latest quotation version', record.quotationVersion),
          currency('Final budget', record.finalBudgetAmount),
          currency('Advance', record.advanceAmount),
        ],
      },
      {
        title: 'Status & assignment',
        fields: [
          badge('Status', record.status, 'enquiry'),
          text('Assigned to', record.assignedUser?.fullName),
          text('Event manager', record.eventManager?.fullName),
          datetime('Created on', record.createdAt),
        ],
      },
    ],
    related: [
      {
        title: 'Quotations',
        items: record.quotations.map((quotation) => ({
          reference: `${quotation.quotationNumber} (v${quotation.version})`,
          description: null,
          amount: quotation.totalAmount.toString(),
          status: quotation.status,
          badge: 'quotation' as const,
          effect: effectOf(quotation.deletedAt, stamp),
        })),
      },
      {
        title: 'Orders',
        items: record.orders.map((order) => ({
          reference: order.orderNumber,
          description: null,
          amount: order.totalAmount.toString(),
          status: order.status,
          badge: 'order' as const,
          effect: effectOf(order.deletedAt, stamp),
        })),
      },
    ],
  };
};

const quotation: Builder = async (companyId, id) => {
  const record = await prisma.quotation.findFirst({
    where: { id, companyId, deletedAt: DELETED },
    select: {
      id: true,
      quotationNumber: true,
      version: true,
      source: true,
      status: true,
      quotationDate: true,
      subtotal: true,
      discount: true,
      cgstPercent: true,
      sgstPercent: true,
      tax: true,
      totalAmount: true,
      advanceAmount: true,
      remarks: true,
      manualCustomerName: true,
      manualPhone: true,
      manualEmail: true,
      manualAddress: true,
      manualGst: true,
      createdAt: true,
      deletedAt: true,
      createdBy: { select: { fullName: true } },
      customer: { select: { customerName: true, mobile: true, email: true, address: true } },
      enquiry: {
        select: {
          id: true,
          enquiryNumber: true,
          prospectName: true,
          deletedAt: true,
          customer: { select: { customerName: true } },
        },
      },
      sourceOrder: { select: { orderNumber: true, deletedAt: true } },
      items: {
        select: { itemName: true, description: true, sizeQty: true, quantity: true, unit: true, rate: true, amount: true },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      },
    },
  });
  if (!record || !record.deletedAt) return null;

  const customerName =
    record.customer?.customerName ??
    record.manualCustomerName ??
    record.enquiry?.customer?.customerName ??
    record.enquiry?.prospectName;

  return {
    id: record.id,
    reference: record.quotationNumber,
    title: customerName ?? '—',
    deletedAt: record.deletedAt,
    amount: record.totalAmount.toString(),
    own: { module: 'QUOTATIONS', referenceId: record.id },
    parents: record.enquiry
      ? [{ module: 'ENQUIRIES', referenceId: record.enquiry.id, label: `Enquiry ${record.enquiry.enquiryNumber}` }]
      : [],
    historyKeys: [{ module: 'QUOTATIONS', referenceId: record.id }],
    sections: [
      {
        title: 'Quotation',
        fields: [
          text('Quotation number', record.quotationNumber),
          text('Version', record.version),
          text('Source', record.source),
          badge('Status', record.status, 'quotation'),
          dateField('Quotation date', record.quotationDate),
          text('Enquiry', record.enquiry && referenceWithState(record.enquiry.enquiryNumber, record.enquiry.deletedAt)),
          text('Raised from order', record.sourceOrder && referenceWithState(record.sourceOrder.orderNumber, record.sourceOrder.deletedAt)),
          text('Created by', record.createdBy?.fullName),
          datetime('Created on', record.createdAt),
        ],
      },
      {
        title: 'Customer',
        fields: [
          text('Name', customerName),
          text('Phone', record.customer?.mobile ?? record.manualPhone),
          text('Email', record.customer?.email ?? record.manualEmail),
          text('Address', record.customer?.address ?? record.manualAddress),
          text('GST', record.manualGst),
        ],
      },
      {
        title: 'Amounts',
        fields: [
          currency('Subtotal', record.subtotal),
          currency('Discount', record.discount),
          text('CGST', `${record.cgstPercent.toString()}%`),
          text('SGST', `${record.sgstPercent.toString()}%`),
          currency('Tax', record.tax),
          currency('Total', record.totalAmount),
          currency('Advance', record.advanceAmount),
        ],
      },
      { title: 'Remarks', fields: [text('Remarks', record.remarks)] },
    ],
    related: [
      {
        title: 'Items',
        items: record.items.map((item) => ({
          reference: item.itemName,
          description:
            [
              item.description,
              item.sizeQty,
              item.quantity !== null
                ? `${item.quantity.toString()}${item.unit ? ` ${item.unit}` : ''}${item.rate !== null ? ` × ${item.rate.toString()}` : ''}`
                : null,
            ]
              .filter(Boolean)
              .join(' · ') || null,
          amount: item.amount?.toString() ?? null,
          status: null,
          effect: 'live' as const,
        })),
      },
    ],
  };
};

const order: Builder = async (companyId, id) => {
  const record = await prisma.order.findFirst({
    where: { id, companyId, deletedAt: DELETED },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      eventDate: true,
      venue: true,
      notes: true,
      remarks: true,
      cancellationReason: true,
      totalAmount: true,
      paidAmount: true,
      pendingAmount: true,
      createdAt: true,
      deletedAt: true,
      customer: { select: { customerName: true, mobile: true, email: true, city: true } },
      enquiry: {
        select: { id: true, enquiryNumber: true, eventName: true, eventTime: true, deletedAt: true, eventType: { select: { eventName: true } } },
      },
      coordinator: { select: { fullName: true } },
      payments: {
        select: { receiptNumber: true, paymentDate: true, paymentMethod: true, paymentType: true, amount: true, deletedAt: true },
        orderBy: { paymentDate: 'asc' },
      },
      invoice: { select: { invoiceNumber: true, invoiceDate: true, deletedAt: true } },
      documents: { select: { fileName: true, documentType: true, deletedAt: true }, orderBy: { id: 'asc' } },
      taskGroups: { select: { id: true } },
    },
  });
  if (!record || !record.deletedAt) return null;
  const stamp = record.deletedAt;

  return {
    id: record.id,
    reference: record.orderNumber,
    title: record.customer.customerName,
    deletedAt: stamp,
    amount: record.totalAmount.toString(),
    own: { module: 'ORDERS', referenceId: record.id },
    parents: [
      { module: 'ENQUIRIES', referenceId: record.enquiry.id, label: `Enquiry ${record.enquiry.enquiryNumber}` },
    ],
    // The Payment Tracker logs against the order's id too, so its entries belong in the same history.
    historyKeys: [
      { module: 'ORDERS', referenceId: record.id },
      { module: 'PAYMENT_TRACKER', referenceId: record.id },
    ],
    sections: [
      {
        title: 'Order',
        fields: [
          text('Order number', record.orderNumber),
          badge('Status', record.status, 'order'),
          text('Enquiry', referenceWithState(record.enquiry.enquiryNumber, record.enquiry.deletedAt)),
          text('Event', record.enquiry.eventName),
          text('Event type', record.enquiry.eventType?.eventName),
          dateField('Event date', record.eventDate),
          text('Event time', record.enquiry.eventTime),
          text('Venue', record.venue),
          text('Coordinator', record.coordinator?.fullName),
          text('Task groups', record.taskGroups.length),
          datetime('Created on', record.createdAt),
        ],
      },
      {
        title: 'Customer',
        fields: [
          text('Name', record.customer.customerName),
          text('Mobile', record.customer.mobile),
          text('Email', record.customer.email),
          text('City', record.customer.city),
        ],
      },
      {
        title: 'Money',
        fields: [
          currency('Budget', record.totalAmount),
          currency('Collected', record.paidAmount),
          currency('Balance', record.pendingAmount),
        ],
      },
      {
        title: 'Notes',
        fields: [text('Notes', record.notes), text('Remarks', record.remarks), text('Cancellation reason', record.cancellationReason)],
      },
    ],
    related: [
      {
        title: 'Payments',
        items: record.payments.map((payment) => ({
          reference: payment.receiptNumber,
          description: `${payment.paymentDate.toISOString().slice(0, 10)} · ${payment.paymentMethod} · ${payment.paymentType}`,
          amount: payment.amount.toString(),
          status: null,
          effect: effectOf(payment.deletedAt, stamp),
        })),
      },
      {
        title: 'Invoice',
        items: record.invoice
          ? [
              {
                reference: record.invoice.invoiceNumber,
                description: record.invoice.invoiceDate.toISOString().slice(0, 10),
                amount: null,
                status: null,
                effect: effectOf(record.invoice.deletedAt, stamp),
              },
            ]
          : [],
      },
      {
        title: 'Documents',
        items: record.documents.map((document) => ({
          reference: document.fileName,
          description: document.documentType,
          amount: null,
          status: null,
          effect: effectOf(document.deletedAt, stamp),
        })),
      },
    ],
  };
};

const payment: Builder = async (companyId, id) => {
  const record = await prisma.payment.findFirst({
    where: { id, deletedAt: DELETED, order: { companyId } },
    select: {
      id: true,
      receiptNumber: true,
      paymentDate: true,
      paymentType: true,
      amount: true,
      paymentMethod: true,
      referenceNumber: true,
      remarks: true,
      createdAt: true,
      deletedAt: true,
      receivedBy: { select: { fullName: true } },
      order: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalAmount: true,
          paidAmount: true,
          pendingAmount: true,
          deletedAt: true,
          customer: { select: { customerName: true } },
          enquiry: { select: { id: true, enquiryNumber: true } },
        },
      },
    },
  });
  if (!record || !record.deletedAt) return null;

  return {
    id: record.id,
    reference: record.receiptNumber,
    title: record.order.customer.customerName,
    deletedAt: record.deletedAt,
    amount: record.amount.toString(),
    own: { module: 'PAYMENTS', referenceId: record.id },
    parents: [
      { module: 'ORDERS', referenceId: record.order.id, label: `Order ${record.order.orderNumber}` },
      { module: 'ENQUIRIES', referenceId: record.order.enquiry.id, label: `Enquiry ${record.order.enquiry.enquiryNumber}` },
    ],
    historyKeys: [{ module: 'PAYMENTS', referenceId: record.id }],
    historyMentions: {
      keys: [
        { module: 'PAYMENT_TRACKER', referenceId: record.order.id },
        { module: 'ORDERS', referenceId: record.order.id },
      ],
      contains: record.receiptNumber,
    },
    sections: [
      {
        title: 'Payment',
        fields: [
          text('Receipt number', record.receiptNumber),
          currency('Amount', record.amount),
          text('Type', record.paymentType),
          text('Method', record.paymentMethod),
          dateField('Payment date', record.paymentDate),
          text('Reference number', record.referenceNumber),
          text('Received by', record.receivedBy?.fullName),
          text('Remarks', record.remarks),
          datetime('Recorded on', record.createdAt),
        ],
      },
      {
        title: 'Order',
        fields: [
          text('Order', referenceWithState(record.order.orderNumber, record.order.deletedAt)),
          text('Customer', record.order.customer.customerName),
          badge('Order status', record.order.status, 'order'),
          currency('Budget', record.order.totalAmount),
          currency('Collected now', record.order.paidAmount),
          currency('Balance now', record.order.pendingAmount),
        ],
      },
    ],
    related: [],
  };
};

const expense: Builder = async (companyId, id) => {
  const record = await prisma.expense.findFirst({
    where: { id, companyId, deletedAt: DELETED },
    select: {
      id: true,
      expenseDate: true,
      amount: true,
      paymentMethod: true,
      paidTo: true,
      description: true,
      createdAt: true,
      deletedAt: true,
      category: { select: { name: true, deletedAt: true } },
      createdBy: { select: { fullName: true } },
      receipts: { select: { fileName: true, deletedAt: true }, orderBy: { id: 'asc' } },
    },
  });
  if (!record || !record.deletedAt) return null;

  return {
    id: record.id,
    reference: `#${record.id}`,
    title: record.category.name,
    deletedAt: record.deletedAt,
    amount: record.amount.toString(),
    own: { module: 'EXPENSES', referenceId: record.id },
    parents: [],
    historyKeys: [{ module: 'EXPENSES', referenceId: record.id }],
    sections: [
      {
        title: 'Expense',
        fields: [
          dateField('Date', record.expenseDate),
          text('Category', referenceWithState(record.category.name, record.category.deletedAt)),
          currency('Amount', record.amount),
          text('Payment method', record.paymentMethod),
          text('Paid to', record.paidTo),
          text('Description', record.description),
          text('Created by', record.createdBy?.fullName),
          datetime('Created on', record.createdAt),
        ],
      },
    ],
    related: [
      {
        title: 'Receipts',
        // Deleting an expense leaves its receipts untouched, so they are live and come back with it.
        items: record.receipts.map((receipt) => ({
          reference: receipt.fileName,
          description: null,
          amount: null,
          status: null,
          effect: receipt.deletedAt ? ('stays_deleted' as const) : ('live' as const),
        })),
      },
    ],
  };
};

const user: Builder = async (companyId, id) => {
  const record = await prisma.user.findFirst({
    where: { id, companyId, deletedAt: DELETED },
    select: {
      id: true,
      fullName: true,
      username: true,
      employeeCode: true,
      email: true,
      mobile: true,
      city: true,
      isActive: true,
      createdAt: true,
      deletedAt: true,
      userGroup: { select: { groupName: true, deletedAt: true } },
    },
  });
  if (!record || !record.deletedAt) return null;

  return {
    id: record.id,
    reference: record.username,
    title: record.fullName,
    deletedAt: record.deletedAt,
    amount: null,
    own: { module: 'USERS', referenceId: record.id },
    parents: [],
    historyKeys: [{ module: 'USERS', referenceId: record.id }],
    sections: [
      {
        title: 'Profile',
        fields: [
          text('Full name', record.fullName),
          text('Username', record.username),
          text('Employee code', record.employeeCode),
          text('Email', record.email),
          text('Mobile', record.mobile),
          text('City', record.city),
          text('User group', referenceWithState(record.userGroup.groupName, record.userGroup.deletedAt)),
          text('Active', record.isActive ? 'Yes' : 'No'),
          datetime('Created on', record.createdAt),
        ],
      },
    ],
    related: [],
  };
};

const BUILDERS: Record<DeletedItemType, Builder> = {
  ENQUIRIES: enquiry,
  QUOTATIONS: quotation,
  ORDERS: order,
  PAYMENTS: payment,
  EXPENSES: expense,
  USERS: user,
};

/** Everything the record's own history shows — newest first, capped so a busy record stays light. */
async function loadHistory(
  companyId: number,
  keys: LogKey[],
  mentions?: { keys: LogKey[]; contains: string },
): Promise<DeletedItemHistoryEntry[]> {
  const own = keys.map((key) => ({ module: key.module, referenceId: key.referenceId }));
  const mentioning: Prisma.ActivityLogWhereInput[] = mentions
    ? [
        {
          OR: mentions.keys.map((key) => ({ module: key.module, referenceId: key.referenceId })),
          description: { contains: mentions.contains },
        },
      ]
    : [];

  return prisma.activityLog.findMany({
    where: { companyId, OR: [...own, ...mentioning] },
    orderBy: [{ performedAt: 'desc' }, { id: 'desc' }],
    take: 200,
    select: {
      id: true,
      module: true,
      action: true,
      description: true,
      performedAt: true,
      performedBy: { select: { id: true, fullName: true } },
    },
  });
}

/** One deleted record in full, or null when there is no such record (or it is not deleted). */
export async function getDeletedItemDetail(
  companyId: number,
  type: DeletedItemType,
  id: number,
): Promise<DeletedItemDetail | null> {
  const built = await BUILDERS[type](companyId, id);
  if (!built) return null;

  const [[attribution], history] = await Promise.all([
    resolveDeleters(companyId, [{ own: built.own, parents: built.parents }]),
    loadHistory(companyId, built.historyKeys, built.historyMentions),
  ]);

  return {
    type,
    id: built.id,
    reference: built.reference,
    title: built.title,
    amount: built.amount,
    deletedAt: built.deletedAt,
    deletedBy: attribution.deletedBy,
    deletedWith: attribution.deletedWith,
    // Empty groups (an order with no invoice) would only be noise on the page.
    sections: built.sections,
    related: built.related.filter((group) => group.items.length > 0),
    history,
  };
}
