import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CelebrationIcon from '@mui/icons-material/Celebration';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import EventIcon from '@mui/icons-material/Event';
import PersonIcon from '@mui/icons-material/Person';
import PlaceIcon from '@mui/icons-material/Place';
import PrintIcon from '@mui/icons-material/Print';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { Button, Stack, Tooltip } from '@mui/material';
import type { ReactNode } from 'react';
import { StatusBadge } from '../../components/StatusBadge';
import type { OrderDetail } from '../../types/order';
import { formatCurrency, formatDate } from '../../utils/format';

interface OrderSummaryCardProps {
  order: OrderDetail;
  canEdit: boolean;
  onEdit: () => void;
  onPrint: () => void;
  onDownload: () => void;
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

// Gradient order summary ("md files/order/view.md" §Header Section) — replaces the old bare
// page header so the order, its customer, event, stage and money are all readable at a glance.
export function OrderSummaryCard({ order, canEdit, onEdit, onPrint, onDownload, onWhatsApp }: OrderSummaryCardProps) {
  const eventName = order.enquiry.eventName || order.enquiry.eventType.eventName;

  return (
    <div className="tw-mb-4 tw-overflow-hidden tw-rounded-card tw-bg-gradient-to-br tw-from-blue-600 tw-via-blue-700 tw-to-indigo-800 tw-p-6 tw-shadow-lifted">
      <div className="tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-6">
        <div className="tw-min-w-0 tw-flex-1">
          <h1 className="tw-text-3xl tw-font-bold tw-text-white">{order.orderNumber}</h1>
          <p className="tw-mt-0.5 tw-text-sm tw-text-white/70">{eventName}</p>

          <div className="tw-mt-4 tw-grid tw-grid-cols-2 tw-gap-x-6 tw-gap-y-3 lg:tw-grid-cols-3">
            <InfoRow
              icon={<PersonIcon sx={{ fontSize: 15 }} />}
              label="Customer"
              value={order.customer.customerName}
            />
            <InfoRow
              icon={<CalendarMonthIcon sx={{ fontSize: 15 }} />}
              label="Created"
              value={formatDate(order.createdAt)}
            />
            <InfoRow
              icon={<CelebrationIcon sx={{ fontSize: 15 }} />}
              label="Event"
              value={order.enquiry.eventType.eventName}
            />
            <InfoRow
              icon={<EventIcon sx={{ fontSize: 15 }} />}
              label="Event Date"
              value={formatDate(order.eventDate)}
            />
            <InfoRow icon={<PlaceIcon sx={{ fontSize: 15 }} />} label="Venue" value={order.venue ?? '—'} />
            <div className="tw-flex tw-items-start tw-gap-2">
              <span className="tw-min-w-0">
                <span className="tw-block tw-text-[0.7rem] tw-uppercase tw-tracking-wide tw-text-white/60">
                  Status
                </span>
                <span className="tw-mt-1 tw-block">
                  <StatusBadge type="order" status={order.status} />
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="tw-flex tw-w-full tw-flex-col tw-gap-2 sm:tw-w-auto sm:tw-min-w-[200px]">
          <Money label="Estimated Amount" value={formatCurrency(order.totalAmount)} emphasis />
          <Money label="Paid" value={formatCurrency(order.paidAmount)} />
          <Money label="Balance" value={formatCurrency(order.pendingAmount)} />
        </div>
      </div>

      {/* The order itself has no PDF — the approved quotation is its priced document, so these
          three act on that. Tooltips say so rather than implying an "order PDF" exists. */}
      <Stack direction="row" spacing={1} sx={{ mt: 3, flexWrap: 'wrap', rowGap: 1 }}>
        {canEdit && (
          <Button
            size="small"
            variant="contained"
            startIcon={<EditIcon />}
            onClick={onEdit}
            sx={{ bgcolor: 'rgba(255,255,255,0.95)', color: '#1D4ED8', '&:hover': { bgcolor: '#FFFFFF' } }}
          >
            Edit Order
          </Button>
        )}
        <Tooltip title="Print the approved quotation">
          <Button
            size="small"
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={onPrint}
            sx={{ color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: '#FFFFFF' } }}
          >
            Print
          </Button>
        </Tooltip>
        <Tooltip title="Download the approved quotation PDF">
          <Button
            size="small"
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={onDownload}
            sx={{ color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: '#FFFFFF' } }}
          >
            Download PDF
          </Button>
        </Tooltip>
        <Tooltip title="Share the quotation with the customer on WhatsApp">
          <Button
            size="small"
            variant="outlined"
            startIcon={<WhatsAppIcon />}
            onClick={onWhatsApp}
            sx={{ color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: '#FFFFFF' } }}
          >
            Share WhatsApp
          </Button>
        </Tooltip>
      </Stack>
    </div>
  );
}
