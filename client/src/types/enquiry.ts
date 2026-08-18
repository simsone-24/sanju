export type EnquiryStatus =
  | 'PENDING'
  | 'APPOINTMENT_FIXED'
  | 'QUOTATION_TO_SHARE'
  | 'QUOTATION_SHARED'
  | 'ORDER_CONFIRMED'
  | 'ORDER_LOST';

export type AppointmentStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type EventTime = 'MORNING' | 'EVENING';

export interface EnquiryListItem {
  id: number;
  enquiryNumber: string;
  eventName: string | null;
  eventDate: string | null;
  appointmentDate: string | null;
  appointmentTime: string | null;
  appointmentStatus: AppointmentStatus;
  status: EnquiryStatus;
  createdAt: string;
  // id is null while the enquiry is still an unconfirmed prospect (no Customer row yet).
  customer: { id: number | null; customerName: string; mobile: string };
  eventType: { id: number; eventName: string; colorCode: string | null };
  assignedUser: { id: number; fullName: string } | null;
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
  id: number;
  followUpDate: string;
  notes: string | null;
  outcome: string | null;
  createdAt: string;
  createdBy: { id: number; fullName: string } | null;
}

export interface EnquiryDetail extends EnquiryListItem {
  prospect: EnquiryProspect | null;
  eventTime: EventTime | null;
  mahal: string | null;
  venue: string | null;
  estimatedBudget: string | null;
  // Auto-set to the approved quotation's total when one is approved, but stays editable
  // afterward — see server/src/modules/quotations/service.ts approve().
  finalBudgetAmount: string | null;
  /** The advance agreed at enquiry stage — a record only; it creates no payment. */
  advanceAmount: string | null;
  notes: string | null;
  meetingLocation: string | null;
  appointmentNotes: string | null;
  quotationAmount: string | null;
  quotationVersion: number | null;
  /** When the customer should next be contacted — the workflow's optional Follow-up step. */
  followUpDate: string | null;
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
  customerId: number;
}

export type CustomerInput = NewCustomerInput | ExistingCustomerInput;

export interface CreateEnquiryInput {
  customer: CustomerInput;
  eventTypeId: number;
  eventName?: string;
  eventDate?: string;
  eventTime?: EventTime;
  mahal?: string;
  venue?: string;
  estimatedBudget?: number;
  /** The committed figure — becomes the order's budget when the enquiry is confirmed. */
  finalBudgetAmount?: number;
  /** Already collected — becomes the order's opening ADVANCE receipt when the enquiry is confirmed. */
  advanceAmount?: number;
  notes?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  meetingLocation?: string;
  appointmentNotes?: string;
  appointmentStatus?: AppointmentStatus;
  assignedUserId?: number;
  followUpDate?: string;
  /** Defaults to NEW server-side. Only a status reachable from NEW may be set at creation. */
  status?: EnquiryStatus;
}

// Beyond the event/appointment fields, an update may edit the prospective customer's details —
// but only while the enquiry has no linked Customer yet (the server ignores these once confirmed).
// All fields are optional — mirrors server/src/modules/enquiries/validation.ts's updateEnquirySchema,
// which accepts a partial update (at least one field required) rather than a full replace.
// followUpDate is re-declared below as nullable, so it is omitted here rather than intersected —
// intersecting `string | undefined` with `string | null | undefined` would collapse back to string.
export type UpdateEnquiryInput = Partial<Omit<CreateEnquiryInput, 'customer' | 'status' | 'followUpDate'>> & {
  customerName?: string;
  mobile?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  city?: string;
  /** null clears the follow-up date; omitting it leaves the stored value alone. */
  followUpDate?: string | null;
};

/**
 * One entry in the enquiry's complete history — "md files/Enquiry/enq.md" §8.
 *
 * Spans the enquiry, its quotations, and the order it became, so `module` says which record the
 * entry belongs to and is what the UI groups and colours by.
 */
export interface EnquiryTimelineEntry {
  id: number;
  module: string;
  action: string;
  description: string | null;
  performedAt: string;
  performedBy: { id: number; fullName: string } | null;
}

// "md files/Enquiry/dashcount.md" §1-4 — dashboard card filters that aren't a single
// status/appointmentStatus equality.
export type EnquiryStatusGroup = 'ACTIVE' | 'CONFIRMED' | 'PENDING' | 'APPOINTMENT_PENDING';

export interface ListEnquiriesParams {
  page: number;
  limit: number;
  search?: string;
  status?: EnquiryStatus;
  appointmentStatus?: AppointmentStatus;
  // Comma-separated EnquiryStatusGroup values — several dashboard cards can be active at once.
  statusGroup?: string;
  eventTypeId?: number;
  assignedUserId?: number;
  customerId?: number;
  eventDateFrom?: string;
  eventDateTo?: string;
  appointmentDateFrom?: string;
  appointmentDateTo?: string;
}

export interface EnquiryStats {
  totalEnquiries: number;
  confirmedEnquiries: number;
  pendingEnquiries: number;
  appointmentPending: number;
}
