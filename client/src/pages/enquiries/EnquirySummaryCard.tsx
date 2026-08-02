import BadgeIcon from '@mui/icons-material/Badge';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CallIcon from '@mui/icons-material/Call';
import EditIcon from '@mui/icons-material/Edit';
import EventIcon from '@mui/icons-material/Event';
import HistoryIcon from '@mui/icons-material/History';
import PersonIcon from '@mui/icons-material/Person';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { Button, Stack, Tooltip } from '@mui/material';
import type { ReactNode } from 'react';
import { StatusBadge } from '../../components/StatusBadge';
import type { EnquiryDetail } from '../../types/enquiry';
import { formatCurrency, formatDate } from '../../utils/format';

interface EnquirySummaryCardProps {
  enquiry: EnquiryDetail;
  canEdit: boolean;
  showCreateQuotation: boolean;
  onEdit: () => void;
  onCreateQuotation: () => void;
  onCall: () => void;
  onWhatsApp: () => void;
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="tw-flex tw-items-start tw-gap-2">
      <span className="tw-mt-0.5 tw-flex tw-h-6 tw-w-6 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-bg-white/15 tw-text-white/90">
        {icon}
      </span>
      <span className="tw-min-w-0">
        <span className="tw-block tw-text-[0.7rem] tw-uppercase tw-tracking-wide tw-text-white/60">{label}</span>
        <span className="tw-block tw-truncate tw-text-sm tw-font-semibold tw-text-white">{value}</span>
      </span>
    </div>
  );
}

function Money({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="tw-rounded-xl tw-bg-white/10 tw-px-4 tw-py-3 tw-text-right">
      <span className="tw-block tw-text-[0.7rem] tw-uppercase tw-tracking-wide tw-text-white/60">{label}</span>
      <span className={`tw-block tw-font-bold tw-text-white ${emphasis ? 'tw-text-xl' : 'tw-text-lg'}`}>{value}</span>
    </div>
  );
}

// Final Budget is the figure the business is actually committed to once a quotation is approved,
// so it is called out rather than sitting as a third equal line among the money tiles.
function FinalBudget({ value }: { value: string | null }) {
  const settled = Boolean(value);
  return (
    <div
      className={[
        'tw-rounded-xl tw-px-4 tw-py-3 tw-text-right tw-ring-1',
        settled
          ? 'tw-bg-amber-300 tw-ring-amber-200'
          : 'tw-bg-white/5 tw-ring-white/20 tw-ring-dashed',
      ].join(' ')}
    >
      <span
        className={`tw-block tw-text-[0.7rem] tw-font-semibold tw-uppercase tw-tracking-wide ${
          settled ? 'tw-text-amber-900/70' : 'tw-text-white/60'
        }`}
      >
        Final Budget
      </span>
      <span className={`tw-block tw-text-2xl tw-font-bold ${settled ? 'tw-text-amber-950' : 'tw-text-white/70'}`}>
        {value ?? 'Not finalised'}
      </span>
    </div>
  );
}

const OUTLINE_BUTTON_SX = {
  color: '#FFFFFF',
  borderColor: 'rgba(255,255,255,0.5)',
  '&:hover': { borderColor: '#FFFFFF' },
} as const;

// Gradient hero for the Enquiry Details page, matching the Orders module's summary card so both
// detail pages read as one product: identity, customer, event, appointment and money above the
// fold, with the actions that are actually available at this stage of the workflow.
export function EnquirySummaryCard({
  enquiry,
  canEdit,
  showCreateQuotation,
  onEdit,
  onCreateQuotation,
  onCall,
  onWhatsApp,
}: EnquirySummaryCardProps) {
  const appointment = enquiry.appointmentDate
    ? `${formatDate(enquiry.appointmentDate)}${enquiry.appointmentTime ? ` · ${enquiry.appointmentTime}` : ''}`
    : 'Not scheduled';

  return (
    <div className="tw-mb-4 tw-overflow-hidden tw-rounded-card tw-bg-gradient-to-br tw-from-blue-600 tw-via-blue-700 tw-to-indigo-800 tw-p-6 tw-shadow-lifted">
      <div className="tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-6">
        <div className="tw-min-w-0 tw-flex-1">
          <h1 className="tw-text-3xl tw-font-bold tw-text-white">{enquiry.enquiryNumber}</h1>
          <p className="tw-mt-0.5 tw-text-sm tw-text-white/70">
            {enquiry.eventName || enquiry.eventType.eventName}
          </p>

          <div className="tw-mt-4 tw-grid tw-grid-cols-2 tw-gap-x-6 tw-gap-y-3 lg:tw-grid-cols-3">
            <InfoRow icon={<PersonIcon sx={{ fontSize: 15 }} />} label="Customer" value={enquiry.customer.customerName} />
            <InfoRow icon={<CallIcon sx={{ fontSize: 15 }} />} label="Mobile" value={enquiry.customer.mobile || '—'} />
            <InfoRow
              icon={<BadgeIcon sx={{ fontSize: 15 }} />}
              label="Assigned To"
              value={enquiry.assignedUser?.fullName ?? 'Unassigned'}
            />
            <InfoRow
              icon={<EventIcon sx={{ fontSize: 15 }} />}
              label="Event Date"
              value={formatDate(enquiry.eventDate)}
            />
            <InfoRow icon={<CalendarMonthIcon sx={{ fontSize: 15 }} />} label="Appointment" value={appointment} />
            <InfoRow
              icon={<HistoryIcon sx={{ fontSize: 15 }} />}
              label="Enquiry Raised"
              value={formatDate(enquiry.createdAt)}
            />
          </div>

          <div className="tw-mt-4 tw-flex tw-flex-wrap tw-items-center tw-gap-2">
            <StatusBadge type="enquiry" status={enquiry.status} />
            <StatusBadge type="appointment" status={enquiry.appointmentStatus} />
          </div>
        </div>

        <div className="tw-flex tw-w-full tw-flex-col tw-gap-2 sm:tw-w-auto sm:tw-min-w-[200px]">
          <FinalBudget value={enquiry.finalBudgetAmount ? formatCurrency(enquiry.finalBudgetAmount) : null} />
          <Money
            label="Estimated Budget"
            value={enquiry.estimatedBudget ? formatCurrency(enquiry.estimatedBudget) : '—'}
          />
          <Money
            label="Quotation"
            value={
              enquiry.quotationAmount
                ? `${formatCurrency(enquiry.quotationAmount)}${enquiry.quotationVersion ? ` (v${enquiry.quotationVersion})` : ''}`
                : 'Not quoted'
            }
          />
        </div>
      </div>

      <Stack direction="row" spacing={1} sx={{ mt: 3, flexWrap: 'wrap', rowGap: 1 }}>
        {canEdit && (
          <Button
            size="small"
            variant="contained"
            startIcon={<EditIcon />}
            onClick={onEdit}
            sx={{ bgcolor: 'rgba(255,255,255,0.95)', color: '#1D4ED8', '&:hover': { bgcolor: '#FFFFFF' } }}
          >
            Edit Enquiry
          </Button>
        )}
        {showCreateQuotation && (
          <Button size="small" variant="outlined" startIcon={<RequestQuoteIcon />} onClick={onCreateQuotation} sx={OUTLINE_BUTTON_SX}>
            Create Quotation
          </Button>
        )}
        <Tooltip title="Call the customer">
          <Button size="small" variant="outlined" startIcon={<CallIcon />} onClick={onCall} sx={OUTLINE_BUTTON_SX}>
            Call
          </Button>
        </Tooltip>
        <Tooltip title="Message the customer on WhatsApp">
          <Button size="small" variant="outlined" startIcon={<WhatsAppIcon />} onClick={onWhatsApp} sx={OUTLINE_BUTTON_SX}>
            WhatsApp
          </Button>
        </Tooltip>
      </Stack>
    </div>
  );
}
