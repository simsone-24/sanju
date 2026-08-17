import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PrintIcon from '@mui/icons-material/Print';
import {
  Alert,
  Box,
  Button,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { useAuth } from '../../hooks/useAuth';
import { usePermission } from '../../hooks/usePermission';
import * as rentService from '../../services/rentService';
import { formatDate, getPublicAssetUrl } from '../../utils/format';

// Plain thousands-separated numbers inside the money table — the currency is stated once in the
// column header, so repeating the symbol on every row only adds noise to a printed sheet. Same
// treatment the invoice sheet uses.
function num(value: number): string {
  return value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const RETURN_STATUS_LABEL: Record<string, string> = {
  NOT_RETURNED: 'Not Returned',
  PARTIAL_RETURNED: 'Partial Returned',
  RETURNED: 'Returned',
};

/**
 * The printable stock out document — stock.md §12's "Print / Download PDF" action.
 *
 * Rendered as a sheet in the browser and handed to the print dialog, from which the user can print
 * or save as PDF. It reuses the invoice sheet's print classes (index.css @media print) rather than
 * carrying its own stylesheet, so both documents obey one set of page rules.
 */
export default function StockOutPrintPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canPrint = usePermission('RENT', 'canPrint');

  const { data: stockOut, isLoading } = useQuery({
    queryKey: ['rent-stock-out', id],
    queryFn: () => rentService.getStockOut(id!),
    enabled: canPrint && Boolean(id),
  });

  if (!canPrint) {
    return <Typography color="text.secondary">You do not have permission to print stock outs.</Typography>;
  }
  if (isLoading) return <Typography color="text.secondary">Preparing document…</Typography>;
  if (!stockOut) return <Alert severity="error">Stock out not found.</Alert>;

  const company = user?.company;

  return (
    <Box>
      <Box className="invoice-no-print">
        <PageHeader
          title={`Stock Out · ${stockOut.rentNo}`}
          subtitle={`${stockOut.rentalPerson.name} · ${formatDate(stockOut.stockOutDate)}`}
          breadcrumbs={[
            { label: 'Dashboard', to: '/' },
            { label: 'Rent', to: '/rent' },
            { label: 'Stock Out', to: '/rent/stock-outs' },
            { label: stockOut.rentNo, to: `/rent/stock-outs/${stockOut.id}` },
            { label: 'Print' },
          ]}
          actions={
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate(`/rent/stock-outs/${stockOut.id}`)}
              >
                Back
              </Button>
              <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()}>
                Print / Save as PDF
              </Button>
            </Stack>
          }
        />
      </Box>

      <Paper
        variant="outlined"
        className="invoice-print-area"
        sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: '12px', maxWidth: 900, mx: 'auto' }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', rowGap: 2 }}
        >
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            {company?.logo && (
              <Box
                component="img"
                src={getPublicAssetUrl(company.logo)}
                alt={`${company.companyName} logo`}
                sx={{ width: 56, height: 56, objectFit: 'contain' }}
              />
            )}
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                {company?.companyName ?? ''}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Rental Stock Out
              </Typography>
            </Box>
          </Stack>

          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h3" sx={{ fontWeight: 700 }}>
              {stockOut.rentNo}
            </Typography>
            <Typography variant="body2">Date: {formatDate(stockOut.stockOutDate)}</Typography>
            {stockOut.expectedReturnDate && (
              <Typography variant="body2">
                Expected Return: {formatDate(stockOut.expectedReturnDate)}
              </Typography>
            )}
            <Typography variant="body2">
              Return Status: {RETURN_STATUS_LABEL[stockOut.returnStatus] ?? stockOut.returnStatus}
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
            Issued To
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 700 }}>
            {stockOut.rentalPerson.name}
          </Typography>
          <Typography variant="body2">{stockOut.rentalPerson.phone}</Typography>
          {stockOut.rentalPerson.city && <Typography variant="body2">{stockOut.rentalPerson.city}</Typography>}
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow className="invoice-band">
                <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Qty
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Rate (₹)
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Amount (₹)
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Returned
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Balance
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stockOut.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.itemName}</TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">{num(item.rate)}</TableCell>
                  <TableCell align="right">{num(item.amount)}</TableCell>
                  <TableCell align="right">{item.returnedQuantity}</TableCell>
                  <TableCell align="right">{item.balanceQuantity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Stack sx={{ mt: 3, alignItems: 'flex-end' }}>
          <Box sx={{ minWidth: 300 }}>
            <TotalRow label="Subtotal" value={num(stockOut.subtotal)} />
            <TotalRow
              label={stockOut.discountPercent > 0 ? `Discount (${stockOut.discountPercent}%)` : 'Discount'}
              value={`− ${num(stockOut.discount)}`}
            />
            <TotalRow label="Additional Charges" value={`+ ${num(stockOut.additionalCharges)}`} />
            <Divider sx={{ my: 1 }} />
            <TotalRow label="Grand Total (₹)" value={num(stockOut.grandTotal)} strong />
            <TotalRow label="Paid" value={num(stockOut.paidAmount)} />
            <TotalRow label="Balance" value={num(stockOut.balanceAmount)} strong />
          </Box>
        </Stack>

        {stockOut.returns.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h4" sx={{ mb: 1 }}>
              Return History
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow className="invoice-band">
                    <TableCell sx={{ fontWeight: 700 }}>Return No</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      Items Returned
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stockOut.returns.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.returnNo}</TableCell>
                      <TableCell>{formatDate(entry.returnDate)}</TableCell>
                      <TableCell align="right">{entry.totalReturned}</TableCell>
                      <TableCell>{entry.notes ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {stockOut.notes && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
              Notes
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {stockOut.notes}
            </Typography>
          </Box>
        )}

        <Stack direction="row" sx={{ mt: 6, justifyContent: 'space-between' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Divider sx={{ width: 180, mb: 0.5 }} />
            <Typography variant="caption">Received By</Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Divider sx={{ width: 180, mb: 0.5 }} />
            <Typography variant="caption">Authorized Signatory</Typography>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}

function TotalRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between', py: 0.4 }}>
      <Typography variant="body2" sx={{ fontWeight: strong ? 700 : 400 }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{ fontWeight: strong ? 700 : 400, fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </Typography>
    </Stack>
  );
}
