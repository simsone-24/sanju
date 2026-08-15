import CallIcon from '@mui/icons-material/Call';
import EditIcon from '@mui/icons-material/Edit';
import EmailIcon from '@mui/icons-material/Email';
import EventIcon from '@mui/icons-material/Event';
import HomeIcon from '@mui/icons-material/Home';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import PaidIcon from '@mui/icons-material/Paid';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { Avatar, Box, Button, Chip, Paper, Skeleton, Stack, Typography } from '@mui/material';
import { InfoLine } from '../../components/InfoCard';
import type { CustomerDetail } from '../../types/customer';
import { avatarHue, avatarInitials } from '../../utils/avatar';
import { formatCurrency, formatDate } from '../../utils/format';

interface EnquiryCustomerDetailsCardProps {
  customerName: string;
  mobile: string;
  /** From the picker/list payload — used until the full record arrives. */
  customerCode?: string;
  /** Full record. Undefined while it loads, or when the role cannot read the customer master. */
  customer?: CustomerDetail;
  isLoading: boolean;
  canViewCustomers: boolean;
  /** Edit mode: a saved enquiry's linked customer cannot be swapped. */
  locked?: boolean;
  /** Present only when the actor holds Customers > Edit and the full record has loaded. Opens the
   *  customer master for editing without leaving the enquiry. */
  onEdit?: () => void;
}

// enquiry.md §Step 1 "Existing Customer": once a customer is picked (create) or already linked
// (edit), their master record is shown here so staff can confirm they picked the right person —
// and see the contact details and history they would otherwise have to leave the form to look up.
// The fields themselves are never part of the enquiry payload (duplicating them would break "never
// duplicate customer information"); Edit opens the customer master record itself via onEdit.
export function EnquiryCustomerDetailsCard({
  customerName,
  mobile,
  customerCode,
  customer,
  isLoading,
  canViewCustomers,
  locked = false,
  onEdit,
}: EnquiryCustomerDetailsCardProps) {
  const hue = avatarHue(customerName || mobile);
  const code = customer?.customerCode || customerCode;

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '16px', gridColumn: '1 / -1' }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1, mb: 2.5 }}>
        <Avatar
          sx={{
            width: 40,
            height: 40,
            fontSize: '0.85rem',
            fontWeight: 700,
            color: hue,
            bgcolor: `color-mix(in srgb, ${hue} 16%, transparent)`,
          }}
        >
          {avatarInitials(customerName)}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {customerName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {locked
              ? 'Customer cannot be swapped after the enquiry is created.'
              : 'Details come from the customer master.'}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ ml: { sm: 'auto' }, flexWrap: 'wrap', rowGap: 1, alignItems: 'center' }}>
          {code && <Chip size="small" variant="outlined" label={code} />}
          {customer && <Chip size="small" variant="outlined" label={customer.status === 'ACTIVE' ? 'Active' : 'Inactive'} />}
          {locked && <Chip size="small" variant="outlined" label="Linked customer" />}
          {onEdit && (
            <Button size="small" variant="outlined" startIcon={<EditIcon fontSize="small" />} onClick={onEdit}>
              Edit
            </Button>
          )}
        </Stack>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
        }}
      >
        <InfoLine icon={<CallIcon sx={{ fontSize: 16 }} />} label="Mobile" value={customer?.mobile || mobile || '—'} />
        <InfoLine
          icon={<WhatsAppIcon sx={{ fontSize: 16 }} />}
          label="WhatsApp"
          value={isLoading ? <Skeleton width={110} /> : customer?.whatsapp || '—'}
        />
        <InfoLine
          icon={<EmailIcon sx={{ fontSize: 16 }} />}
          label="Email"
          value={isLoading ? <Skeleton width={140} /> : customer?.email || '—'}
        />
        <InfoLine
          icon={<LocationCityIcon sx={{ fontSize: 16 }} />}
          label="City"
          value={isLoading ? <Skeleton width={90} /> : customer?.city || '—'}
        />
        <InfoLine
          icon={<HomeIcon sx={{ fontSize: 16 }} />}
          label="Address"
          value={isLoading ? <Skeleton width={160} /> : customer?.address || '—'}
        />
        <InfoLine
          icon={<EventIcon sx={{ fontSize: 16 }} />}
          label="Last Event"
          value={isLoading ? <Skeleton width={100} /> : customer?.lastEvent ? formatDate(customer.lastEvent) : '—'}
        />
      </Box>

      {customer && (
        <Stack direction="row" spacing={1} sx={{ mt: 2.5, flexWrap: 'wrap', rowGap: 1 }}>
          <Chip size="small" variant="outlined" icon={<EventIcon />} label={`${customer.totalEvents} past events`} />
          <Chip
            size="small"
            variant="outlined"
            color={Number(customer.outstandingAmount) > 0 ? 'warning' : 'default'}
            icon={<PaidIcon />}
            label={`Outstanding ${formatCurrency(customer.outstandingAmount)}`}
          />
        </Stack>
      )}

      {!canViewCustomers && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          Your role cannot open customer records, so only the name and mobile number are shown.
        </Typography>
      )}
    </Paper>
  );
}
