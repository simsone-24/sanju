import path from 'path';
import { Prisma, SequenceType } from '@prisma/client';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';
import { logActivity } from '../../utils/activityLogger';
import { generateDocumentNumber } from '../../utils/numberGenerator';
import * as invoicesRepository from './repository';
import { generateInvoicePdf } from './pdf';
import { InvoiceResult } from './types';

/**
 * The invoice for an order, issuing its number the first time it is asked for.
 *
 * Number and date are allocated once and stored (see the Invoice model): a tax document that
 * renumbered or re-dated itself on every reprint would be worthless. Everything else is read live,
 * so a payment collected after the invoice was first opened shows up on the next print.
 */
export async function getForOrder(companyId: string, actorId: string, orderId: string): Promise<InvoiceResult> {
  const source = await invoicesRepository.findInvoiceSource(companyId, orderId);
  if (!source) throw new AppError(404, 'No invoice is available for this order.');

  const company = await invoicesRepository.findCompanyForInvoice(companyId);
  if (!company) throw new AppError(404, 'Company details are not configured.');

  const invoice = await issueInvoice(companyId, actorId, orderId, source.orderNumber);

  // An order raised from an enquiry confirmed without a quotation has no line items to itemise:
  // the invoice then bills the order's own total as a single adjustment line (see `adjustment`),
  // and everything the quotation would have contributed reads as zero.
  const quotation = source.quotation;
  const quotationTotal = quotation ? Number(quotation.totalAmount) : 0;
  const totalAmount = Number(source.totalAmount);

  return {
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoice.invoiceDate,
    company,
    order: {
      id: source.id,
      orderNumber: source.orderNumber,
      eventDate: source.eventDate,
      venue: source.venue,
      eventName: source.enquiry?.eventName || source.enquiry?.eventType.eventName || '',
    },
    customer: source.customer,
    quotationNumber: quotation?.quotationNumber ?? null,
    items: (quotation?.items ?? []).map((item) => ({
      itemName: item.itemName,
      description: item.description,
      quantity: Number(item.quantity),
      unit: item.unit,
      rate: Number(item.rate),
      amount: Number(item.amount),
    })),
    subtotal: quotation ? Number(quotation.subtotal) : 0,
    discount: quotation ? Number(quotation.discount) : 0,
    cgstPercent: quotation ? Number(quotation.cgstPercent) : 0,
    sgstPercent: quotation ? Number(quotation.sgstPercent) : 0,
    tax: quotation ? Number(quotation.tax) : 0,
    adjustment: roundMoney(totalAmount - quotationTotal),
    totalAmount,
    paidAmount: Number(source.paidAmount),
    balanceDue: Number(source.pendingAmount),
    payments: source.payments.map((payment) => ({
      paymentDate: payment.paymentDate,
      paymentType: payment.paymentType,
      paymentMethod: payment.paymentMethod,
      receiptNumber: payment.receiptNumber,
      referenceNumber: payment.referenceNumber,
      amount: Number(payment.amount),
    })),
  };
}

// Decimal arithmetic on floats can leave a trailing 0.00000001 that would print as a stray line.
function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

// Absolute filesystem path to a freshly-rendered invoice PDF, for the authenticated download route.
// Unlike a quotation's PDF, nothing here is cached: paid/balance and the receipts list can change
// after the invoice is first opened, so every download regenerates from the live figures.
export async function getPdfForDownload(companyId: string, actorId: string, orderId: string) {
  const invoice = await getForOrder(companyId, actorId, orderId);

  const pdfPath = await generateInvoicePdf(
    orderId,
    {
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      order: invoice.order,
      customer: invoice.customer,
      quotationNumber: invoice.quotationNumber,
      items: invoice.items,
      subtotal: invoice.subtotal,
      discount: invoice.discount,
      cgstPercent: invoice.cgstPercent,
      sgstPercent: invoice.sgstPercent,
      adjustment: invoice.adjustment,
      totalAmount: invoice.totalAmount,
      paidAmount: invoice.paidAmount,
      balanceDue: invoice.balanceDue,
      payments: invoice.payments.map((payment) => ({
        paymentDate: payment.paymentDate,
        paymentMethod: payment.paymentMethod,
        receiptNumber: payment.receiptNumber,
        referenceNumber: payment.referenceNumber,
        amount: payment.amount,
      })),
    },
    {
      companyName: invoice.company.companyName,
      address: invoice.company.address,
      gstNumber: invoice.company.gstNumber,
      mobile: invoice.company.mobile,
      email: invoice.company.email,
      website: invoice.company.website,
      logoAbsolutePath: invoice.company.logo ? path.resolve(env.uploadPath, invoice.company.logo) : null,
      bankName: invoice.company.bankName,
      bankAccountName: invoice.company.bankAccountName,
      bankAccountNumber: invoice.company.bankAccountNumber,
      bankBranch: invoice.company.bankBranch,
      bankIfsc: invoice.company.bankIfsc,
      bankUpi: invoice.company.bankUpi,
      authorizedSignatory: invoice.company.authorizedSignatory,
      footerMessage: invoice.company.footerMessage,
      termsAndConditions: invoice.company.termsAndConditions,
    },
  );

  return {
    absolutePath: path.resolve(env.uploadPath, pdfPath),
    fileName: `${invoice.invoiceNumber}.pdf`,
  };
}

async function issueInvoice(companyId: string, actorId: string, orderId: string, orderNumber: string) {
  const existing = await invoicesRepository.findInvoiceByOrderId(companyId, orderId);
  if (existing) return existing;

  const invoiceNumber = await generateDocumentNumber(companyId, SequenceType.INVOICE);

  try {
    const created = await invoicesRepository.createInvoice({
      companyId,
      orderId,
      invoiceNumber,
      invoiceDate: new Date(),
      issuedById: actorId,
    });

    await logActivity({
      companyId,
      module: 'INVOICES',
      referenceId: orderId,
      action: 'CREATE',
      description: `Invoice "${invoiceNumber}" issued for order "${orderNumber}".`,
      performedById: actorId,
    });

    return created;
  } catch (error) {
    // Two people opening the invoice at the same moment both reach the create; orderId is unique, so
    // the loser reads the winner's row instead of failing. The number it drew is simply not used.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const raced = await invoicesRepository.findInvoiceByOrderId(companyId, orderId);
      if (raced) return raced;
    }
    throw error;
  }
}
