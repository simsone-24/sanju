import { useRouteId } from '../../hooks/useRouteId';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { PageHeader } from '../../components/PageHeader';
import * as invoiceService from '../../services/invoiceService';
import { useToast } from '../../store/ToastContext';
import type { Invoice } from '../../types/invoice';
import { formatCurrency, formatDate, getPublicAssetUrl } from '../../utils/format';

// wa.me link with the message pre-composed — mirrors quotationActions.ts's buildQuotationWhatsAppLink.
// The invoice has no separate WhatsApp number of its own, so the customer's mobile is used directly.
function buildInvoiceWhatsAppLink(invoice: Invoice): string | null {
  const number = invoice.customer.mobile.replace(/\D/g, '');
  if (!number) return null;
  const message =
    `Hello ${invoice.customer.customerName}, thank you for contacting us. Please find your invoice ` +
    `${invoice.invoiceNumber} for order ${invoice.order.orderNumber}. Balance due: ${formatCurrency(invoice.balanceDue)}. Regards.`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

// Plain thousands-separated numbers inside the money table — the currency symbol is stated once in
// the column header, so repeating it on every row only adds noise to a printed document.
function num(value: number): string {
  return value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function TotalRow({ label, value, strong, accent }: { label: string; value: string; strong?: boolean; accent?: boolean }) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between', py: 0.4 }}>
      <Typography variant="body2" sx={{ fontWeight: strong ? 700 : 400, color: accent ? 'inherit' : 'text.secondary' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: strong ? 700 : 600, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </Typography>
    </Stack>
  );
}

function LabelledBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        variant="caption"
        sx={{ display: 'block', fontWeight: 700, letterSpacing: 0.6, color: 'text.secondary', mb: 0.5 }}
      >
        {label}
      </Typography>
      {children}
    </Box>
  );
}

function InvoiceSheet({ invoice }: { invoice: Invoice }) {
  const { company, order, customer } = invoice;
  const bankRows = [
    ['Bank Name', company.bankName],
    ['Account Name', company.bankAccountName],
    ['Account Number', company.bankAccountNumber],
    ['Branch', company.bankBranch],
    ['IFSC', company.bankIfsc],
    ['UPI', company.bankUpi],
  ].filter((row): row is [string, string] => Boolean(row[1]));

  return (
    <Paper
      variant="outlined"
      className="invoice-print-area"
      sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: '12px', maxWidth: 900, mx: 'auto', backgroundColor: 'background.paper' }}
    >
      {/* ---- Letterhead: logo + company, invoice meta ---- */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start', minWidth: 0 }}>
          {company.logo && (
            <Box
              component="img"
              src={getPublicAssetUrl(company.logo)}
              alt={`${company.companyName} logo`}
              sx={{ width: 88, height: 88, objectFit: 'contain', flexShrink: 0 }}
            />
          )}
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h3" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {company.companyName}
            </Typography>
            {company.address && (
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', mt: 0.5 }}>
                {company.address}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary">
              {[company.mobile, company.email, company.website].filter(Boolean).join('  ·  ')}
            </Typography>
            {company.gstNumber && (
              <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.25 }}>
                GSTIN: {company.gstNumber}
              </Typography>
            )}
          </Box>
        </Stack>

        <Box sx={{ textAlign: { xs: 'left', sm: 'right' }, flexShrink: 0 }}>
          <Typography variant="h2" sx={{ fontWeight: 800, letterSpacing: 1 }}>
            TAX INVOICE
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
            {invoice.invoiceNumber}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Dated {formatDate(invoice.invoiceDate)}
          </Typography>
        </Box>
      </Stack>

      <Box className="invoice-accent" sx={{ height: 4, borderRadius: 2, my: 3, backgroundColor: 'primary.main' }} />

      {/* ---- Bill To + event ---- */}
      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          mb: 3,
        }}
      >
        <LabelledBlock label="BILL TO">
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {customer.customerName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {customer.mobile}
          </Typography>
          {customer.email && (
            <Typography variant="body2" color="text.secondary">
              {customer.email}
            </Typography>
          )}
          {customer.address && (
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
              {customer.address}
            </Typography>
          )}
        </LabelledBlock>

        <LabelledBlock label="EVENT DETAILS">
          <Stack spacing={0.25}>
            <Typography variant="body2">
              <Box component="span" sx={{ color: 'text.secondary' }}>
                Order:{' '}
              </Box>
              <Box component="span" sx={{ fontWeight: 600 }}>
                {order.orderNumber}
              </Box>
            </Typography>
            {/* Omitted rather than left blank when the order was confirmed without a quotation —
                matches how the printed PDF drops the row (invoices/pdf.ts). */}
            {invoice.quotationNumber && (
              <Typography variant="body2">
                <Box component="span" sx={{ color: 'text.secondary' }}>
                  Quotation:{' '}
                </Box>
                <Box component="span" sx={{ fontWeight: 600 }}>
                  {invoice.quotationNumber}
                </Box>
              </Typography>
            )}
            {order.eventName && (
              <Typography variant="body2">
                <Box component="span" sx={{ color: 'text.secondary' }}>
                  Event:{' '}
                </Box>
                <Box component="span" sx={{ fontWeight: 600 }}>
                  {order.eventName}
                </Box>
              </Typography>
            )}
            {order.eventDate && (
              <Typography variant="body2">
                <Box component="span" sx={{ color: 'text.secondary' }}>
                  Event Date:{' '}
                </Box>
                <Box component="span" sx={{ fontWeight: 600 }}>
                  {formatDate(order.eventDate)}
                </Box>
              </Typography>
            )}
            {order.venue && (
              <Typography variant="body2">
                <Box component="span" sx={{ color: 'text.secondary' }}>
                  Venue:{' '}
                </Box>
                <Box component="span" sx={{ fontWeight: 600 }}>
                  {order.venue}
                </Box>
              </Typography>
            )}
          </Stack>
        </LabelledBlock>
      </Box>

      {/* ---- Line items ---- */}
      <Box sx={{ overflowX: 'auto' }}>
        <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <Box component="thead">
            <Box component="tr" className="invoice-band" sx={{ backgroundColor: 'action.hover' }}>
              {[
                { label: '#', align: 'left' as const, width: 36 },
                { label: 'Description', align: 'left' as const },
                { label: 'Qty', align: 'center' as const, width: 70 },
                { label: 'Rate (₹)', align: 'right' as const, width: 100 },
                { label: 'Amount (₹)', align: 'right' as const, width: 110 },
              ].map((column) => (
                <Box
                  key={column.label}
                  component="th"
                  sx={{
                    textAlign: column.align,
                    width: column.width,
                    p: 1,
                    fontWeight: 700,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {column.label}
                </Box>
              ))}
            </Box>
          </Box>
          <Box component="tbody">
            {invoice.items.length === 0 && (
              <Box component="tr">
                <Box
                  component="td"
                  colSpan={5}
                  sx={{ p: 2, textAlign: 'center', color: 'text.secondary', borderBottom: '1px solid', borderColor: 'divider' }}
                >
                  The approved quotation has no line items.
                </Box>
              </Box>
            )}
            {invoice.items.map((item, index) => (
              <Box component="tr" key={`${item.itemName}-${index}`}>
                <Box component="td" sx={{ p: 1, verticalAlign: 'top', borderBottom: '1px solid', borderColor: 'divider' }}>
                  {index + 1}
                </Box>
                <Box component="td" sx={{ p: 1, verticalAlign: 'top', borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {item.itemName}
                  </Typography>
                  {item.description && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {item.description}
                    </Typography>
                  )}
                </Box>
                <Box
                  component="td"
                  sx={{ p: 1, textAlign: 'center', verticalAlign: 'top', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}
                >
                  {num(item.quantity)}
                  {item.unit ? ` ${item.unit}` : ''}
                </Box>
                <Box
                  component="td"
                  sx={{ p: 1, textAlign: 'right', verticalAlign: 'top', borderBottom: '1px solid', borderColor: 'divider', fontVariantNumeric: 'tabular-nums' }}
                >
                  {num(item.rate)}
                </Box>
                <Box
                  component="td"
                  sx={{ p: 1, textAlign: 'right', verticalAlign: 'top', borderBottom: '1px solid', borderColor: 'divider', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}
                >
                  {num(item.amount)}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* ---- Bank block + totals ---- */}
      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', sm: '1fr 300px' },
          mt: 3,
        }}
      >
        <Box>
          {bankRows.length > 0 && (
            <LabelledBlock label="PAYMENT DETAILS">
              <Stack spacing={0.25}>
                {bankRows.map(([label, value]) => (
                  <Typography key={label} variant="body2">
                    <Box component="span" sx={{ color: 'text.secondary' }}>
                      {label}:{' '}
                    </Box>
                    <Box component="span" sx={{ fontWeight: 600 }}>
                      {value}
                    </Box>
                  </Typography>
                ))}
              </Stack>
            </LabelledBlock>
          )}
        </Box>

        <Box>
          <TotalRow label="Subtotal" value={num(invoice.subtotal)} />
          {invoice.discount > 0 && <TotalRow label="Discount" value={`- ${num(invoice.discount)}`} />}
          {invoice.cgstPercent > 0 && (
            <TotalRow
              label={`CGST ${invoice.cgstPercent}%`}
              value={num(Math.round(((invoice.subtotal - invoice.discount) * invoice.cgstPercent) / 100 * 100) / 100)}
            />
          )}
          {invoice.sgstPercent > 0 && (
            <TotalRow
              label={`SGST ${invoice.sgstPercent}%`}
              value={num(Math.round(((invoice.subtotal - invoice.discount) * invoice.sgstPercent) / 100 * 100) / 100)}
            />
          )}
          {/* Only when the budget was revised after the order was raised — otherwise the printed
              total would not equal the line items above it. */}
          {invoice.adjustment !== 0 && (
            <TotalRow
              label="Adjustment"
              value={`${invoice.adjustment > 0 ? '' : '- '}${num(Math.abs(invoice.adjustment))}`}
            />
          )}

          <Box sx={{ borderTop: '2px solid', borderColor: 'divider', mt: 1, pt: 1 }}>
            <TotalRow label="Total" value={`₹ ${num(invoice.totalAmount)}`} strong accent />
          </Box>
          <TotalRow label="Amount Paid" value={`- ${num(invoice.paidAmount)}`} />
          <Box
            className="invoice-band"
            sx={{ mt: 1, px: 1.5, py: 1, borderRadius: '8px', backgroundColor: 'action.hover' }}
          >
            <TotalRow label="Balance Due" value={`₹ ${num(invoice.balanceDue)}`} strong accent />
          </Box>
        </Box>
      </Box>

      {/* ---- Receipts already collected ---- */}
      {invoice.payments.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <LabelledBlock label="PAYMENTS RECEIVED">
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <Box component="tbody">
                {invoice.payments.map((payment) => (
                  <Box component="tr" key={payment.receiptNumber}>
                    <Box component="td" sx={{ py: 0.5, pr: 1, whiteSpace: 'nowrap', color: 'text.secondary' }}>
                      {formatDate(payment.paymentDate)}
                    </Box>
                    <Box component="td" sx={{ py: 0.5, px: 1, whiteSpace: 'nowrap' }}>
                      {payment.receiptNumber}
                    </Box>
                    <Box component="td" sx={{ py: 0.5, px: 1, whiteSpace: 'nowrap', color: 'text.secondary' }}>
                      {payment.paymentMethod}
                      {payment.referenceNumber ? ` · ${payment.referenceNumber}` : ''}
                    </Box>
                    <Box
                      component="td"
                      sx={{ py: 0.5, pl: 1, textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}
                    >
                      {num(payment.amount)}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </LabelledBlock>
        </Box>
      )}

      {/* ---- Terms + signature ---- */}
      {company.termsAndConditions && (
        <Box sx={{ mt: 3 }}>
          <LabelledBlock label="TERMS & CONDITIONS">
            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
              {company.termsAndConditions}
            </Typography>
          </LabelledBlock>
        </Box>
      )}

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ mt: 4, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'flex-end' } }}
      >
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {(company.footerMessage ?? 'Thank you for your business.').toUpperCase()}
        </Typography>
        {company.authorizedSignatory && (
          <Box sx={{ textAlign: 'right' }}>
            <Box sx={{ borderTop: '1px solid', borderColor: 'divider', width: 200, mb: 0.5 }} />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              For {company.companyName}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {company.authorizedSignatory}
            </Typography>
          </Box>
        )}
      </Stack>
    </Paper>
  );
}

export default function InvoicePage() {
  const id = useRouteId();
  const { showToast } = useToast();
  const [downloading, setDownloading] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoiceService.getForOrder(id),
    enabled: Boolean(id),
  });

  async function handleDownload() {
    if (!id || !data) return;
    setDownloading(true);
    try {
      await invoiceService.downloadPdf(id, `${data.invoiceNumber}.pdf`);
    } catch {
      showToast('Unable to download the invoice PDF.', 'error');
    } finally {
      setDownloading(false);
    }
  }

  function handleWhatsApp() {
    if (!data) return;
    const link = buildInvoiceWhatsAppLink(data);
    if (!link) {
      showToast('No WhatsApp number is available for this customer.', 'error');
      return;
    }
    window.open(link, '_blank', 'noopener');
  }

  if (isLoading) {
    return (
      <Stack sx={{ alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Stack>
    );
  }

  if (isError || !data) {
    return (
      <Box>
        <PageHeader
          title="Invoice"
          breadcrumbs={[
            { label: 'Dashboard', to: '/' },
            { label: 'Payment Tracker', to: '/payment-tracker' },
            { label: 'Invoice' },
          ]}
        />
        <Alert severity="error">
          {error instanceof Error ? error.message : 'This invoice could not be loaded.'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Screen-only chrome — the print stylesheet strips this so the sheet prints alone. */}
      <Box className="invoice-no-print">
        <PageHeader
          title={`Invoice · ${data.invoiceNumber}`}
          subtitle={`${data.customer.customerName} · ${data.order.orderNumber}`}
          breadcrumbs={[
            { label: 'Dashboard', to: '/' },
            { label: 'Payment Tracker', to: '/payment-tracker' },
            { label: data.order.orderNumber, to: `/payment-tracker/${data.order.id}` },
            { label: 'Invoice' },
          ]}
          actions={
            // Back lives in the breadcrumb trail now, and its parent crumb is this same order.
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
              <Button variant="outlined" startIcon={<WhatsAppIcon />} onClick={handleWhatsApp}>
                WhatsApp
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => void handleDownload()}
                disabled={downloading}
              >
                {downloading ? 'Downloading…' : 'Download'}
              </Button>
              <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()}>
                Print
              </Button>
            </Stack>
          }
        />
      </Box>

      <InvoiceSheet invoice={data} />
    </Box>
  );
}
