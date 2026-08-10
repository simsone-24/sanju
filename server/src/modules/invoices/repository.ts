import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaClientOrTx, prisma } from '../../config/prisma';

// Everything an invoice prints, in one read: the order's own money, the customer it bills, the
// approved quotation's line items and tax breakdown, and the receipts collected against it.
const invoiceSourceSelect = {
  id: true,
  orderNumber: true,
  eventDate: true,
  venue: true,
  totalAmount: true,
  paidAmount: true,
  pendingAmount: true,
  customer: { select: { customerName: true, mobile: true, email: true, address: true } },
  enquiry: { select: { eventName: true, eventType: { select: { eventName: true } } } },
  quotation: {
    select: {
      quotationNumber: true,
      subtotal: true,
      discount: true,
      cgstPercent: true,
      sgstPercent: true,
      tax: true,
      totalAmount: true,
      items: {
        orderBy: { sortOrder: 'asc' },
        select: { itemName: true, description: true, quantity: true, unit: true, rate: true, amount: true },
      },
    },
  },
  payments: {
    where: { deletedAt: null },
    orderBy: { paymentDate: 'asc' },
    select: {
      paymentDate: true,
      paymentType: true,
      paymentMethod: true,
      receiptNumber: true,
      referenceNumber: true,
      amount: true,
    },
  },
} satisfies Prisma.OrderSelect;

export type InvoiceSource = Prisma.OrderGetPayload<{ select: typeof invoiceSourceSelect }>;

// A rejected order is not billable, so it has no invoice to raise.
export function findInvoiceSource(companyId: string, orderId: string, client: PrismaClientOrTx = prisma) {
  return client.order.findFirst({
    where: { id: orderId, companyId, deletedAt: null, status: { not: OrderStatus.REJECTED } },
    select: invoiceSourceSelect,
  });
}

export function findInvoiceByOrderId(companyId: string, orderId: string, client: PrismaClientOrTx = prisma) {
  return client.invoice.findFirst({
    where: { orderId, companyId, deletedAt: null },
    select: { id: true, invoiceNumber: true, invoiceDate: true },
  });
}

export function createInvoice(data: Prisma.InvoiceUncheckedCreateInput, client: PrismaClientOrTx = prisma) {
  return client.invoice.create({ data, select: { id: true, invoiceNumber: true, invoiceDate: true } });
}

export function findCompanyForInvoice(companyId: string, client: PrismaClientOrTx = prisma) {
  return client.company.findUnique({
    where: { id: companyId },
    select: {
      companyName: true,
      address: true,
      gstNumber: true,
      mobile: true,
      email: true,
      website: true,
      logo: true,
      bankName: true,
      bankAccountName: true,
      bankAccountNumber: true,
      bankBranch: true,
      bankIfsc: true,
      bankUpi: true,
      authorizedSignatory: true,
      footerMessage: true,
      termsAndConditions: true,
    },
  });
}
