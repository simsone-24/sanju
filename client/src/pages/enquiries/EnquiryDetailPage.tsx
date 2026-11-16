import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CelebrationIcon from '@mui/icons-material/Celebration';
import EmailIcon from '@mui/icons-material/Email';
import BadgeIcon from '@mui/icons-material/Badge';
import FlagIcon from '@mui/icons-material/Flag';
import HistoryIcon from '@mui/icons-material/History';
import HomeIcon from '@mui/icons-material/Home';
import LaunchIcon from '@mui/icons-material/Launch';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import NotesIcon from '@mui/icons-material/Notes';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import PaidIcon from '@mui/icons-material/Paid';
import PlaceIcon from '@mui/icons-material/Place';
import SpaceDashboardOutlinedIcon from '@mui/icons-material/SpaceDashboardOutlined';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import ScheduleIcon from '@mui/icons-material/Schedule';
import UpdateIcon from '@mui/icons-material/Update';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import {
  Box,
  Button,
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
import { AppTabs } from '../../components/AppTabs';
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
import { QuotationPreviewDialog } from '../quotations/QuotationPreviewDialog';
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

function digitsOnly(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '');
}

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
  // "md files/Enquiry/flow.md" §2.3: quotations are worked on in a modal rather than by navigating
  // away. `null` is closed; `{ quotationId: null }` composes a new one, an id edits that one — the
  // same dialog either way, so the Quotation module's form page is never reached from here.
  const [quotationDialog, setQuotationDialog] = useState<{ quotationId: number | null } | null>(null);
  // Read-only popup for the View action and for clicking a quotation row.
  const [previewQuotationId, setPreviewQuotationId] = useState<number | null>(null);
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
        <EnquiryQuotationActions
          row={row}
          onView={setPreviewQuotationId}
          onEdit={(quotationId) => setQuotationDialog({ quotationId })}
        />
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
        direction={{ xs: 'column', sm: 'row' }}
        spacing={{ xs: 1, sm: 2 }}
        sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', flexWrap: 'wrap', rowGap: 1 }}
      >
        <Breadcrumbs
          items={[
            { label: 'Dashboard', to: '/' },
            { label: 'Enquiries', to: '/enquiries' },
            { label: enquiry.enquiryNumber },
          ]}
        />
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: { xs: 0.5, sm: 1.25 }, marginLeft: 'auto' }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/enquiries')}
          >
            Back
          </Button>
          <Button
            size="small"
            variant="outlined"
            endIcon={<MoreVertIcon />}
            aria-haspopup="menu"
            aria-expanded={actionsAnchor ? 'true' : undefined}
            onClick={(event) => setActionsAnchor(event.currentTarget)}
          >
            Actions
          </Button>
        </Stack>
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
        onCreateQuotation={() => setQuotationDialog({ quotationId: null })}
        onCall={handleCall}
        onWhatsApp={handleWhatsApp}
      />

      <EnquiryProgressTracker status={enquiry.status} />

      {/* The header carries only what identifies the record; everything else sits in these tabs, each
          fact once. */}
      <AppTabs
        surface
        idPrefix="enquiry-detail"
        tabs={[
          {
            label: 'Overview',
            icon: <SpaceDashboardOutlinedIcon fontSize="small" />,
            content: (
              <Paper variant="outlined" sx={{ borderRadius: '20px', p: { xs: 2.5, sm: 3.5 } }}>
                <Box
                  sx={{
                    display: 'grid',
                    gap: { xs: 3, md: 4 },
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
                  }}
                >
                  <CardSection icon={<CelebrationIcon fontSize="small" />} title="Event" tone="success">
                    <DetailRow
                      icon={<ScheduleIcon sx={{ fontSize: 16 }} />}
                      label={enquiry.eventDays.length > 1 ? 'Event Days' : 'Event Time'}
                      value={
                        enquiry.eventDays.length === 0 ? (
                          '—'
                        ) : (
                          <Box>
                            {enquiry.eventDays.map((day) => (
                              <Typography key={day.id} variant="body2" sx={{ fontWeight: 600 }}>
                                {enquiry.eventDays.length > 1 ? `${formatDate(day.eventDate)} · ` : ''}
                                {day.eventTime ? (day.eventTime === 'MORNING' ? 'Morning' : 'Evening') : '—'}
                              </Typography>
                            ))}
                          </Box>
                        )
                      }
                    />
                    <DetailRow icon={<MeetingRoomIcon sx={{ fontSize: 16 }} />} label="Mahal" value={enquiry.mahal || '—'} />
                    <DetailRow icon={<PlaceIcon sx={{ fontSize: 16 }} />} label="Venue" value={enquiry.venue || '—'} />
                    <DetailRow
                      icon={<PaidIcon sx={{ fontSize: 16 }} />}
                      label="Estimated Budget"
                      value={enquiry.estimatedBudget ? formatCurrency(enquiry.estimatedBudget) : '—'}
                    />
                  </CardSection>

                  <CardSection icon={<CalendarMonthIcon fontSize="small" />} title="Appointment" tone="info">
                    <DetailRow
                      icon={<FlagIcon sx={{ fontSize: 16 }} />}
                      label="Status"
                      value={<StatusBadge type="appointment" status={enquiry.appointmentStatus} size="sm" />}
                    />
                    <DetailRow
                      icon={<ScheduleIcon sx={{ fontSize: 16 }} />}
                      label="Date & Time"
                      value={
                        enquiry.appointmentDate
                          ? `${formatDate(enquiry.appointmentDate)}${enquiry.appointmentTime ? ` · ${enquiry.appointmentTime}` : ''}`
                          : 'Not scheduled'
                      }
                    />
                    {enquiry.meetingLocation && (
                      <DetailRow
                        icon={<PlaceIcon sx={{ fontSize: 16 }} />}
                        label="Location"
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

                  <CardSection icon={<PersonOutlinedIcon fontSize="small" />} title="Contact" tone="primary">
                    {customerRecord ? (
                      <DetailRow
                        icon={<PersonOutlinedIcon sx={{ fontSize: 16 }} />}
                        label="Customer Code"
                        value={customerRecord.customerCode}
                      />
                    ) : (
                      !enquiry.customer.id && (
                        <DetailRow
                          icon={<PersonOutlinedIcon sx={{ fontSize: 16 }} />}
                          label="Customer"
                          value="Prospect — added on Order Confirmed"
                        />
                      )
                    )}
                    {/* The header already shows the mobile number, so WhatsApp only appears when it is a
                        different number. */}
                    {contact?.whatsapp && digitsOnly(contact.whatsapp) !== digitsOnly(enquiry.customer.mobile) && (
                      <DetailRow icon={<WhatsAppIcon sx={{ fontSize: 16 }} />} label="WhatsApp" value={contact.whatsapp} />
                    )}
                    <DetailRow icon={<EmailIcon sx={{ fontSize: 16 }} />} label="Email" value={contact?.email || '—'} />
                    <DetailRow icon={<LocationCityIcon sx={{ fontSize: 16 }} />} label="City" value={contact?.city || '—'} />
                    <DetailRow icon={<HomeIcon sx={{ fontSize: 16 }} />} label="Address" value={contact?.address || '—'} />
                  </CardSection>
                </Box>

                <Divider sx={{ my: { xs: 3, md: 4 } }} />

                <Box
                  sx={{
                    display: 'grid',
                    gap: { xs: 3, md: 4 },
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
                  }}
                >
                  <CardSection icon={<BadgeIcon fontSize="small" />} title="People" tone="primary">
                    <DetailRow
                      icon={<BadgeIcon sx={{ fontSize: 16 }} />}
                      label="Event Manager"
                      value={enquiry.eventManager?.fullName ?? 'Not set'}
                    />
                    <DetailRow
                      icon={<PersonOutlinedIcon sx={{ fontSize: 16 }} />}
                      label="Assigned To"
                      value={enquiry.assignedUser?.fullName ?? 'Unassigned'}
                    />
                  </CardSection>

                  <CardSection icon={<UpdateIcon fontSize="small" />} title="Follow-up" tone="warning">
                    <DetailRow
                      icon={<UpdateIcon sx={{ fontSize: 16 }} />}
                      label="Next Follow-up"
                      value={enquiry.followUpDate ? formatDate(enquiry.followUpDate) : 'None due'}
                    />
                    <DetailRow
                      icon={<HistoryIcon sx={{ fontSize: 16 }} />}
                      label="Raised"
                      value={formatDateTime(enquiry.createdAt)}
                    />
                    <DetailRow
                      icon={<HistoryIcon sx={{ fontSize: 16 }} />}
                      label="Last Updated"
                      value={formatDateTime(enquiry.updatedAt)}
                    />
                  </CardSection>

                  {enquiry.notes && (
                    <CardSection icon={<NotesIcon fontSize="small" />} title="Notes" tone="info">
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                        {enquiry.notes}
                      </Typography>
                    </CardSection>
                  )}
                </Box>
              </Paper>
            ),
          },
          {
            label: `Quotations (${quotations?.records.length ?? 0})`,
            icon: <RequestQuoteIcon fontSize="small" />,
            content: (
              <Paper variant="outlined" sx={{ borderRadius: '20px', p: { xs: 2.5, sm: 3.5 } }}>
                {showCreateQuotation && (
                  <Stack direction="row" sx={{ justifyContent: 'flex-end', mb: 2 }}>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<RequestQuoteIcon />}
                      onClick={() => setQuotationDialog({ quotationId: null })}
                    >
                      Create Quotation
                    </Button>
                  </Stack>
                )}
                <DataTable
                  disableContainer
                  columns={quotationColumns}
                  rows={quotations?.records ?? []}
                  getRowId={(row) => row.id}
                  page={1}
                  limit={50}
                  onPageChange={() => undefined}
                  onLimitChange={() => undefined}
                  onRowClick={(row) => setPreviewQuotationId(row.id)}
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
            ),
          },
          {
            label: 'Timeline',
            icon: <HistoryIcon fontSize="small" />,
            content: <EnquiryTimelineCard enquiryId={enquiry.id} />,
          },
        ]}
      />

      <EnquiryStatusDialog
        open={statusDialogOpen}
        enquiryId={enquiry.id}
        currentStatus={enquiry.status}
        onClose={() => setStatusDialogOpen(false)}
      />

      {/* flow.md §2.3: raised and edited in place — saving keeps the user on the enquiry, whose
          Quotation table is refreshed by the dialog's own invalidation. */}
      <EnquiryQuotationDialog
        open={quotationDialog !== null}
        quotationId={quotationDialog?.quotationId ?? null}
        enquiry={{
          id: enquiry.id,
          enquiryNumber: enquiry.enquiryNumber,
          customerName: enquiry.customer.customerName,
          mobile: enquiry.customer.mobile,
          whatsapp: enquiry.prospect?.whatsapp ?? enquiry.customer.mobile,
          email: enquiry.prospect?.email ?? null,
          address: enquiry.prospect?.address ?? null,
          eventDate: enquiry.eventDate,
          advanceAmount: enquiry.advanceAmount,
        }}
        onClose={() => setQuotationDialog(null)}
        onSaved={() => setQuotationDialog(null)}
      />

      {/* The View action and a row click open the document read-only here rather than sending the
          user to the Quotation module — the same preview the Quotations index page uses. */}
      <QuotationPreviewDialog quotationId={previewQuotationId} onClose={() => setPreviewQuotationId(null)} />
    </Box>
  );
}
