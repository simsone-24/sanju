import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';

const companySelect = {
  id: true,
  companyName: true,
  contactPerson: true,
  mobile: true,
  email: true,
  address: true,
  logo: true,
  gstNumber: true,
  website: true,
  bankName: true,
  bankAccountName: true,
  bankAccountNumber: true,
  bankBranch: true,
  bankIfsc: true,
  bankUpi: true,
  authorizedSignatory: true,
  footerMessage: true,
  termsAndConditions: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CompanySelect;

export type CompanyRecord = Prisma.CompanyGetPayload<{ select: typeof companySelect }>;

export function findCompanyById(id: string) {
  return prisma.company.findUnique({ where: { id }, select: companySelect });
}

export function updateCompany(id: string, data: Prisma.CompanyUpdateInput) {
  return prisma.company.update({ where: { id }, data, select: companySelect });
}
