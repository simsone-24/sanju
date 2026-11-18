import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { env } from '../../config/env';
import { CustomerSnapshot } from './types';

export interface QuotationPdfItem {
  itemName: string;
  description: string | null;
  quantity: number;
  unit: string | null;
  rate: number;
  amount: number;
}

// One group of items priced as a single amount — printed with the amount spanning its rows.
export interface QuotationPdfSection {
  title: string | null;
  amount: number;
  items: { description: string; sizeQty: string | null }[];
}

export interface QuotationPdfData {
  quotationNumber: string;
  version: number;
  // The event date shown on the document — stored on the quotation itself (pre-filled from the
  // enquiry's event date when raised, then editable on the form).
  quotationDate: Date;
  status: string;
  recipient: CustomerSnapshot;
  items: QuotationPdfItem[];
  /** Section-wise lines. When present the table is S.NO / DESCRIPTION / SIZE/QTY / AMOUNT. */
  sections: QuotationPdfSection[];
  subtotal: number;
  discount: number;
  cgstPercent: number;
  sgstPercent: number;
  tax: number;
  totalAmount: number;
  /** The total spelled out ("Rupees … Only"), printed under the totals when given. */
  totalInWords?: string;
  /** Advance agreed against the quotation; printed as a deduction from the total when present. */
  advanceAmount?: number;
  remarks: string | null;
  // Sample decor images, rendered on a single gallery page: absolute filesystem path plus the
  // description ("Stage", "Hall"…) printed under it, if one was given.
  images: { path: string; caption: string | null }[];
}

export interface CompanyPdfData {
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

// Plain thousands-separated numbers with no currency symbol — matches the printed Sanju template.
function num(value: number): string {
  return value.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatDate(value: Date): string {
  return value.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

const MARGIN = 40;
const GREEN = '#4e9a2a';
const INK = '#1a1a1a';
const MUTED = '#555555';

// A4 quotation styled to mirror the company's printed template ("md files/Quotation/quotation.md"
// §PDF Layout): green banner + QUOTATION pill, letterhead, ITEM/QUANTITY/UNIT PRICE/SUBTOTAL table,
// bank box + totals with a TOTAL pill, thank-you footer.
export async function generateQuotationPdf(
  quotationId: number,
  data: QuotationPdfData,
  company: CompanyPdfData,
): Promise<string> {
  const destinationDir = path.join(env.uploadPath, 'quotations');
  fs.mkdirSync(destinationDir, { recursive: true });
  const fileName = `${quotationId}.pdf`;
  const absolutePath = path.join(destinationDir, fileName);

  const doc = new PDFDocument({ size: 'A4', margin: MARGIN });
  const stream = fs.createWriteStream(absolutePath);
  doc.pipe(stream);

  const left = MARGIN;
  const right = doc.page.width - MARGIN;
  const contentWidth = right - left;

  // ---- Header band: gradient + QUOTATION pill + logo ----------------------
  const bandHeight = 60;
  const gradient = doc.linearGradient(0, 0, doc.page.width, 0);
  gradient.stop(0, GREEN).stop(0.5, '#8bc34a').stop(0.78, '#dcedc8').stop(1, '#ffffff');
  doc.rect(0, 0, doc.page.width, bandHeight).fill(gradient);

  doc.roundedRect(left, 12, 200, 36, 18).lineWidth(2).fillAndStroke('#ffffff', '#111111');
  doc.fillColor('#111111').font('Helvetica-Bold').fontSize(18).text('QUOTATION', left, 22, { width: 200, align: 'center' });

  if (company.logoAbsolutePath && fs.existsSync(company.logoAbsolutePath)) {
    try {
      doc.image(company.logoAbsolutePath, right - 90, 8, { fit: [90, 44], align: 'right' });
    } catch {
      // Unsupported image format (e.g. WebP) — skip the logo.
    }
  }

  // ---- Meta: Event Date, top right corner ----------------------------------
  let y = bandHeight + 20;
  const dateValue = formatDate(data.quotationDate);
  doc.font('Helvetica-Bold').fontSize(9);
  const dateValueWidth = doc.widthOfString(dateValue);
  doc.fillColor(INK).text(dateValue, right - dateValueWidth, y, { lineBreak: false });
  doc.font('Helvetica').fillColor(MUTED);
  const dateLabel = 'Event Date';
  doc.text(dateLabel, right - dateValueWidth - 8 - doc.widthOfString(dateLabel), y, { lineBreak: false });

  // ---- Company letterhead -------------------------------------------------
  y += 26;
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

  // ---- Recipient ----------------------------------------------------------
  // The name first, then the phone number and the location (address) beneath it, one per line.
  if (data.recipient.name || data.recipient.phone) {
    y += 6;
    doc.font('Helvetica').fontSize(9).fillColor(MUTED).text('To: ', left, y, { continued: true });
    doc.font('Helvetica-Bold').fillColor(INK).text(data.recipient.name ?? '');
    doc.font('Helvetica').fillColor(INK);
    const details = [
      data.recipient.phone,
      data.recipient.address,
      data.recipient.gst ? `GST: ${data.recipient.gst}` : null,
    ].filter(Boolean) as string[];
    details.forEach((line) => doc.text(line, left, doc.y + 1, { width: right - left }));
    y = doc.y;
  }

  // Section-wise table: S.NO | DESCRIPTION | SIZE/QTY | AMOUNT. A section's heading is a highlighted
  // row, its items follow, and its single amount is printed once beside the whole group. A section
  // that runs onto the next page prints its amount on the page where it starts.
  function drawSectionedTable(startY: number): number {
    const widths = [36, contentWidth - 36 - 90 - 90, 90, 90];
    const xs: number[] = [];
    widths.reduce((x, width, index) => {
      xs[index] = x;
      return x + width;
    }, left);
    const PAD_X = 6;
    const pageEnd = doc.page.height - MARGIN;
    let top = startY;
    let cursor = startY;

    const textHeight = (text: string, width: number, bold: boolean): number => {
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9.5);
      return doc.heightOfString(text || ' ', { width: width - PAD_X * 2 }) + 10;
    };

    const drawHeader = (): void => {
      const height = 22;
      doc.rect(left, cursor, contentWidth, height).fill('#eeeeee');
      doc.font('Helvetica-Bold').fontSize(9).fillColor(INK);
      ['S.NO', 'DESCRIPTION', 'SIZE/QTY', 'AMOUNT (Rs.)'].forEach((label, index) => {
        doc.text(label, xs[index] + PAD_X, cursor + 7, {
          width: widths[index] - PAD_X * 2,
          align: index === 1 ? 'left' : index === 3 ? 'right' : 'center',
          lineBreak: false,
        });
      });
      cursor += height;
    };

    const closeTable = (): void => {
      doc.rect(left, top, contentWidth, cursor - top).lineWidth(0.5).strokeColor('#cccccc').stroke();
      doc.moveTo(xs[3], top).lineTo(xs[3], cursor).lineWidth(0.5).strokeColor('#cccccc').stroke();
    };

    drawHeader();
    let serial = 0;
    for (const section of data.sections) {
      let chunkTop = cursor;
      let amountPrinted = false;
      const printAmount = (): void => {
        if (amountPrinted) return;
        amountPrinted = true;
        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .fillColor(INK)
          .text(num(section.amount), xs[3] + PAD_X, chunkTop + (cursor - chunkTop) / 2 - 5, {
            width: widths[3] - PAD_X * 2,
            align: 'right',
            lineBreak: false,
          });
      };

      const rows: { heading: boolean; cells: string[] }[] = [];
      if (section.title) rows.push({ heading: true, cells: ['', section.title.toUpperCase(), '', ''] });
      section.items.forEach((item) => {
        serial += 1;
        rows.push({ heading: false, cells: [String(serial), item.description, item.sizeQty ?? '', ''] });
      });

      for (const row of rows) {
        const height = Math.max(
          20,
          textHeight(row.cells[1], widths[1], row.heading),
          textHeight(row.cells[2], widths[2], false),
        );
        if (cursor + height > pageEnd) {
          printAmount();
          closeTable();
          doc.addPage();
          top = MARGIN;
          cursor = MARGIN;
          drawHeader();
          chunkTop = cursor;
        }
        if (row.heading) doc.rect(left, cursor, widths[0] + widths[1] + widths[2], height).fill('#fff3b0');
        doc.font(row.heading ? 'Helvetica-Bold' : 'Helvetica').fontSize(9.5).fillColor('#222222');
        [0, 1, 2].forEach((index) => {
          doc.text(row.cells[index], xs[index] + PAD_X, cursor + 5, {
            width: widths[index] - PAD_X * 2,
            align: index === 1 ? 'left' : 'center',
          });
        });
        cursor += height;
        doc
          .moveTo(left, cursor)
          .lineTo(xs[3], cursor)
          .lineWidth(0.5)
          .strokeColor('#e3e3e3')
          .stroke();
      }
      printAmount();
      doc.moveTo(left, cursor).lineTo(right, cursor).lineWidth(0.5).strokeColor('#cccccc').stroke();
    }
    closeTable();
    return cursor;
  }

  // ---- Items table --------------------------------------------------------
  const pageBottom = () => doc.page.height - MARGIN;
  if (data.sections.length > 0) {
    y = drawSectionedTable(y + 12);
  } else {
    y += 12;
    const cols = [
      { key: 'item', label: 'ITEM', width: contentWidth - 201, align: 'left' as const },
      { key: 'qty', label: 'QUANTITY', width: 60, align: 'center' as const },
      { key: 'rate', label: 'UNIT PRICE', width: 69, align: 'right' as const },
      { key: 'amount', label: 'SUBTOTAL', width: 72, align: 'right' as const },
    ];
    const colX: number[] = [];
    cols.reduce((x, col, index) => {
      colX[index] = x;
      return x + col.width;
    }, left);
    const PAD = 6;
    const headerCells = cols.map((column) => column.label);

    function rowHeightFor(cells: string[], isHeader: boolean): number {
      doc.font(isHeader ? 'Helvetica-Bold' : 'Helvetica').fontSize(isHeader ? 9 : 9.5);
      const heights = cells.map((text, index) =>
        doc.heightOfString(text || '', { width: cols[index].width - PAD * 2 }),
      );
      return Math.max(18, ...heights) + 4;
    }

    function drawRow(cells: string[], rowY: number, isHeader: boolean, rowHeight: number): void {
      doc.font(isHeader ? 'Helvetica-Bold' : 'Helvetica').fontSize(isHeader ? 9 : 9.5);
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
    }

    // The table repeats its heading and keeps its own outer border on every page, so a long
    // quotation wraps cleanly instead of dragging the totals block onto a trail of extra pages.
    const firstRowCells = data.items[0]
      ? [data.items[0].itemName, num(data.items[0].quantity), num(data.items[0].rate), num(data.items[0].amount)]
      : [];
    if (firstRowCells.length && y + rowHeightFor(headerCells, true) + rowHeightFor(firstRowCells, false) > pageBottom()) {
      doc.addPage();
      y = MARGIN;
    }

    let tableTop = y;
    let rowHeight = rowHeightFor(headerCells, true);
    drawRow(headerCells, y, true, rowHeight);
    y += rowHeight;

    data.items.forEach((item) => {
      const cells = [item.itemName, num(item.quantity), num(item.rate), num(item.amount)];
      rowHeight = rowHeightFor(cells, false);
      if (y + rowHeight > pageBottom()) {
        doc.rect(left, tableTop, contentWidth, y - tableTop).lineWidth(0.5).strokeColor('#cccccc').stroke();
        doc.addPage();
        y = MARGIN;
        tableTop = y;
        rowHeight = rowHeightFor(headerCells, true);
        drawRow(headerCells, y, true, rowHeight);
        y += rowHeight;
        rowHeight = rowHeightFor(cells, false);
      }
      drawRow(cells, y, false, rowHeight);
      y += rowHeight;
    });

    doc.rect(left, tableTop, contentWidth, y - tableTop).lineWidth(0.5).strokeColor('#cccccc').stroke();
  }

  // ---- Bank box (left) + totals (right) -----------------------------------
  const totalsWidth = 143;
  const totalsX = right - totalsWidth;
  const bankBoxRight = totalsX - 16;

  const bankRows = [
    ['Bank Name', company.bankName],
    ['Account Name', company.bankAccountName],
    ['Account Number', company.bankAccountNumber],
    ['Branch Name', company.bankBranch],
    ['IFSC Code', company.bankIfsc],
    ['UPI', company.bankUpi],
  ].filter((row): row is [string, string] => Boolean(row[1]));

  const totalsRowCount =
    1 +
    (data.discount > 0 ? 1 : 0) +
    (data.cgstPercent > 0 ? 1 : 0) +
    (data.sgstPercent > 0 ? 1 : 0) +
    ((data.advanceAmount ?? 0) > 0 ? 1 : 0);
  const summaryHeight = Math.max(totalsRowCount * 16 + 4 + 30, bankRows.length * 12);

  // Measure everything below the table before drawing it. PDFKit silently starts a new page when
  // a text call crosses the bottom margin, which previously split the totals over several pages.
  doc.font('Helvetica').fontSize(9);
  const remarksHeight = data.remarks ? 14 + doc.heightOfString(data.remarks, { width: contentWidth }) + 10 : 0;
  doc.font('Helvetica').fontSize(8.5);
  const termsHeight = company.termsAndConditions
    ? 14 + doc.heightOfString(company.termsAndConditions, { width: contentWidth }) + 10
    : 0;
  const signatureHeight = company.authorizedSignatory ? 44 : 0;
  doc.font('Helvetica-Bold').fontSize(11);
  const footerText = (company.footerMessage ?? 'Thank you for your business.').toUpperCase();
  const footerHeight = 6 + doc.heightOfString(footerText, { width: contentWidth });
  doc.font('Helvetica').fontSize(9);
  const emailHeight = company.email
    ? 4 + doc.heightOfString(`If you have any questions, please contact us at ${company.email}`, { width: contentWidth })
    : 0;

  doc.font('Helvetica-Bold').fontSize(9);
  const wordsHeight = data.totalInWords ? doc.heightOfString(`Amount in words: ${data.totalInWords}`, { width: contentWidth }) + 12 : 0;

  const closingGap = 18;
  const closingHeight =
    closingGap + summaryHeight + 24 + wordsHeight + remarksHeight + termsHeight + signatureHeight + footerHeight + emailHeight;
  if (y + closingHeight > pageBottom()) {
    doc.addPage();
    y = MARGIN;
  } else {
    y += closingGap;
  }

  const bankStartY = y;
  if (bankRows.length) {
    let bankY = y;
    doc.font('Helvetica').fontSize(8.5);
    bankRows.forEach(([label, value]) => {
      doc.fillColor(MUTED).text(label, left + 8, bankY, { width: 72, lineBreak: false });
      doc.fillColor(INK).text(`: ${value}`, left + 80, bankY, {
        width: bankBoxRight - (left + 80),
        lineBreak: false,
        ellipsis: true,
      });
      bankY += 12;
    });
    // Left accent border for the bank block.
    doc
      .moveTo(left, bankStartY - 2)
      .lineTo(left, bankY)
      .lineWidth(2)
      .strokeColor(GREEN)
      .stroke();
  }

  // Totals
  let ty = y;
  function totalRow(label: string, value: string): void {
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(MUTED)
      .text(`${label} :`, totalsX, ty, { width: totalsWidth - 70, lineBreak: false });
    doc.fillColor(INK).text(value, totalsX + totalsWidth - 70, ty, { width: 70, align: 'right', lineBreak: false });
    ty += 16;
  }
  const taxable = data.subtotal - data.discount;
  totalRow('Subtotal', num(data.subtotal));
  if (data.discount > 0) totalRow('Discount', `- ${num(data.discount)}`);
  if (data.cgstPercent > 0) {
    totalRow(`Tax cGST ${data.cgstPercent}%`, num(Math.round(((taxable * data.cgstPercent) / 100) * 100) / 100));
  }
  if (data.sgstPercent > 0) {
    totalRow(`Tax sGST ${data.sgstPercent}%`, num(Math.round(((taxable * data.sgstPercent) / 100) * 100) / 100));
  }
  const advanceAmount = data.advanceAmount ?? 0;
  if (advanceAmount > 0) totalRow('Advance', `- ${num(advanceAmount)}`);

  ty += 4;
  doc.roundedRect(totalsX, ty, totalsWidth, 30, 15).lineWidth(1.5).strokeColor('#111111').stroke();
  doc.font('Helvetica-Bold').fontSize(12).fillColor(INK).text('TOTAL :', totalsX + 12, ty + 9);
  doc.text(num(data.totalAmount - advanceAmount), totalsX, ty + 9, { width: totalsWidth - 12, align: 'right' });
  ty += 30;

  y = Math.max(ty, bankStartY + bankRows.length * 12) + 24;

  if (data.totalInWords) {
    const words = `Amount in words: ${data.totalInWords}`;
    doc.font('Helvetica-Bold').fontSize(9).fillColor(INK).text(words, left, y, { width: contentWidth });
    y += doc.heightOfString(words, { width: contentWidth }) + 12;
  }

  // ---- Notes / terms ------------------------------------------------------
  // The quotation's own remarks are specific to this document; the company's Terms & Conditions
  // (Settings) are the standing commercial policy printed on every quotation. Kept as two blocks so
  // a reader can tell which is which.
  if (data.remarks) {
    doc.font('Helvetica-Bold').fontSize(9).fillColor(INK).text('Notes', left, y);
    doc.font('Helvetica').fontSize(9).fillColor(MUTED).text(data.remarks, left, y + 14, { width: contentWidth });
    y += 14 + doc.heightOfString(data.remarks, { width: contentWidth }) + 10;
  }

  if (company.termsAndConditions) {
    doc.font('Helvetica-Bold').fontSize(9).fillColor(INK).text('Terms & Conditions', left, y);
    doc
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor(MUTED)
      .text(company.termsAndConditions, left, y + 14, { width: contentWidth });
    y += 14 + doc.heightOfString(company.termsAndConditions, { width: contentWidth }) + 10;
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
  doc.font('Helvetica-Bold').fontSize(11).fillColor(INK).text(footerText, left, y, { width: contentWidth });
  if (company.email) {
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(MUTED)
      .text(`If you have any questions, please contact us at ${company.email}`, left, y + 16, { width: contentWidth });
  }

  // ---- Sample decor images — one picture per row, three rows to a page ---
  const images = data.images.filter((image) => fs.existsSync(image.path));
  if (images.length) {
    const rowsPerPage = 3;
    const gap = 14;
    // Room under each picture for its description — only reserved when at least one image has one.
    const captionH = images.some((image) => image.caption) ? 24 : 0;
    let galleryTop = 0;

    images.forEach((image, i) => {
      const slot = i % rowsPerPage;
      if (slot === 0) {
        doc.addPage();
        doc
          .font('Helvetica-Bold')
          .fontSize(14)
          .fillColor(INK)
          .text(i === 0 ? 'Sample Decor' : 'Sample Decor (continued)', left, MARGIN);
        galleryTop = doc.y + 10;
      }
      const rowH = (doc.page.height - galleryTop - MARGIN - gap * (rowsPerPage - 1)) / rowsPerPage;
      const y = galleryTop + slot * (rowH + gap);
      try {
        doc.image(image.path, left, y, { fit: [contentWidth, rowH - captionH], align: 'center', valign: 'center' });
      } catch {
        // Skip an unreadable/corrupt image rather than failing the whole PDF.
      }
      if (image.caption) {
        doc
          .font('Helvetica-Bold')
          .fontSize(11)
          .fillColor(INK)
          .text(image.caption, left, y + rowH - captionH + 6, {
            width: contentWidth,
            align: 'center',
            lineBreak: false,
            ellipsis: true,
          });
      }
    });
  }

  doc.end();

  await new Promise<void>((resolve, reject) => {
    stream.on('finish', () => resolve());
    stream.on('error', reject);
  });

  return path.join('quotations', fileName).split(path.sep).join('/');
}
