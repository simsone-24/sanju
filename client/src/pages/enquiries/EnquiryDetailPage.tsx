import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BadgeIcon from '@mui/icons-material/Badge';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CelebrationIcon from '@mui/icons-material/Celebration';
import EmailIcon from '@mui/icons-material/Email';
import EventIcon from '@mui/icons-material/Event';
import FlagIcon from '@mui/icons-material/Flag';
import HistoryIcon from '@mui/icons-material/History';
import HomeIcon from '@mui/icons-material/Home';
import LaunchIcon from '@mui/icons-material/Launch';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import NotesIcon from '@mui/icons-material/Notes';
import PaidIcon from '@mui/icons-material/Paid';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import PlaceIcon from '@mui/icons-material/Place';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import ScheduleIcon from '@mui/icons-material/Schedule';
import UpdateIcon from '@mui/icons-material/Update';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import {
  Box,
  Button,
  Chip,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { CardSection, DetailRow } from '../../components/DetailRow';
import { StatusBadge } from '../../components/StatusBadge';
import { usePermission } from '../../hooks/usePermission';
import * as customerService from '../../services/customerService';
import * as enquiryService from '../../services/enquiryService';
import * as quotationService from '../../services/quotationService';
import { useToast } from '../../store/ToastContext';
import type { QuotationListItem } from '../../types/quotation';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/format';
import { EnquiryProgressTracker } from './EnquiryProgressTracker';
import { EnquiryQuotationActions } from './EnquiryQuotationActions';
import { EnquiryQuotationDialog } from './EnquiryQuotationDialog';
import { EnquiryStatusDialog } from './EnquiryStatusDialog';
import { EnquirySummaryCard } from './EnquirySummaryCard';
import { EnquiryTimelineCard } from './EnquiryTimelineCard';

function DetailSkeleton() {
  return (
    <Box>
      <Skeleton variant="rounded" height={190} sx={{ borderRadius: '16px', mb: 2 }} />
      <Skeleton variant="rounded" height={96} sx={{ borderRadius: '16px', mb: 2 }} />
      <Skeleton variant="rounded" height={380} sx={{ borderRadius: '16px' }} />
    </Box>
  );
}

const CARD_SX = { borderRadius: '16px', p: { xs: 2, sm: 3 }, minWidth: 0 } as const;

export default function EnquiryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const canEdit = usePermission('ENQUIRIES', 'canEdit');
  const canCreateQuotation = usePermission('QUOTATIONS', 'canCreate');
  const canExport = usePermission('QUOTATIONS', 'canExport');
  const canViewCustomers = usePermission('CUSTOMERS', 'canView');
  const canChangeStatus = usePermission('ENQUIRIES', 'canChangeStatus');
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  // "md files/Enquiry/flow.md" §2.3: Create Quotation opens a modal rather than navigating away.
  const [quotationDialogOpen, setQuotationDialogOpen] = useState(false);
  const [actionsAnchor, setActionsAnchor] = useState<HTMLElement | null>(null);

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
      <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: '16px' }}>
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

  const showCreateQuotation = canCreateQuotation;

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
    {
      key: 'updatedAt',
      header: 'Last Updated',
      render: (row) => formatDate(row.updatedAt),
      exportValue: (row) => formatDate(row.updatedAt),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <EnquiryQuotationActions row={row} onView={(quotationId) => navigate(`/quotations/${quotationId}`)} />
      ),
    },
  ];

  // A prospect carries its contact details on the enquiry itself; a confirmed enquiry reads them
  // from the linked Customer record. Both shapes expose the same four fields.
  const contact = enquiry.prospect ?? customerRecord ?? null;

  function closeActions() {
    setActionsAnchor(null);
  }

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
      <Stack
        direction="row"
        spacing={2}
        sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', rowGap: 1 }}
      >
        <Breadcrumbs
          items={[
            { label: 'Dashboard', to: '/' },
            { label: 'Enquiries', to: '/enquiries' },
            { label: enquiry.enquiryNumber },
          ]}
        />
        <Button
          size="small"
          variant="outlined"
          endIcon={<MoreVertIcon />}
          aria-haspopup="menu"
          aria-expanded={actionsAnchor ? 'true' : undefined}
          onClick={(event) => setActionsAnchor(event.currentTarget)}
          sx={{ mb: 1.25 }}
        >
          Actions
        </Button>
        <Menu anchorEl={actionsAnchor} open={Boolean(actionsAnchor)} onClose={closeActions}>
          {canChangeStatus && (
            <MenuItem
              onClick={() => {
                closeActions();
                setStatusDialogOpen(true);
              }}
            >
              <ListItemIcon>
                <FlagIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Change Status" />
            </MenuItem>
          )}
          {/* Only once a Customer row exists, and only for a role the API will serve. */}
          {enquiry.customer.id && canViewCustomers && (
            <MenuItem
              onClick={() => {
                closeActions();
                navigate(`/customers/${enquiry.customer.id}`);
              }}
            >
              <ListItemIcon>
                <LaunchIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="View customer profile" />
            </MenuItem>
          )}
        </Menu>
      </Stack>

      <EnquirySummaryCard
        enquiry={enquiry}
        canEdit={canEdit}
        showCreateQuotation={showCreateQuotation}
        onEdit={() => navigate(`/enquiries/${enquiry.id}/edit`)}
        onCreateQuotation={() => setQuotationDialogOpen(true)}
        onCall={handleCall}
        onWhatsApp={handleWhatsApp}
      />

      <EnquiryProgressTracker status={enquiry.status} />

      {/* Single page, section by section — customer, event, appointment, commercials, notes and
          quotations are all readable without switching tabs. */}
      <Box
        sx={{
          display: 'grid',
          gap: 2.5,
          alignItems: 'start',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.7fr) minmax(320px, 1fr)' },
        }}
      >
        <Stack spacing={2.5} sx={{ minWidth: 0 }}>
          <Paper variant="outlined" sx={CARD_SX}>
            <Stack
              direction="row"
              spacing={2}
              sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', rowGap: 1 }}
            >
              <Typography variant="h4" component="h2">
                Customer &amp; Event Details
              </Typography>
              {customerRecord && <Chip size="small" variant="outlined" label={customerRecord.customerCode} />}
              {!enquiry.customer.id && (
                <Chip size="small" variant="outlined" label="Prospect — added on Order Confirmed" />
              )}
            </Stack>

            <Box
              sx={{
                display: 'grid',
                gap: { xs: 3, md: 4 },
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
              }}
            >
              <CardSection icon={<PersonOutlinedIcon fontSize="small" />} title="Customer Information" tone="primary">
                <DetailRow
                  icon={<WhatsAppIcon sx={{ fontSize: 16 }} />}
                  label="WhatsApp"
                  value={contact?.whatsapp || '—'}
                />
                <DetailRow icon={<EmailIcon sx={{ fontSize: 16 }} />} label="Email" value={contact?.email || '—'} />
                <DetailRow
                  icon={<LocationCityIcon sx={{ fontSize: 16 }} />}
                  label="City"
                  value={contact?.city || '—'}
                />
                <DetailRow icon={<HomeIcon sx={{ fontSize: 16 }} />} label="Address" value={contact?.address || '—'} />
              </CardSection>

              <CardSection icon={<CelebrationIcon fontSize="small" />} title="Event Details" tone="success">
                <DetailRow
                  icon={<EventIcon sx={{ fontSize: 16 }} />}
                  label="Event Name"
                  value={enquiry.eventName || '—'}
                />
                <DetailRow
                  icon={<CalendarMonthIcon sx={{ fontSize: 16 }} />}
                  label="Event Date"
                  value={enquiry.eventDate ? formatDate(enquiry.eventDate) : '—'}
                />
                <DetailRow icon={<MeetingRoomIcon sx={{ fontSize: 16 }} />} label="Mahal" value={enquiry.mahal || '—'} />
                <DetailRow icon={<PlaceIcon sx={{ fontSize: 16 }} />} label="Venue" value={enquiry.venue || '—'} />
              </CardSection>
            </Box>
          </Paper>

          <Paper variant="outlined" sx={CARD_SX}>
            <CardSection icon={<CalendarMonthIcon fontSize="small" />} title="Appointment" tone="info">
              <DetailRow
                icon={<CalendarMonthIcon sx={{ fontSize: 16 }} />}
                label="Scheduled For"
                value={appointmentSchedule}
              />
              <DetailRow
                icon={<ScheduleIcon sx={{ fontSize: 16 }} />}
                label="Status"
                value={<StatusBadge type="appointment" status={enquiry.appointmentStatus} />}
              />
              <DetailRow
                icon={<PlaceIcon sx={{ fontSize: 16 }} />}
                label="Meeting Location"
                value={enquiry.meetingLocation || '—'}
              />
              <DetailRow
                icon={<NotesIcon sx={{ fontSize: 16 }} />}
                label="Discussion Notes"
                value={
                  <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: 'pre-line' }}>
                    {enquiry.appointmentNotes || '—'}
                  </Typography>
                }
              />
            </CardSection>
          </Paper>

          <Paper variant="outlined" sx={CARD_SX}>
            <Stack
              direction="row"
              spacing={2}
              sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', rowGap: 1 }}
            >
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', minWidth: 0 }}>
                <RequestQuoteIcon fontSize="small" sx={{ color: 'primary.main' }} />
                <Typography variant="h4" component="h2">
                  Quotations ({quotations?.records.length ?? 0})
                </Typography>
              </Stack>
              {showCreateQuotation && (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<RequestQuoteIcon />}
                  onClick={() => setQuotationDialogOpen(true)}
                >
                  Create Quotation
                </Button>
              )}
            </Stack>
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
          </Paper>
        </Stack>

        <Stack spacing={2.5} sx={{ minWidth: 0 }}>
          <Paper variant="outlined" sx={CARD_SX}>
            <Typography variant="h4" component="h2" sx={{ mb: 2.5 }}>
              Commercials
            </Typography>

            {/* The committed figure — set from the approved quotation and editable afterwards, so it
                is the number people come to this card for. Called out rather than listed. */}
            <Box
              sx={(theme) => ({
                px: 2,
                py: 1.5,
                mb: 2.5,
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
                  color="text.secondary"
                  sx={{ fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}
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
                  ? "Amount committed for this enquiry — becomes the order's budget on confirmation."
                  : 'Set automatically when a quotation is approved.'}
              </Typography>
            </Box>

            <Stack spacing={1.75}>
              <DetailRow
                icon={<PaidIcon sx={{ fontSize: 16 }} />}
                label="Estimated Budget"
                value={enquiry.estimatedBudget ? formatCurrency(enquiry.estimatedBudget) : '—'}
              />
              <DetailRow
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
              {/* Only once recorded — an enquiry-stage advance is optional, and an empty row would
                  imply money is owed. */}
              {enquiry.advanceAmount && (
                <DetailRow
                  icon={<PaidIcon sx={{ fontSize: 16 }} />}
                  label="Advance Amount"
                  value={formatCurrency(enquiry.advanceAmount)}
                />
              )}
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={CARD_SX}>
            <Typography variant="h4" component="h2" sx={{ mb: 2.5 }}>
              Tracking
            </Typography>
            <Stack spacing={1.75}>
              <DetailRow
                icon={<BadgeIcon sx={{ fontSize: 16 }} />}
                label="Assigned To"
                value={enquiry.assignedUser?.fullName ?? 'Unassigned'}
              />
              <DetailRow
                icon={<UpdateIcon sx={{ fontSize: 16 }} />}
                label="Follow-up Date"
                value={enquiry.followUpDate ? formatDate(enquiry.followUpDate) : 'None due'}
              />
              <DetailRow
                icon={<HistoryIcon sx={{ fontSize: 16 }} />}
                label="Enquiry Raised"
                value={formatDateTime(enquiry.createdAt)}
              />
              <DetailRow
                icon={<UpdateIcon sx={{ fontSize: 16 }} />}
                label="Last Updated"
                value={formatDateTime(enquiry.updatedAt)}
              />
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={CARD_SX}>
            <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 2 }}>
              <NotesIcon fontSize="small" sx={{ color: 'primary.main' }} />
              <Typography variant="h4" component="h2">
                Notes
              </Typography>
            </Stack>
            <Typography
              variant="body2"
              color={enquiry.notes ? 'text.primary' : 'text.secondary'}
              sx={{ whiteSpace: 'pre-line' }}
            >
              {enquiry.notes || 'No notes recorded for this enquiry.'}
            </Typography>
          </Paper>
        </Stack>
      </Box>

      <Box sx={{ mt: 2.5 }}>
        <EnquiryTimelineCard enquiryId={enquiry.id} />
      </Box>

      <EnquiryStatusDialog
        open={statusDialogOpen}
        enquiryId={enquiry.id}
        currentStatus={enquiry.status}
        onClose={() => setStatusDialogOpen(false)}
      />

      {/* flow.md §2.3: saving the quotation returns the user to the Enquiry List. */}
      <EnquiryQuotationDialog
        open={quotationDialogOpen}
        enquiry={{
          id: enquiry.id,
          enquiryNumber: enquiry.enquiryNumber,
          customerName: enquiry.customer.customerName,
        }}
        onClose={() => setQuotationDialogOpen(false)}
        onSaved={() => {
          setQuotationDialogOpen(false);
          navigate('/enquiries', { state: { highlightId: enquiry.id } });
        }}
      />
    </Box>
  );
}
