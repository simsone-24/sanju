import { AppError } from '../../utils/AppError';
import { logActivity } from '../../utils/activityLogger';
import * as settingsRepository from './repository';
import { UpdateCompanyInput } from './types';

export async function getCompany(companyId: number) {
  const company = await settingsRepository.findCompanyById(companyId);
  if (!company) throw new AppError(404, 'Company not found.');
  return company;
}

export async function updateCompany(companyId: number, actorId: number, input: UpdateCompanyInput) {
  const existing = await settingsRepository.findCompanyById(companyId);
  if (!existing) throw new AppError(404, 'Company not found.');

  const company = await settingsRepository.updateCompany(companyId, {
    companyName: input.companyName,
    contactPerson: input.contactPerson,
    mobile: input.mobile,
    email: input.email,
    address: input.address,
    gstNumber: input.gstNumber,
    website: input.website,
    bankName: input.bankName,
    bankAccountName: input.bankAccountName,
    bankAccountNumber: input.bankAccountNumber,
    bankBranch: input.bankBranch,
    bankIfsc: input.bankIfsc,
    bankUpi: input.bankUpi,
    authorizedSignatory: input.authorizedSignatory,
    footerMessage: input.footerMessage,
    termsAndConditions: input.termsAndConditions,
  });

  await logActivity({
    companyId,
    module: 'SETTINGS',
    referenceId: companyId,
    action: 'UPDATE',
    description: 'Company information updated.',
    performedById: actorId,
  });

  return company;
}

export async function updateLogo(companyId: number, actorId: number, logoPath: string) {
  const existing = await settingsRepository.findCompanyById(companyId);
  if (!existing) throw new AppError(404, 'Company not found.');

  const company = await settingsRepository.updateCompany(companyId, { logo: logoPath });

  await logActivity({
    companyId,
    module: 'SETTINGS',
    referenceId: companyId,
    action: 'UPDATE',
    description: 'Company logo updated.',
    performedById: actorId,
  });

  return company;
}
