import { AppointmentStatus, EnquiryStatus } from '@prisma/client';

export interface NewCustomerInput {
  type: 'NEW';
  customerName: string;
  mobile: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  city?: string;
}

export interface ExistingCustomerInput {
  type: 'EXISTING';
  customerId: string;
}

export type CustomerInput = NewCustomerInput | ExistingCustomerInput;

export interface CreateEnquiryInput {
  customer: CustomerInput;
  eventTypeId: string;
  eventName?: string;
  eventDate?: Date;
  mahal?: string;
  venue?: string;
  estimatedBudget?: number;
  notes?: string;
  appointmentDate?: Date;
  appointmentTime?: string;
  meetingLocation?: string;
  appointmentNotes?: string;
  appointmentStatus?: AppointmentStatus;
  assignedUserId?: string;
  /** Defaults to NEW. Only a status reachable from NEW (see STATUS_TRANSITIONS in service.ts) may
   * be set directly at creation — for entering an enquiry that's already past its first contact,
   * e.g. one whose appointment was already scheduled when it's being logged into the system. */
  status?: EnquiryStatus;
}

export interface UpdateEnquiryInput {
  eventTypeId?: string;
  eventName?: string;
  eventDate?: Date;
  mahal?: string;
  venue?: string;
  estimatedBudget?: number;
  finalBudgetAmount?: number;
  notes?: string;
  appointmentDate?: Date;
  appointmentTime?: string;
  meetingLocation?: string;
  appointmentNotes?: string;
  appointmentStatus?: AppointmentStatus;
  assignedUserId?: string;
  // Prospect (unconfirmed customer) fields — applied only while the enquiry has no linked Customer.
  customerName?: string;
  mobile?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  city?: string;
}

export interface CreateFollowUpInput {
  followUpDate: Date;
  notes?: string;
  outcome?: string;
}

export interface ListEnquiriesParams {
  companyId: string;
  page: number;
  limit: number;
  search?: string;
  status?: EnquiryStatus;
  appointmentStatus?: AppointmentStatus;
  eventTypeId?: string;
  assignedUserId?: string;
  customerId?: string;
  eventDateFrom?: Date;
  eventDateTo?: Date;
  appointmentDateFrom?: Date;
  appointmentDateTo?: Date;
}

export interface EnquiryStatsResult {
  pendingAppointments: number;
  inProgressAppointments: number;
  quotationToShare: number;
  quotationShared: number;
}
