import { AppointmentStatus, EnquiryStatus, EventTime } from '@prisma/client';

export interface NewCustomerInput {
  type: 'NEW';
  // Required for a real enquiry, but left as plain optional strings here rather than split into a
  // separate "draft customer" variant — a DRAFT enquiry may submit this shape with either field
  // blank, since validation.ts skips the required-field checks entirely when status is DRAFT.
  customerName?: string;
  mobile?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  city?: string;
}

export interface ExistingCustomerInput {
  type: 'EXISTING';
  customerId?: number;
}

export type CustomerInput = NewCustomerInput | ExistingCustomerInput;

/** One day the event runs, with the time of day it happens (optional). */
export interface EventDayInput {
  eventDate: Date;
  eventTime?: EventTime | null;
}

export interface CreateEnquiryInput {
  // Omitted entirely only for a DRAFT saved before any customer type was picked.
  customer?: CustomerInput;
  // Nullable/omitted for a DRAFT saved before an event type was picked (enquiries.event_type_id is
  // a nullable column for exactly this reason).
  eventTypeId?: number;
  eventName?: string;
  eventDate?: Date;
  eventTime?: EventTime;
  /** Every day the event runs. When given, the earliest becomes eventDate / eventTime. */
  eventDays?: EventDayInput[];
  mahal?: string;
  venue?: string;
  estimatedBudget?: number;
  /** The committed figure. Becomes the order's budget when the enquiry is confirmed. */
  finalBudgetAmount?: number;
  /** Already collected. Becomes the order's opening ADVANCE receipt when the enquiry is confirmed. */
  advanceAmount?: number;
  notes?: string;
  appointmentDate?: Date;
  appointmentTime?: string;
  meetingLocation?: string;
  appointmentNotes?: string;
  appointmentStatus?: AppointmentStatus;
  assignedUserId?: number;
  eventManagerId?: number;
  /** When the customer should next be contacted — the workflow's optional Follow-up step. */
  followUpDate?: Date;
  /** Defaults to NEW. Only a status reachable from NEW (see STATUS_TRANSITIONS in service.ts) may
   * be set directly at creation — for entering an enquiry that's already past its first contact,
   * e.g. one whose appointment was already scheduled when it's being logged into the system. */
  status?: EnquiryStatus;
}

export interface UpdateEnquiryInput {
  eventTypeId?: number;
  eventName?: string;
  eventDate?: Date;
  eventTime?: EventTime;
  /** Every day the event runs. When given, the earliest becomes eventDate / eventTime. */
  eventDays?: EventDayInput[];
  mahal?: string;
  venue?: string;
  estimatedBudget?: number;
  finalBudgetAmount?: number;
  /** Recorded alongside the final budget. Once the enquiry has an order, editing either figure
   *  re-syncs that order's budget and carries the advance across (service.ts syncOrderFromEnquiry). */
  advanceAmount?: number;
  notes?: string;
  appointmentDate?: Date;
  appointmentTime?: string;
  meetingLocation?: string;
  appointmentNotes?: string;
  appointmentStatus?: AppointmentStatus;
  assignedUserId?: number;
  /** null removes the event manager; undefined leaves it untouched. */
  eventManagerId?: number | null;
  /** null clears the date; undefined leaves it untouched. */
  followUpDate?: Date | null;
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

// The Enquiry index's dashboard cards ("md files/Enquiry/dashcount.md") — each maps to a where
// clause. CONFIRMED is a plain status equality (Order Confirmed) but is expressed as a group too
// so all four dashboard cards share one param and stay mutually exclusive; ACTIVE = everything but
// Order Lost, PENDING = neither Confirmed nor Lost, APPOINTMENT_PENDING = active enquiries whose
// appointment is still Pending or In Progress.
export type EnquiryStatusGroup = 'ACTIVE' | 'CONFIRMED' | 'PENDING' | 'APPOINTMENT_PENDING';

export interface ListEnquiriesParams {
  companyId: number;
  page: number;
  limit: number;
  search?: string;
  status?: EnquiryStatus;
  appointmentStatus?: AppointmentStatus;
  // Dashboard cards are single-select — at most one group is ever passed.
  statusGroup?: EnquiryStatusGroup[];
  eventTypeId?: number;
  assignedUserId?: number;
  customerId?: number;
  eventDateFrom?: Date;
  eventDateTo?: Date;
  appointmentDateFrom?: Date;
  appointmentDateTo?: Date;
}

// The dashboard cards' own counts narrow along with every other active list filter — everything
// list accepts except pagination and statusGroup, since each card defines its own group.
export type EnquiryStatsParams = Omit<ListEnquiriesParams, 'page' | 'limit' | 'statusGroup'>;

// "md files/Enquiry/dashcount.md" §1-4 — the Enquiry index's dashboard card counts.
export interface EnquiryStatsResult {
  totalEnquiries: number;
  confirmedEnquiries: number;
  pendingEnquiries: number;
  appointmentPending: number;
}
