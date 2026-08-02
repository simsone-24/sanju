export type EnquiryStatus =
  | 'PENDING'
  | 'APPOINTMENT_FIXED'
  | 'QUOTATION_TO_SHARE'
  | 'QUOTATION_SHARED'
  | 'ORDER_CONFIRMED'
  | 'ORDER_LOST';

export type AppointmentStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface EnquiryListItem {
  id: string;
  enquiryNumber: string;
  eventName: string | null;
  eventDate: string | null;
  appointmentDate: string | null;
  appointmentTime: string | null;
  appointmentStatus: AppointmentStatus;
  status: EnquiryStatus;
  createdAt: string;
  // id is null while the enquiry is still an unconfirmed prospect (no Customer row yet).
  customer: { id: string | null; customerName: string; mobile: string };
  eventType: { id: string; eventName: string; colorCode: string | null };
  assignedUser: { id: string; fullName: string } | null;
}

// Present only while the enquiry has no linked Customer (i.e. customer.id is null). Carries the
// prospective customer's details, which become editable on the enquiry form until confirmation.
export interface EnquiryProspect {
  customerName: string;
  mobile: string;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
}

export interface EnquiryFollowUp {
  id: string;
  followUpDate: string;
  notes: string | null;
  outcome: string | null;
  createdAt: string;
  createdBy: { id: string; fullName: string } | null;
}

export interface EnquiryDetail extends EnquiryListItem {
  prospect: EnquiryProspect | null;
  mahal: string | null;
  venue: string | null;
  estimatedBudget: string | null;
  // Auto-set to the approved quotation's total when one is approved, but stays editable
  // afterward — see server/src/modules/quotations/service.ts approve().
  finalBudgetAmount: string | null;
  notes: string | null;
  meetingLocation: string | null;
  appointmentNotes: string | null;
  quotationAmount: string | null;
  quotationVersion: number | null;
  updatedAt: string;
  followUps: EnquiryFollowUp[];
}

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
  eventDate?: string;
  mahal?: string;
  venue?: string;
  estimatedBudget?: number;
  notes?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  meetingLocation?: string;
  appointmentNotes?: string;
  appointmentStatus?: AppointmentStatus;
  assignedUserId?: string;
  /** Defaults to NEW server-side. Only a status reachable from NEW may be set at creation. */
  status?: EnquiryStatus;
}

// Beyond the event/appointment fields, an update may edit the prospective customer's details —
// but only while the enquiry has no linked Customer yet (the server ignores these once confirmed).
// All fields are optional — mirrors server/src/modules/enquiries/validation.ts's updateEnquirySchema,
// which accepts a partial update (at least one field required) rather than a full replace.
export type UpdateEnquiryInput = Partial<Omit<CreateEnquiryInput, 'customer' | 'status'>> & {
  customerName?: string;
  mobile?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  city?: string;
  // Not settable at creation (see EnquiryDetail.finalBudgetAmount) — edit-only.
  finalBudgetAmount?: number;
};

export interface ListEnquiriesParams {
  page: number;
  limit: number;
  search?: string;
  status?: EnquiryStatus;
  appointmentStatus?: AppointmentStatus;
  eventTypeId?: string;
  assignedUserId?: string;
  customerId?: string;
  eventDateFrom?: string;
  eventDateTo?: string;
  appointmentDateFrom?: string;
  appointmentDateTo?: string;
}

export interface EnquiryStats {
  pendingAppointments: number;
  inProgressAppointments: number;
  quotationToShare: number;
  quotationShared: number;
}
