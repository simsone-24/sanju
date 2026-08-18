import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { env } from '../../config/env';

export interface InvoicePdfItem {
  itemName: string;
  description: string | null;
  quantity: number;
  unit: string | null;
  rate: number;
  amount: number;
}

export interface InvoicePdfPayment {
  paymentDate: Date;
  paymentMethod: string;
  receiptNumber: string;
  referenceNumber: string | null;
  amount: number;
}

export interface InvoicePdfData {
  invoiceNumber: string;
  invoiceDate: Date;
  order: { orderNumber: string; eventDate: Date | null; venue: string | null; eventName: string };
  customer: { customerName: string; mobile: string; email: string | null; address: string | null };
  quotationNumber: string | null;
  items: InvoicePdfItem[];
  subtotal: number;
  discount: number;
  cgstPercent: number;
  sgstPercent: number;
  adjustment: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  payments: InvoicePdfPayment[];
}

export interface InvoiceCompanyPdfData {
  companyName: string;
  address: string | null;
  gstNumber: string | null;
  mobile: string | null;
  email: string | null;
  website: string | null;
  logoAbsolutePath: string | null;
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  bankBranch: string | null;
  bankIfsc: string | null;
  bankUpi: string | null;
  authorizedSignatory: string | null;
  footerMessage: string | null;
  termsAndConditions: string | null;
}

function num(value: number): string {
  return value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(value: Date): string {
  return value.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

const MARGIN = 40;
const GREEN = '#4e9a2a';
const INK = '#1a1a1a';
const MUTED = '#555555';

// A4 tax invoice mirroring the on-screen InvoiceSheet (client/src/pages/payment-tracker/InvoicePage.tsx):
// letterhead, TAX INVOICE pill, Bill To / Event Details, an items table, bank + totals with a
// Balance Due pill, receipts already collected, terms, signature. Regenerated fresh on every
// download — unlike a quotation, the money on an invoice (paid/balance, receipts) can change after
// it is first opened, so nothing here is cached to disk between requests.
export async function generateInvoicePdf(
  orderId: number,
  data: InvoicePdfData,
  company: InvoiceCompanyPdfData,
): Promise<string> {
  const destinationDir = path.join(env.uploadPath, 'invoices');
  fs.mkdirSync(destinationDir, { recursive: true });
  const fileName = `${orderId}.pdf`;
  const absolutePath = path.join(destinationDir, fileName);

  const doc = new PDFDocument({ size: 'A4', margin: MARGIN });
  const stream = fs.createWriteStream(absolutePath);
  doc.pipe(stream);

  const left = MARGIN;
  const right = doc.page.width - MARGIN;
  const contentWidth = right - left;

  // ---- Header band: gradient + TAX INVOICE pill + logo ----------------------
  const bandHeight = 96;
  const gradient = doc.linearGradient(0, 0, doc.page.width, 0);
  gradient.stop(0, GREEN).stop(0.5, '#8bc34a').stop(0.78, '#dcedc8').stop(1, '#ffffff');
  doc.rect(0, 0, doc.page.width, bandHeight).fill(gradient);

  doc.roundedRect(left, 30, 200, 42, 21).lineWidth(2).fillAndStroke('#ffffff', '#111111');
  doc.fillColor('#111111').font('Helvetica-Bold').fontSize(17).text('TAX INVOICE', left, 43, { width: 200, align: 'center' });

  if (company.logoAbsolutePath && fs.existsSync(company.logoAbsolutePath)) {
    try {
      doc.image(company.logoAbsolutePath, right - 90, 22, { fit: [90, 56], align: 'right' });
    } catch {
      // Unsupported image format (e.g. WebP) — skip the logo.
    }
  }

  // ---- Meta: Date / Invoice No ---------------------------------------------
  let y = bandHeight + 20;
  doc.font('Helvetica').fontSize(9).fillColor(MUTED).text('Date', left, y);
  doc.font('Helvetica-Bold').fillColor(INK).text(formatDate(data.invoiceDate), left + 60, y);
  doc.font('Helvetica').fillColor(MUTED).text('Invoice No', left, y + 14);
  doc.font('Helvetica-Bold').fillColor(INK).text(data.invoiceNumber, left + 60, y + 14);

  // ---- Company letterhead -------------------------------------------------
  y += 40;
  doc.font('Helvetica-Bold').fontSize(11).fillColor(INK).text(company.companyName.toUpperCase(), left, y, {
    underline: true,
  });
  y = doc.y + 2;
  doc.font('Helvetica').fontSize(9).fillColor('#333333');
  if (company.address) {
    doc.text(company.address, left, y, { width: contentWidth / 2 });
    y = doc.y;
  }
  const contactLine = [company.mobile ? `Phone: ${company.mobile}` : null, company.website].filter(Boolean).join('   ');
  if (contactLine) {
    doc.text(contactLine, left, y);
    y = doc.y;
  }
  if (company.gstNumber) {
    doc.text(`GST : ${company.gstNumber}`, left, y);
    y = doc.y;
  }

  // ---- Bill To + Event details ---------------------------------------------
  y += 10;
  const colWidth = (contentWidth - 24) / 2;
  const billToTop = y;

  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(MUTED).text('BILL TO', left, y);
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(INK).text(data.customer.customerName, left, doc.y + 3, { width: colWidth });
  doc.font('Helvetica').fontSize(9).fillColor(MUTED).text(data.customer.mobile, left, doc.y + 1, { width: colWidth });
  if (data.customer.email) doc.text(data.customer.email, left, doc.y + 1, { width: colWidth });
  if (data.customer.address) doc.text(data.customer.address, left, doc.y + 1, { width: colWidth });
  const billToBottom = doc.y;

  const eventX = left + colWidth + 24;
  let eventY = billToTop;
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(MUTED).text('EVENT DETAILS', eventX, eventY, { width: colWidth });
  eventY = doc.y + 3;
  // Quotation and Event Date are both optional on an order raised straight from a confirmed
  // enquiry, and a label with nothing after it reads as a printing fault — so each is simply left
  // off the block when there is nothing to print.
  const eventRows: [string, string][] = [
    ['Order', data.order.orderNumber],
    ...(data.quotationNumber ? ([['Quotation', data.quotationNumber]] as [string, string][]) : []),
    ...(data.order.eventName ? ([['Event', data.order.eventName]] as [string, string][]) : []),
    ...(data.order.eventDate ? ([['Event Date', formatDate(data.order.eventDate)]] as [string, string][]) : []),
    ...(data.order.venue ? ([['Venue', data.order.venue]] as [string, string][]) : []),
  ];
  eventRows.forEach(([label, value]) => {
    doc.font('Helvetica').fontSize(9).fillColor(MUTED).text(`${label}: `, eventX, eventY, { continued: true, width: colWidth });
    doc.font('Helvetica-Bold').fillColor(INK).text(value, { width: colWidth });
    eventY = doc.y + 1;
  });

  y = Math.max(billToBottom, eventY) + 14;

  // ---- Items table --------------------------------------------------------
  const cols = [
    { key: 'item', label: 'DESCRIPTION', width: contentWidth - 265, align: 'left' as const },
    { key: 'qty', label: 'QTY', width: 85, align: 'center' as const },
    { key: 'rate', label: 'RATE', width: 85, align: 'right' as const },
    { key: 'amount', label: 'AMOUNT', width: 95, align: 'right' as const },
  ];
  const colX: number[] = [];
  cols.reduce((x, col, index) => {
    colX[index] = x;
    return x + col.width;
  }, left);
  const PAD = 6;

  function drawRow(cells: string[], rowY: number, isHeader: boolean): number {
    doc.font(isHeader ? 'Helvetica-Bold' : 'Helvetica').fontSize(isHeader ? 9 : 9.5);
    const heights = cells.map((text, index) => doc.heightOfString(text || '', { width: cols[index].width - PAD * 2 }));
    const rowHeight = Math.max(18, ...heights) + 8;

    if (isHeader) {
      doc.rect(left, rowY, contentWidth, rowHeight).fill('#eeeeee');
    }
    doc.fillColor(isHeader ? INK : '#333333');
    cells.forEach((text, index) => {
      doc.text(text || '', colX[index] + PAD, rowY + 6, { width: cols[index].width - PAD * 2, align: cols[index].align });
    });
    doc
      .moveTo(left, rowY + rowHeight)
      .lineTo(right, rowY + rowHeight)
      .lineWidth(0.5)
      .strokeColor('#dddddd')
      .stroke();
    return rowY + rowHeight;
  }

  const tableTop = y;
  y = drawRow(
    cols.map((c) => c.label),
    y,
    true,
  );
  if (data.items.length === 0) {
    y = drawRow(
      [
        data.quotationNumber
          ? 'The approved quotation has no line items.'
          : 'No quotation was raised for this order — the agreed total is billed below.',
        '',
        '',
        '',
      ],
      y,
      false,
    );
  }
  data.items.forEach((item) => {
    if (y + 30 > doc.page.height - MARGIN - 40) {
      doc.addPage();
      y = MARGIN;
    }
    const description = item.description ? `${item.itemName}\n${item.description}` : item.itemName;
    y = drawRow(
      [description, `${num(item.quantity)}${item.unit ? ` ${item.unit}` : ''}`, num(item.rate), num(item.amount)],
      y,
      false,
    );
  });
  doc.rect(left, tableTop, contentWidth, y - tableTop).lineWidth(0.5).strokeColor('#cccccc').stroke();

  // ---- Bank box (left) + totals (right) -----------------------------------
  y += 18;
  const totalsWidth = 190;
  const totalsX = right - totalsWidth;
  const bankBoxRight = totalsX - 24;

  const bankRows = [
    ['Bank Name', company.bankName],
    ['Account Name', company.bankAccountName],
    ['Account Number', company.bankAccountNumber],
    ['Branch Name', company.bankBranch],
    ['IFSC Code', company.bankIfsc],
    ['UPI', company.bankUpi],
  ].filter((row): row is [string, string] => Boolean(row[1]));

  const bankStartY = y;
  if (bankRows.length) {
    let bankY = y;
    doc.font('Helvetica').fontSize(8.5);
    bankRows.forEach(([label, value]) => {
      doc.fillColor(MUTED).text(label, left + 8, bankY, { width: 90, continued: false });
      doc.fillColor(INK).text(`: ${value}`, left + 100, bankY, { width: bankBoxRight - (left + 100) });
      bankY = doc.y + 2;
    });
    doc.moveTo(left, bankStartY - 2).lineTo(left, bankY).lineWidth(2).strokeColor(GREEN).stroke();
  }

  // Totals
  let ty = y;
  function totalRow(label: string, value: string, strong = false): void {
    doc
      .font(strong ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(9)
      .fillColor(strong ? INK : MUTED)
      .text(`${label} :`, totalsX, ty, { width: totalsWidth - 70 });
    doc.fillColor(INK).text(value, totalsX + totalsWidth - 70, ty, { width: 70, align: 'right' });
    ty += 16;
  }
  const taxable = data.subtotal - data.discount;
  totalRow('Subtotal', num(data.subtotal));
  if (data.discount > 0) totalRow('Discount', `- ${num(data.discount)}`);
  if (data.cgstPercent > 0) {
    totalRow(`CGST ${data.cgstPercent}%`, num(Math.round(((taxable * data.cgstPercent) / 100) * 100) / 100));
  }
  if (data.sgstPercent > 0) {
    totalRow(`SGST ${data.sgstPercent}%`, num(Math.round(((taxable * data.sgstPercent) / 100) * 100) / 100));
  }
  // Only when the order's budget was revised after being raised — otherwise the total would not
  // equal the line items above it.
  if (data.adjustment !== 0) {
    totalRow('Adjustment', `${data.adjustment > 0 ? '' : '- '}${num(Math.abs(data.adjustment))}`);
  }

  ty += 4;
  doc.roundedRect(totalsX, ty, totalsWidth, 28, 14).lineWidth(1.5).strokeColor('#111111').stroke();
  doc.font('Helvetica-Bold').fontSize(11).fillColor(INK).text('TOTAL :', totalsX + 12, ty + 8);
  doc.text(num(data.totalAmount), totalsX, ty + 8, { width: totalsWidth - 12, align: 'right' });
  ty += 28 + 8;

  totalRow('Amount Paid', `- ${num(data.paidAmount)}`);
  ty += 4;
  doc.roundedRect(totalsX, ty, totalsWidth, 28, 14).lineWidth(1.5).fillAndStroke('#f5f5f5', '#111111');
  doc.font('Helvetica-Bold').fontSize(11).fillColor(INK).text('BALANCE DUE :', totalsX + 12, ty + 8);
  doc.text(num(data.balanceDue), totalsX, ty + 8, { width: totalsWidth - 12, align: 'right' });
  ty += 28;

  y = Math.max(ty, bankStartY + bankRows.length * 12) + 24;

  // ---- Payments received ----------------------------------------------------
  if (data.payments.length > 0) {
    if (y + 60 > doc.page.height - MARGIN - 60) {
      doc.addPage();
      y = MARGIN;
    }
    doc.font('Helvetica-Bold').fontSize(9).fillColor(INK).text('PAYMENTS RECEIVED', left, y);
    y = doc.y + 4;
    doc.font('Helvetica').fontSize(8.5);
    data.payments.forEach((payment) => {
      doc.fillColor(MUTED).text(formatDate(payment.paymentDate), left, y, { width: 60, continued: true });
      doc.fillColor(INK).text(`  ${payment.receiptNumber}`, { continued: true, width: 140 });
      doc
        .fillColor(MUTED)
        .text(`  ${payment.paymentMethod}${payment.referenceNumber ? ` · ${payment.referenceNumber}` : ''}`, {
          continued: true,
          width: contentWidth - 260,
        });
      doc.fillColor(INK).font('Helvetica-Bold').text(num(payment.amount), left, y, { width: contentWidth, align: 'right' });
      doc.font('Helvetica');
      y = doc.y + 2;
    });
    y += 10;
  }

  // ---- Terms ------------------------------------------------------------
  if (company.termsAndConditions) {
    if (y + 40 > doc.page.height - MARGIN - 60) {
      doc.addPage();
      y = MARGIN;
    }
    doc.font('Helvetica-Bold').fontSize(9).fillColor(INK).text('Terms & Conditions', left, y);
    doc
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor(MUTED)
      .text(company.termsAndConditions, left, doc.y + 2, { width: contentWidth });
    y = doc.y + 10;
  }

  // ---- Signature ----------------------------------------------------------
  if (company.authorizedSignatory) {
    doc.font('Helvetica').fontSize(9).fillColor(MUTED);
    doc.text('_______________________', right - 200, y, { width: 200, align: 'right' });
    doc.text(`For ${company.companyName}`, right - 200, y + 14, { width: 200, align: 'right' });
    doc.text(company.authorizedSignatory, right - 200, y + 28, { width: 200, align: 'right' });
    y += 44;
  }

  // ---- Footer / thank-you -------------------------------------------------
  y += 6;
  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor(INK)
    .text((company.footerMessage ?? 'Thank you for your business.').toUpperCase(), left, y);
  if (company.email) {
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(MUTED)
      .text(`If you have any questions, please contact us at ${company.email}`, left, doc.y + 2);
  }

  doc.end();

  await new Promise<void>((resolve, reject) => {
    stream.on('finish', () => resolve());
    stream.on('error', reject);
  });

  return path.join('invoices', fileName).split(path.sep).join('/');
}
