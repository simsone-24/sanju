import { AppointmentStatus, EnquiryStatus, Prisma } from '@prisma/client';
import { PrismaClientOrTx, prisma } from '../../config/prisma';
import { ListEnquiriesParams } from './types';

const enquiryListSelect = {
  id: true,
  enquiryNumber: true,
  eventName: true,
  eventDate: true,
  appointmentDate: true,
  // Listed alongside the date on the Enquiry index's Appointment column
  // ("md files/Enquiry/indexUI.md" §Appointment — "27 Jul 2026 / 10:30 AM").
  appointmentTime: true,
  appointmentStatus: true,
  status: true,
  createdAt: true,
  // Nullable until the enquiry reaches ORDER_CONFIRMED — prospect_* fields carry the customer's
  // details in the meantime (see mapEnquiry in service.ts, which normalises the two into one shape).
  customer: { select: { id: true, customerName: true, mobile: true } },
  prospectName: true,
  prospectMobile: true,
  eventType: { select: { id: true, eventName: true, colorCode: true } },
  assignedUser: { select: { id: true, fullName: true } },
} satisfies Prisma.EnquirySelect;

const enquiryDetailSelect = {
  ...enquiryListSelect,
  prospectWhatsapp: true,
  prospectEmail: true,
  prospectAddress: true,
  prospectCity: true,
  mahal: true,
  venue: true,
  estimatedBudget: true,
  finalBudgetAmount: true,
  notes: true,
  meetingLocation: true,
  appointmentNotes: true,
  quotationAmount: true,
  quotationVersion: true,
  updatedAt: true,
  followUps: {
    orderBy: { followUpDate: 'desc' },
    select: {
      id: true,
      followUpDate: true,
      notes: true,
      outcome: true,
      createdAt: true,
      createdBy: { select: { id: true, fullName: true } },
    },
  },
} satisfies Prisma.EnquirySelect;

export async function listEnquiries(params: ListEnquiriesParams) {
  const where: Prisma.EnquiryWhereInput = {
    companyId: params.companyId,
    deletedAt: null,
    ...(params.status ? { status: params.status } : {}),
    ...(params.appointmentStatus ? { appointmentStatus: params.appointmentStatus } : {}),
    ...(params.eventTypeId ? { eventTypeId: params.eventTypeId } : {}),
    ...(params.assignedUserId ? { assignedUserId: params.assignedUserId } : {}),
    ...(params.customerId ? { customerId: params.customerId } : {}),
    ...(params.eventDateFrom || params.eventDateTo
      ? {
          eventDate: {
            ...(params.eventDateFrom ? { gte: params.eventDateFrom } : {}),
            ...(params.eventDateTo ? { lte: params.eventDateTo } : {}),
          },
        }
      : {}),
    ...(params.appointmentDateFrom || params.appointmentDateTo
      ? {
          appointmentDate: {
            ...(params.appointmentDateFrom ? { gte: params.appointmentDateFrom } : {}),
            ...(params.appointmentDateTo ? { lte: params.appointmentDateTo } : {}),
          },
        }
      : {}),
    ...(params.search
      ? {
          OR: [
            { enquiryNumber: { contains: params.search } },
            { customer: { customerName: { contains: params.search } } },
            { customer: { mobile: { contains: params.search } } },
            // Unconfirmed enquiries have no linked customer yet — match the prospect fields too.
            { prospectName: { contains: params.search } },
            { prospectMobile: { contains: params.search } },
          ],
        }
      : {}),
  };

  const [records, totalRecords] = await Promise.all([
    prisma.enquiry.findMany({
      where,
      select: enquiryListSelect,
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.enquiry.count({ where }),
  ]);

  return { records, totalRecords };
}

export async function getEnquiryStats(companyId: string) {
  const baseWhere: Prisma.EnquiryWhereInput = { companyId, deletedAt: null };

  const [pendingAppointments, inProgressAppointments, quotationToShare, quotationShared] = await Promise.all([
    prisma.enquiry.count({ where: { ...baseWhere, appointmentStatus: AppointmentStatus.PENDING } }),
    prisma.enquiry.count({ where: { ...baseWhere, appointmentStatus: AppointmentStatus.IN_PROGRESS } }),
    prisma.enquiry.count({ where: { ...baseWhere, status: EnquiryStatus.QUOTATION_TO_SHARE } }),
    prisma.enquiry.count({ where: { ...baseWhere, status: EnquiryStatus.QUOTATION_SHARED } }),
  ]);

  return { pendingAppointments, inProgressAppointments, quotationToShare, quotationShared };
}

export function findEnquiryById(companyId: string, id: string) {
  return prisma.enquiry.findFirst({ where: { id, companyId, deletedAt: null }, select: enquiryDetailSelect });
}

export function findEventTypeForCompany(companyId: string, eventTypeId: string, client: PrismaClientOrTx = prisma) {
  return client.eventType.findFirst({ where: { id: eventTypeId, companyId, deletedAt: null } });
}

export function findUserForCompany(companyId: string, userId: string, client: PrismaClientOrTx = prisma) {
  return client.user.findFirst({ where: { id: userId, companyId, deletedAt: null, isActive: true } });
}

export function createEnquiry(data: Prisma.EnquiryUncheckedCreateInput, client: PrismaClientOrTx = prisma) {
  return client.enquiry.create({ data, select: enquiryDetailSelect });
}

export function updateEnquiry(
  id: string,
  data: Prisma.EnquiryUncheckedUpdateInput,
  client: PrismaClientOrTx = prisma,
) {
  return client.enquiry.update({ where: { id }, data, select: enquiryDetailSelect });
}

export function updateEnquiryStatus(id: string, status: EnquiryStatus, client: PrismaClientOrTx = prisma) {
  return client.enquiry.update({ where: { id }, data: { status }, select: enquiryDetailSelect });
}

export function createFollowUp(data: Prisma.EnquiryFollowUpUncheckedCreateInput) {
  return prisma.enquiryFollowUp.create({
    data,
    select: {
      id: true,
      followUpDate: true,
      notes: true,
      outcome: true,
      createdAt: true,
      createdBy: { select: { id: true, fullName: true } },
    },
  });
}
