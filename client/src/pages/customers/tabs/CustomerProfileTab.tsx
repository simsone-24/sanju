import { Paper, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { StatusBadge } from '../../../components/StatusBadge';
import type { CustomerDetail } from '../../../types/customer';
import { formatCurrency, formatDate } from '../../../utils/format';

interface CustomerProfileTabProps {
  customer: CustomerDetail;
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Stack>
  );
}

export default function CustomerProfileTab({ customer }: CustomerProfileTabProps) {
  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
        <Paper variant="outlined" sx={{ p: 2, minWidth: 160 }}>
          <Typography variant="body2" color="text.secondary">
            Total Events
          </Typography>
          <Typography variant="h2">{customer.totalEvents}</Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2, minWidth: 160 }}>
          <Typography variant="body2" color="text.secondary">
            Last Event
          </Typography>
          <Typography variant="h2">{customer.lastEvent ? formatDate(customer.lastEvent) : '—'}</Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2, minWidth: 160 }}>
          <Typography variant="body2" color="text.secondary">
            Outstanding Amount
          </Typography>
          <Typography variant="h2">{formatCurrency(customer.outstandingAmount)}</Typography>
        </Paper>
      </Stack>

      <Paper variant="outlined" sx={{ p: 3, maxWidth: 560 }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="h2">Basic Information</Typography>
          <StatusBadge type="active" status={customer.status} />
        </Stack>
        <Stack spacing={1.5}>
          <Row label="Customer Code" value={customer.customerCode} />
          <Row label="Mobile" value={customer.mobile} />
          <Row label="WhatsApp" value={customer.whatsapp ?? '—'} />
          <Row label="Email" value={customer.email ?? '—'} />
          <Row label="City" value={customer.city ?? '—'} />
          <Row label="Address" value={customer.address ?? '—'} />
          <Row label="Customer Since" value={formatDate(customer.createdAt)} />
          {customer.remarks && (
            <Stack>
              <Typography variant="body2" color="text.secondary">
                Remarks
              </Typography>
              <Typography variant="body2">{customer.remarks}</Typography>
            </Stack>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}
