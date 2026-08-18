import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CelebrationIcon from '@mui/icons-material/Celebration';
import EmailIcon from '@mui/icons-material/Email';
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
  Divider,
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
import { useNavigate } from 'react-router-dom';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { CardSection, DetailRow } from '../../components/DetailRow';
import { StatusBadge } from '../../components/StatusBadge';
import { usePermission } from '../../hooks/usePermission';
import { useRouteId } from '../../hooks/useRouteId';
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
  const id = useRouteId();
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
    queryFn: () => enquiryService.getById(id),
    enabled: Boolean(id),
  });

  const { data: quotations } = useQuery({
    queryKey: ['quotations', { enquiryId: id }],
    queryFn: () => quotationService.list({ page: 1, limit: 50, enquiryId: id }),
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

      {/* One page, grouped into as few cards as the content allows — the header above already
          carries customer, event date, appointment, assigned-to and the three money figures, so
          nothing here repeats it. */}
      <Box
        sx={{
          display: 'grid',
          gap: 2.5,
          alignItems: 'start',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.7fr) minmax(300px, 1fr)' },
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
                Customer &amp; Event
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
              <CardSection icon={<PersonOutlinedIcon fontSize="small" />} title="Contact" tone="primary">
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

              <CardSection icon={<CelebrationIcon fontSize="small" />} title="Event" tone="success">
                <DetailRow
                  icon={<ScheduleIcon sx={{ fontSize: 16 }} />}
                  label="Event Time"
                  value={enquiry.eventTime ? (enquiry.eventTime === 'MORNING' ? 'Morning' : 'Evening') : '—'}
                />
                <DetailRow icon={<MeetingRoomIcon sx={{ fontSize: 16 }} />} label="Mahal" value={enquiry.mahal || '—'} />
                <DetailRow icon={<PlaceIcon sx={{ fontSize: 16 }} />} label="Venue" value={enquiry.venue || '—'} />
              </CardSection>
            </Box>

            {/* Only once there is something to say beyond what the header's appointment badge and
                date already cover — an enquiry with no meeting notes yet shouldn't grow a section. */}
            {(enquiry.meetingLocation || enquiry.appointmentNotes) && (
              <>
                <Divider sx={{ my: 3 }} />
                <CardSection icon={<CalendarMonthIcon fontSize="small" />} title="Appointment Notes" tone="info">
                  {enquiry.meetingLocation && (
                    <DetailRow
                      icon={<PlaceIcon sx={{ fontSize: 16 }} />}
                      label="Meeting Location"
                      value={enquiry.meetingLocation}
                    />
                  )}
                  {enquiry.appointmentNotes && (
                    <DetailRow
                      icon={<NotesIcon sx={{ fontSize: 16 }} />}
                      label="Discussion"
                      value={
                        <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: 'pre-line' }}>
                          {enquiry.appointmentNotes}
                        </Typography>
                      }
                    />
                  )}
                </CardSection>
              </>
            )}
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
              Activity
            </Typography>
            <Stack spacing={1.75}>
              {/* Only once recorded — an enquiry-stage advance is optional, and an empty row would
                  imply money is owed. */}
              {enquiry.advanceAmount && (
                <DetailRow
                  icon={<PaidIcon sx={{ fontSize: 16 }} />}
                  label="Advance Paid"
                  value={formatCurrency(enquiry.advanceAmount)}
                />
              )}
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

          {enquiry.notes && (
            <Paper variant="outlined" sx={CARD_SX}>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 2 }}>
                <NotesIcon fontSize="small" sx={{ color: 'primary.main' }} />
                <Typography variant="h4" component="h2">
                  Notes
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                {enquiry.notes}
              </Typography>
            </Paper>
          )}
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

      {/* flow.md §2.3: raised in place — saving keeps the user on the enquiry, whose Quotation table
          is refreshed by the dialog's own invalidation. */}
      <EnquiryQuotationDialog
        open={quotationDialogOpen}
        enquiry={{
          id: enquiry.id,
          enquiryNumber: enquiry.enquiryNumber,
          customerName: enquiry.customer.customerName,
          mobile: enquiry.customer.mobile,
          whatsapp: enquiry.prospect?.whatsapp ?? enquiry.customer.mobile,
          email: enquiry.prospect?.email ?? null,
          address: enquiry.prospect?.address ?? null,
        }}
        onClose={() => setQuotationDialogOpen(false)}
        onSaved={() => setQuotationDialogOpen(false)}
      />
    </Box>
  );
}
