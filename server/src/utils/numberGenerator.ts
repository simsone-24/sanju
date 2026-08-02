import { SequenceType } from '@prisma/client';
import { prisma } from '../config/prisma';

const PREFIX: Record<SequenceType, string> = {
  ENQUIRY: 'ENQ',
  QUOTATION: 'QTN',
  ORDER: 'ORD',
  RECEIPT: 'RCT',
  INVOICE: 'INV',
  CUSTOMER: 'CUS',
};

// Sequential per company, resets every calendar year, no MAX()+1 — per
// docs/10_IMPLEMENTATION_DECISIONS.md §10. Prisma's upsert compiles to a single
// INSERT ... ON DUPLICATE KEY UPDATE statement on MySQL, so this is atomic
// under concurrent callers without needing an explicit transaction wrapper.
export async function generateDocumentNumber(companyId: string, sequenceType: SequenceType): Promise<string> {
  const year = new Date().getFullYear();

  const sequence = await prisma.documentSequence.upsert({
    where: { companyId_sequenceType_year: { companyId, sequenceType, year } },
    create: { companyId, sequenceType, year, lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
  });

  const paddedNumber = String(sequence.lastNumber).padStart(5, '0');
  return `${PREFIX[sequenceType]}-${year}-${paddedNumber}`;
}
