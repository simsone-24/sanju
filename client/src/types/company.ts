export interface CompanyDetail {
  id: string;
  companyName: string;
  contactPerson: string | null;
  mobile: string | null;
  email: string | null;
  address: string | null;
  logo: string | null;
  gstNumber: string | null;
  website: string | null;
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  bankBranch: string | null;
  bankIfsc: string | null;
  bankUpi: string | null;
  authorizedSignatory: string | null;
  footerMessage: string | null;
  /** Standing terms printed on every quotation view page and PDF. */
  termsAndConditions: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface UpdateCompanyInput {
  companyName?: string;
  contactPerson?: string;
  mobile?: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  website?: string;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankBranch?: string;
  bankIfsc?: string;
  bankUpi?: string;
  authorizedSignatory?: string;
  footerMessage?: string;
  termsAndConditions?: string;
}
