import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import BadgeIcon from '@mui/icons-material/Badge';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CallIcon from '@mui/icons-material/Call';
import CelebrationIcon from '@mui/icons-material/Celebration';
import ContactSupportOutlinedIcon from '@mui/icons-material/ContactSupportOutlined';
import EditIcon from '@mui/icons-material/Edit';
import EventIcon from '@mui/icons-material/Event';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { Button, ListItemIcon, ListItemText, Menu, MenuItem, Stack } from '@mui/material';
import { useState } from 'react';
import { RecordHeaderCard } from '../../components/RecordHeaderCard';
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

/**
 * Enquiry Details header — the shared RecordHeaderCard filled in for an enquiry, so this page and
 * Order Details open the same way.
 *
 * Both status badges sit beside the number: an enquiry's own stage and its appointment's state are
 * independent, and either can be the reason someone opened the record.
 */
export function EnquirySummaryCard({
  enquiry,
  canEdit,
  showCreateQuotation,
  onEdit,
  onCreateQuotation,
  onCall,
  onWhatsApp,
}: EnquirySummaryCardProps) {
  const [contactAnchor, setContactAnchor] = useState<HTMLElement | null>(null);

  function runAndClose(action: () => void) {
    setContactAnchor(null);
    action();
  }

  const appointment = enquiry.appointmentDate
    ? `${formatDate(enquiry.appointmentDate)}${enquiry.appointmentTime ? ` · ${enquiry.appointmentTime}` : ''}`
    : 'Not scheduled';

  return (
    <RecordHeaderCard
      icon={<ContactSupportOutlinedIcon />}
      eyebrow="Enquiry"
      title={enquiry.enquiryNumber}
      badge={
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 0.5 }}>
          <StatusBadge type="enquiry" status={enquiry.status} />
          <StatusBadge type="appointment" status={enquiry.appointmentStatus} />
        </Stack>
      }
      actions={
        <>
          {canEdit && (
            <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={onEdit}>
              Edit Enquiry
            </Button>
          )}
          <Button
            size="small"
            variant="outlined"
            startIcon={<CallIcon />}
            endIcon={<ArrowDropDownIcon />}
            aria-haspopup="menu"
            aria-expanded={contactAnchor ? 'true' : undefined}
            onClick={(event) => setContactAnchor(event.currentTarget)}
          >
            Contact
          </Button>
          <Menu anchorEl={contactAnchor} open={Boolean(contactAnchor)} onClose={() => setContactAnchor(null)}>
            <MenuItem onClick={() => runAndClose(onCall)}>
              <ListItemIcon>
                <CallIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Call" secondary="Dials the customer" />
            </MenuItem>
            <MenuItem onClick={() => runAndClose(onWhatsApp)}>
              <ListItemIcon>
                <WhatsAppIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="WhatsApp" secondary="Opens a message about this enquiry" />
            </MenuItem>
          </Menu>
          {showCreateQuotation && (
            <Button size="small" variant="contained" startIcon={<RequestQuoteIcon />} onClick={onCreateQuotation}>
              Create Quotation
            </Button>
          )}
        </>
      }
      facts={[
        {
          icon: <PersonOutlinedIcon sx={{ fontSize: 16 }} />,
          label: 'Customer',
          value: enquiry.customer.customerName,
        },
        { icon: <CallIcon sx={{ fontSize: 16 }} />, label: 'Mobile', value: enquiry.customer.mobile || '—' },
        {
          icon: <CelebrationIcon sx={{ fontSize: 16 }} />,
          label: 'Event Type',
          value: enquiry.eventType.eventName,
        },
        { icon: <EventIcon sx={{ fontSize: 16 }} />, label: 'Event Date', value: formatDate(enquiry.eventDate) },
        { icon: <CalendarMonthIcon sx={{ fontSize: 16 }} />, label: 'Appointment', value: appointment },
        {
          icon: <BadgeIcon sx={{ fontSize: 16 }} />,
          label: 'Assigned To',
          value: enquiry.assignedUser?.fullName ?? 'Unassigned',
        },
      ]}
      figures={[
        {
          label: 'Final Budget',
          value: enquiry.finalBudgetAmount ? formatCurrency(enquiry.finalBudgetAmount) : 'Not finalised',
        },
        {
          label: 'Estimated Budget',
          value: enquiry.estimatedBudget ? formatCurrency(enquiry.estimatedBudget) : '—',
        },
        {
          label: 'Quotation',
          value: enquiry.quotationAmount
            ? `${formatCurrency(enquiry.quotationAmount)}${enquiry.quotationVersion ? ` (v${enquiry.quotationVersion})` : ''}`
            : 'Not quoted',
        },
      ]}
    />
  );
}
