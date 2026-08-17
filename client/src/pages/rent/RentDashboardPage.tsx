import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { usePermission } from '../../hooks/usePermission';
import * as rentService from '../../services/rentService';
import type { StockOutSummary } from '../../types/rent';
import { formatCurrency, formatDate } from '../../utils/format';

/** Rent dashboard — "md files/Stock/stock.md" §26. */
export default function RentDashboardPage() {
  const navigate = useNavigate();
  const canView = usePermission('RENT', 'canView');
  const canCreate = usePermission('RENT', 'canCreate');

  const { data, isLoading } = useQuery({
    queryKey: ['rent-dashboard'],
    queryFn: () => rentService.getDashboard(),
    enabled: canView,
  });

  if (!canView) {
    return <Typography color="text.secondary">You do not have access to the Rent module.</Typography>;
  }

  const returns = data?.returns;
  const payments = data?.payments;

  return (
    <Box>
      <PageHeader
        title="Rent"
        subtitle="Stock issued to rental persons, what has come back, and what is still owed"
        breadcrumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Rent' }]}
        actions={
          canCreate && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/rent/stock-outs/new')}>
              New Stock Out
            </Button>
          )
        }
      />

      <Typography variant="h4" sx={{ mb: 1.5 }}>
        Returns
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' },
          mb: 3,
        }}
      >
        <StatCard
          size="md"
          label="Total Stock Out"
          value={returns?.totalStockOuts ?? 0}
          icon={<Inventory2OutlinedIcon />}
          tone="blue"
          subtext={`${returns?.totalIssuedQuantity ?? 0} items issued`}
          loading={isLoading}
          onClick={() => navigate('/rent/stock-outs')}
        />
        <StatCard
          size="md"
          label="Not Returned"
          value={returns?.notReturned ?? 0}
          icon={<PendingActionsIcon />}
          tone="red"
          loading={isLoading}
          onClick={() => navigate('/rent/stock-outs?returnStatus=NOT_RETURNED')}
        />
        <StatCard
          size="md"
          label="Partial Returned"
          value={returns?.partialReturned ?? 0}
          icon={<HourglassBottomIcon />}
          tone="amber"
          subtext={`${returns?.totalPendingQuantity ?? 0} items still out`}
          loading={isLoading}
          onClick={() => navigate('/rent/stock-outs?returnStatus=PARTIAL_RETURNED')}
        />
        <StatCard
          size="md"
          label="Returned"
          value={returns?.returned ?? 0}
          icon={<CheckCircleOutlineIcon />}
          tone="green"
          loading={isLoading}
          onClick={() => navigate('/rent/stock-outs?returnStatus=RETURNED')}
        />
      </Box>

      <Typography variant="h4" sx={{ mb: 1.5 }}>
        Payments
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
          mb: 3,
        }}
      >
        <StatCard
          size="md"
          label="Total Rental Amount"
          value={formatCurrency(payments?.totalRentalAmount ?? 0)}
          icon={<ReceiptLongIcon />}
          tone="blue"
          loading={isLoading}
          onClick={() => navigate('/rent/payments')}
        />
        <StatCard
          size="md"
          label="Total Received"
          value={formatCurrency(payments?.totalReceived ?? 0)}
          icon={<PaidOutlinedIcon />}
          tone="green"
          subtext={`${payments?.paidCount ?? 0} settled`}
          loading={isLoading}
          onClick={() => navigate('/rent/stock-outs?paymentStatus=PAID')}
        />
        <StatCard
          size="md"
          label="Total Pending"
          value={formatCurrency(payments?.totalPending ?? 0)}
          icon={<AccountBalanceWalletIcon />}
          tone="amber"
          subtext={`${(payments?.unpaidCount ?? 0) + (payments?.partiallyPaidCount ?? 0)} unsettled`}
          loading={isLoading}
          onClick={() => navigate('/rent/stock-outs?paymentStatus=UNPAID')}
        />
      </Box>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' } }}>
        <PanelCard
          title="Pending Returns"
          emptyMessage="Everything issued has come back."
          rows={data?.pendingReturns ?? []}
          loading={isLoading}
          onSeeAll={() => navigate('/rent/returns')}
          onRowClick={(row) => navigate(`/rent/stock-outs/${row.id}`)}
          renderRight={(row) => (
            <Stack sx={{ alignItems: 'flex-end' }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'warning.main' }}>
                {row.pendingQuantity} pending
              </Typography>
              <StatusBadge type="rentReturn" status={row.returnStatus} size="sm" />
            </Stack>
          )}
          renderSubtitle={(row) =>
            row.expectedReturnDate ? `Due ${formatDate(row.expectedReturnDate)}` : 'No return date set'
          }
        />

        <PanelCard
          title="Pending Payments"
          emptyMessage="Every transaction is settled."
          rows={data?.pendingPayments ?? []}
          loading={isLoading}
          onSeeAll={() => navigate('/rent/payments')}
          onRowClick={(row) => navigate(`/rent/stock-outs/${row.id}`)}
          renderRight={(row) => (
            <Stack sx={{ alignItems: 'flex-end' }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.main' }}>
                {formatCurrency(row.balanceAmount)}
              </Typography>
              <StatusBadge type="rentPayment" status={row.paymentStatus} size="sm" />
            </Stack>
          )}
          renderSubtitle={(row) => `${formatCurrency(row.paidAmount)} of ${formatCurrency(row.grandTotal)} paid`}
        />

        <Box sx={{ gridColumn: { xs: 'auto', lg: '1 / -1' } }}>
          <PanelCard
            title="Recent Stock Out"
            emptyMessage="No stock has gone out yet."
            rows={data?.recentStockOuts ?? []}
            loading={isLoading}
            onSeeAll={() => navigate('/rent/stock-outs')}
            onRowClick={(row) => navigate(`/rent/stock-outs/${row.id}`)}
            renderRight={(row) => (
              <Stack sx={{ alignItems: 'flex-end' }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {formatCurrency(row.grandTotal)}
                </Typography>
                <StatusBadge type="rentReturn" status={row.returnStatus} size="sm" />
              </Stack>
            )}
            renderSubtitle={(row) => `${formatDate(row.stockOutDate)} · ${row.issuedQuantity} item(s)`}
          />
        </Box>
      </Box>
    </Box>
  );
}

interface PanelCardProps {
  title: string;
  rows: StockOutSummary[];
  loading: boolean;
  emptyMessage: string;
  onSeeAll: () => void;
  onRowClick: (row: StockOutSummary) => void;
  renderRight: (row: StockOutSummary) => React.ReactNode;
  renderSubtitle: (row: StockOutSummary) => string;
}

// A short prompt-to-act list, not a table: each row names the transaction and the person, states the
// one figure the panel is about, and links through to the full record.
function PanelCard({
  title,
  rows,
  loading,
  emptyMessage,
  onSeeAll,
  onRowClick,
  renderRight,
  renderSubtitle,
}: PanelCardProps) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: '16px', p: 2.5 }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="h4">{title}</Typography>
        <Button size="small" onClick={onSeeAll}>
          See all
        </Button>
      </Stack>

      {loading ? (
        <Typography variant="body2" color="text.secondary">
          Loading…
        </Typography>
      ) : rows.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {emptyMessage}
        </Typography>
      ) : (
        <Stack divider={<Box sx={{ borderTop: '1px solid', borderColor: 'divider' }} />}>
          {rows.map((row) => (
            <Stack
              key={row.id}
              direction="row"
              onClick={() => onRowClick(row)}
              sx={{
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 2,
                py: 1.25,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                  {row.rentNo} · {row.rentalPerson.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {renderSubtitle(row)}
                </Typography>
              </Box>
              {renderRight(row)}
            </Stack>
          ))}
        </Stack>
      )}
    </Paper>
  );
}
