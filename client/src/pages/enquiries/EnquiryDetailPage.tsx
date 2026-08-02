import AddCommentIcon from '@mui/icons-material/AddComment';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BadgeIcon from '@mui/icons-material/Badge';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CallIcon from '@mui/icons-material/Call';
import CelebrationIcon from '@mui/icons-material/Celebration';
import EmailIcon from '@mui/icons-material/Email';
import EventIcon from '@mui/icons-material/Event';
import HistoryIcon from '@mui/icons-material/History';
import HomeIcon from '@mui/icons-material/Home';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import NotesIcon from '@mui/icons-material/Notes';
import PaidIcon from '@mui/icons-material/Paid';
import PlaceIcon from '@mui/icons-material/Place';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import ScheduleIcon from '@mui/icons-material/Schedule';
import UpdateIcon from '@mui/icons-material/Update';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { Box, Button, Chip, Paper, Skeleton, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { InfoCard, InfoLine } from '../../components/InfoCard';
import { StatusBadge } from '../../components/StatusBadge';
import { usePermission } from '../../hooks/usePermission';
import * as customerService from '../../services/customerService';
import * as enquiryService from '../../services/enquiryService';
import * as quotationService from '../../services/quotationService';
import { useToast } from '../../store/ToastContext';
import type { QuotationListItem } from '../../types/quotation';
import { avatarHue, avatarInitials } from '../../utils/avatar';
import { formatCurrency, formatDate } from '../../utils/format';
import { canCreateQuotationForEnquiry } from './enquiryStatusTransitions';
import { EnquiryFollowUpDialog } from './EnquiryFollowUpDialog';
import { EnquiryProgressTracker } from './EnquiryProgressTracker';
import { EnquirySummaryCard } from './EnquirySummaryCard';

function DetailSkeleton() {
  return (
    <Box>
      <Skeleton variant="rounded" height={230} sx={{ borderRadius: '16px', mb: 2 }} />
      <Skeleton variant="rounded" height={86} sx={{ borderRadius: '16px', mb: 2 }} />
      <Skeleton variant="rounded" height={320} sx={{ borderRadius: '16px' }} />
    </Box>
  );
}

export default function EnquiryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const canEdit = usePermission('ENQUIRIES', 'canEdit');
  const canCreateQuotation = usePermission('QUOTATIONS', 'canCreate');
  const canExport = usePermission('QUOTATIONS', 'canExport');
  const canViewCustomers = usePermission('CUSTOMERS', 'canView');
  const [followUpEnquiryId, setFollowUpEnquiryId] = useState<string | null>(null);

  const { data: enquiry, isLoading } = useQuery({
    queryKey: ['enquiry', id],
    queryFn: () => enquiryService.getById(id!),
    enabled: Boolean(id),
  });

  const { data: quotations } = useQuery({
    queryKey: ['quotations', { enquiryId: id }],
    queryFn: () => quotationService.list({ page: 1, limit: 50, enquiryId: id! }),
    enabled: Boolean(id),
  });

  // Contact details live on the enquiry only while it is an unconfirmed prospect; once a Customer
  // row exists they live there, so fetch it to keep the Customer card populated either way. Gated
  // on the same permission the API enforces (server/src/modules/customers/routes.ts).
  const { data: customerRecord } = useQuery({
    queryKey: ['customer', enquiry?.customer.id],
    queryFn: () => customerService.getById(enquiry!.customer.id!),
    enabled: Boolean(enquiry?.customer.id) && canViewCustomers,
  });

  if (isLoading) return <DetailSkeleton />;

  if (!enquiry) {
    return (
      <Paper variant="outlined" sx={{ p: 6, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ mb: 1 }}>
          Enquiry not found
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          It may have been deleted, or the link is no longer valid.
        </Typography>
        <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={() => navigate('/enquiries')}>
          Back to Enquiries
        </Button>
      </Paper>
    );
  }

  const showCreateQuotation = canCreateQuotation && canCreateQuotationForEnquiry(enquiry.status);

  const quotationColumns: DataTableColumn<QuotationListItem>[] = [
    {
      key: 'quotationNumber',
      header: 'Quotation No',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
          {row.quotationNumber}
        </Typography>
      ),
      exportValue: (row) => row.quotationNumber,
    },
    { key: 'version', header: 'Version', render: (row) => `v${row.version}`, exportValue: (row) => `v${row.version}` },
    {
      key: 'quotationDate',
      header: 'Date',
      render: (row) => formatDate(row.quotationDate),
      exportValue: (row) => formatDate(row.quotationDate),
    },
    {
      key: 'totalAmount',
      header: 'Total',
      align: 'right',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {formatCurrency(row.totalAmount)}
        </Typography>
      ),
      exportValue: (row) => row.totalAmount,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (row) => <StatusBadge type="quotation" status={row.status} />,
      exportValue: (row) => row.status,
    },
  ];

  const customerHue = avatarHue(enquiry.customer.customerName || enquiry.id);

  // A prospect carries its contact details on the enquiry itself; a confirmed enquiry reads them
  // from the linked Customer record. Both shapes expose the same four fields.
  const contact = enquiry.prospect ?? customerRecord ?? null;

  function dialableNumber() {
    return (enquiry?.customer.mobile ?? '').replace(/\D/g, '');
  }

  function handleCall() {
    const number = dialableNumber();
    if (!number) {
      showToast('This customer has no mobile number on record.', 'error');
      return;
    }
    window.location.href = `tel:${number}`;
  }

  function handleWhatsApp() {
    if (!enquiry) return;
    const number = (contact?.whatsapp || enquiry.customer.mobile || '').replace(/\D/g, '');
    if (!number) {
      showToast('This customer has no WhatsApp number on record.', 'error');
      return;
    }
    const message = `Hello ${enquiry.customer.customerName}, regarding your enquiry ${enquiry.enquiryNumber}. Regards.`;
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
  }

  const appointmentSchedule = enquiry.appointmentDate
    ? `${formatDate(enquiry.appointmentDate)}${enquiry.appointmentTime ? ` · ${enquiry.appointmentTime}` : ''}`
    : 'Not scheduled';

  return (
    <Box>
      <Breadcrumbs
        items={[
          { label: 'Dashboard', to: '/' },
          { label: 'Enquiries', to: '/enquiries' },
          { label: enquiry.enquiryNumber },
        ]}
      />

      <EnquirySummaryCard
        enquiry={enquiry}
        canEdit={canEdit}
        showCreateQuotation={showCreateQuotation}
        onEdit={() => navigate(`/enquiries/${enquiry.id}/edit`)}
        onCreateQuotation={() => navigate(`/quotations/new?enquiryId=${enquiry.id}`)}
        onCall={handleCall}
        onWhatsApp={handleWhatsApp}
      />

      <EnquiryProgressTracker status={enquiry.status} />

      {/* Single page, section by section — customer, event, appointment, commercials, notes,
          follow-ups and quotations are all readable without switching tabs. */}
      <Stack spacing={3}>
        <Box
          sx={{
            display: 'grid',
            gap: 2.5,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
          }}
        >
          <InfoCard
            icon={
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: customerHue,
                  bgcolor: `color-mix(in srgb, ${customerHue} 16%, transparent)`,
                }}
              >
                {avatarInitials(enquiry.customer.customerName)}
              </Box>
            }
            title={
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 0.5 }}>
                <span>{enquiry.customer.customerName}</span>
                {customerRecord && <Chip size="small" variant="outlined" label={customerRecord.customerCode} />}
              </Stack>
            }
            footer={
              enquiry.customer.id ? (
                // Gated on CUSTOMERS.canView so the link never lands a role on a page the API
                // refuses to serve.
                canViewCustomers && (
                  <Button size="small" onClick={() => navigate(`/customers/${enquiry.customer.id}`)}>
                    View customer profile
                  </Button>
                )
              ) : (
                <Chip size="small" variant="outlined" label="Prospect — added on Order Confirmed" />
              )
            }
          >
            <InfoLine icon={<CallIcon sx={{ fontSize: 16 }} />} label="Mobile" value={enquiry.customer.mobile || '—'} />
            <InfoLine
              icon={<WhatsAppIcon sx={{ fontSize: 16 }} />}
              label="WhatsApp"
              value={contact?.whatsapp || '—'}
            />
            <InfoLine icon={<EmailIcon sx={{ fontSize: 16 }} />} label="Email" value={contact?.email || '—'} />
            <InfoLine icon={<LocationCityIcon sx={{ fontSize: 16 }} />} label="City" value={contact?.city || '—'} />
            <InfoLine icon={<HomeIcon sx={{ fontSize: 16 }} />} label="Address" value={contact?.address || '—'} />
          </InfoCard>

          <InfoCard title="Event Details" icon={<CelebrationIcon />}>
            <InfoLine
              icon={<CelebrationIcon sx={{ fontSize: 16 }} />}
              label="Event Type"
              value={enquiry.eventType.eventName}
            />
            <InfoLine icon={<EventIcon sx={{ fontSize: 16 }} />} label="Event Name" value={enquiry.eventName || '—'} />
            <InfoLine
              icon={<CalendarMonthIcon sx={{ fontSize: 16 }} />}
              label="Event Date"
              value={enquiry.eventDate ? formatDate(enquiry.eventDate) : '—'}
            />
            <InfoLine icon={<MeetingRoomIcon sx={{ fontSize: 16 }} />} label="Mahal" value={enquiry.mahal || '—'} />
            <InfoLine icon={<PlaceIcon sx={{ fontSize: 16 }} />} label="Venue" value={enquiry.venue || '—'} />
          </InfoCard>

          <InfoCard title="Appointment" icon={<CalendarMonthIcon />}>
            <InfoLine
              icon={<CalendarMonthIcon sx={{ fontSize: 16 }} />}
              label="Scheduled For"
              value={appointmentSchedule}
            />
            <InfoLine
              icon={<ScheduleIcon sx={{ fontSize: 16 }} />}
              label="Appointment Status"
              value={<StatusBadge type="appointment" status={enquiry.appointmentStatus} />}
            />
            <InfoLine
              icon={<PlaceIcon sx={{ fontSize: 16 }} />}
              label="Meeting Location"
              value={enquiry.meetingLocation || '—'}
            />
            <InfoLine
              icon={<NotesIcon sx={{ fontSize: 16 }} />}
              label="Discussion Notes"
              value={enquiry.appointmentNotes || '—'}
            />
          </InfoCard>

          <InfoCard title="Commercials" icon={<PaidIcon />}>
            <InfoLine
              icon={<PaidIcon sx={{ fontSize: 16 }} />}
              label="Estimated Budget"
              value={enquiry.estimatedBudget ? formatCurrency(enquiry.estimatedBudget) : '—'}
            />
            <InfoLine
              icon={<RequestQuoteIcon sx={{ fontSize: 16 }} />}
              label="Quotation Amount"
              value={
                enquiry.quotationAmount
                  ? `${formatCurrency(enquiry.quotationAmount)}${
                      enquiry.quotationVersion ? ` (v${enquiry.quotationVersion})` : ''
                    }`
                  : 'Not quoted'
              }
            />
            {/* The committed figure — set from the approved quotation and editable afterwards, so it
                is the number people come to this card for. Called out instead of listed. */}
            <Box
              sx={(theme) => ({
                mt: 0.5,
                px: 2,
                py: 1.5,
                borderRadius: '12px',
                border: '1px solid',
                borderColor: enquiry.finalBudgetAmount ? 'warning.main' : 'divider',
                borderStyle: enquiry.finalBudgetAmount ? 'solid' : 'dashed',
                backgroundColor: enquiry.finalBudgetAmount
                  ? `color-mix(in srgb, ${(theme.vars ?? theme).palette.warning.main} 14%, transparent)`
                  : 'transparent',
              })}
            >
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.25 }}>
                <PaidIcon sx={{ fontSize: 16, color: enquiry.finalBudgetAmount ? 'warning.main' : 'text.secondary' }} />
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}
                  color="text.secondary"
                >
                  Final Budget
                </Typography>
              </Stack>
              <Typography
                variant="h3"
                component="div"
                sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
                color={enquiry.finalBudgetAmount ? 'text.primary' : 'text.secondary'}
              >
                {enquiry.finalBudgetAmount ? formatCurrency(enquiry.finalBudgetAmount) : 'Not finalised'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {enquiry.finalBudgetAmount
                  ? 'Amount committed for this enquiry.'
                  : 'Set automatically when a quotation is approved.'}
              </Typography>
            </Box>
          </InfoCard>

          <InfoCard title="Tracking" icon={<HistoryIcon />}>
            <InfoLine
              icon={<BadgeIcon sx={{ fontSize: 16 }} />}
              label="Assigned To"
              value={enquiry.assignedUser?.fullName ?? 'Unassigned'}
            />
            <InfoLine
              icon={<HistoryIcon sx={{ fontSize: 16 }} />}
              label="Enquiry Raised"
              value={formatDate(enquiry.createdAt)}
            />
            <InfoLine
              icon={<UpdateIcon sx={{ fontSize: 16 }} />}
              label="Last Updated"
              value={formatDate(enquiry.updatedAt)}
            />
            <InfoLine
              icon={<HistoryIcon sx={{ fontSize: 16 }} />}
              label="Follow-ups"
              value={
                enquiry.followUps.length > 0
                  ? `${enquiry.followUps.length} recorded · latest ${formatDate(enquiry.followUps[0].followUpDate)}`
                  : 'None recorded'
              }
            />
          </InfoCard>

          <InfoCard title="Notes" icon={<NotesIcon />}>
            <Typography
              variant="body2"
              color={enquiry.notes ? 'text.primary' : 'text.secondary'}
              sx={{ whiteSpace: 'pre-line' }}
            >
              {enquiry.notes || 'No notes recorded for this enquiry.'}
            </Typography>
          </InfoCard>
        </Box>

        <InfoCard
          title={`Follow-ups (${enquiry.followUps.length})`}
          icon={<HistoryIcon />}
          action={
            canEdit && (
              <Button size="small" startIcon={<AddCommentIcon />} onClick={() => setFollowUpEnquiryId(enquiry.id)}>
                Record Follow-up
              </Button>
            )
          }
        >
          {enquiry.followUps.length === 0 ? (
            <Box sx={{ py: 5, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                No follow-ups yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Record what was discussed after a call or meeting so the next person picks up where you left off.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={0}>
              {enquiry.followUps.map((followUp, index) => (
                <Stack key={followUp.id} direction="row" spacing={2}>
                  {/* Timeline rail: a dot per entry, joined by a line except after the last one. */}
                  <Stack sx={{ alignItems: 'center', flexShrink: 0 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'primary.main', mt: 0.75 }} />
                    {index < enquiry.followUps.length - 1 && (
                      <Box sx={{ width: 2, flexGrow: 1, bgcolor: 'divider', my: 0.5 }} />
                    )}
                  </Stack>
                  <Box sx={{ pb: index < enquiry.followUps.length - 1 ? 3 : 0, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {formatDate(followUp.followUpDate)}
                      {followUp.outcome ? ` · ${followUp.outcome}` : ''}
                    </Typography>
                    {followUp.notes && (
                      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                        {followUp.notes}
                      </Typography>
                    )}
                    {followUp.createdBy && (
                      <Typography variant="caption" color="text.secondary">
                        by {followUp.createdBy.fullName}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              ))}
            </Stack>
          )}
        </InfoCard>

        <InfoCard
          title={`Quotations (${quotations?.records.length ?? 0})`}
          icon={<RequestQuoteIcon />}
          action={
            showCreateQuotation && (
              <Button
                size="small"
                variant="contained"
                startIcon={<RequestQuoteIcon />}
                onClick={() => navigate(`/quotations/new?enquiryId=${enquiry.id}`)}
              >
                Create Quotation
              </Button>
            )
          }
        >
          <DataTable
            disableContainer
            columns={quotationColumns}
            rows={quotations?.records ?? []}
            getRowId={(row) => row.id}
            page={1}
            limit={50}
            onPageChange={() => undefined}
            onLimitChange={() => undefined}
            onRowClick={(row) => navigate(`/quotations/${row.id}`)}
            exportFileName={`${enquiry.enquiryNumber}-quotations`}
            canExport={canExport}
            emptyState={{
              icon: <RequestQuoteIcon sx={{ fontSize: 36 }} />,
              title: 'No quotations yet',
              description: showCreateQuotation
                ? 'Create a quotation to share pricing with this customer.'
                : 'No quotation has been created for this enquiry.',
            }}
          />
        </InfoCard>
      </Stack>

      <EnquiryFollowUpDialog enquiryId={followUpEnquiryId} onClose={() => setFollowUpEnquiryId(null)} />
    </Box>
  );
}
