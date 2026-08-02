import { Box, Stack, Typography } from '@mui/material';
import type { CompanyDetail } from '../../types/company';
import type { QuotationRecipient } from '../../types/quotation';
import { getPublicAssetUrl } from '../../utils/format';

export interface QuotationPreviewItem {
  itemName: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface QuotationPreviewProps {
  company: CompanyDetail | undefined;
  recipient: QuotationRecipient;
  quotationNumber: string;
  quotationDate: string;
  items: QuotationPreviewItem[];
  subtotal: number;
  cgstPercent: number;
  sgstPercent: number;
  cgstAmount: number;
  sgstAmount: number;
  total: number;
  images: string[];
}

// Plain thousands-separated numbers with no currency symbol, matching the printed Sanju template.
function num(value: number): string {
  return value.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

const GREEN = '#4e9a2a';
const ITEM_GRID = '1fr 56px 92px 96px';

// On-screen replica of the company's printed quotation (green banner + QUOTATION pill, letterhead,
// item table, bank box + totals, thank-you footer). The server-side PDF mirrors this layout.
export default function QuotationPreview({
  company,
  recipient,
  quotationNumber,
  quotationDate,
  items,
  subtotal,
  cgstPercent,
  sgstPercent,
  cgstAmount,
  sgstAmount,
  total,
  images,
}: QuotationPreviewProps) {
  const bankRows = [
    ['Bank Name', company?.bankName],
    ['Account Name', company?.bankAccountName],
    ['Account Number', company?.bankAccountNumber],
    ['Branch Name', company?.bankBranch],
    ['IFSC Code', company?.bankIfsc],
    ['UPI', company?.bankUpi],
  ].filter(([, value]) => Boolean(value)) as [string, string][];

  return (
    <Box
      sx={{
        bgcolor: '#fff',
        color: '#1a1a1a',
        borderRadius: 1.5,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: 4,
        display: 'flex',
        flexDirection: 'column',
        // Approximate an A4 page so the preview reads as a full sheet even when content is short.
        minHeight: { xs: 'auto', md: 900 },
      }}
    >
      {/* Header band */}
      <Box
        sx={{
          position: 'relative',
          height: 92,
          background: `linear-gradient(105deg, ${GREEN} 0%, #8bc34a 45%, #dcedc8 72%, #ffffff 100%)`,
          display: 'flex',
          alignItems: 'center',
          px: 3,
        }}
      >
        <Box sx={{ border: '2.5px solid #111', borderRadius: 999, px: 2.5, py: 1, bgcolor: '#fff' }}>
          <Typography sx={{ fontWeight: 800, letterSpacing: 1.5, fontSize: 19, color: '#111' }}>QUOTATION</Typography>
        </Box>
        {company?.logo && (
          <Box
            component="img"
            src={getPublicAssetUrl(company.logo)}
            alt="logo"
            sx={{ position: 'absolute', right: 20, top: 14, height: 62, maxWidth: 130, objectFit: 'contain' }}
          />
        )}
      </Box>

      <Box sx={{ p: 3, flex: 1 }}>
        {/* Meta */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 2, rowGap: 0.5, mb: 2 }}>
          <Typography sx={{ fontSize: 13, color: '#666' }}>Date</Typography>
          <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{quotationDate || '—'}</Typography>
          <Typography sx={{ fontSize: 13, color: '#666' }}>Quote No</Typography>
          <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{quotationNumber}</Typography>
        </Box>

        {/* Company letterhead */}
        <Typography sx={{ fontWeight: 800, fontSize: 15, textDecoration: 'underline' }}>
          {company?.companyName ?? 'Company Name'}
        </Typography>
        {company?.address && (
          <Typography sx={{ fontSize: 12.5, color: '#333', whiteSpace: 'pre-line', lineHeight: 1.45, mt: 0.5 }}>
            {company.address}
          </Typography>
        )}
        {company?.gstNumber && (
          <Typography sx={{ fontSize: 12.5, color: '#333', mt: 0.25 }}>GST : {company.gstNumber}</Typography>
        )}

        {/* Recipient */}
        {recipient.name && (
          <Typography sx={{ fontSize: 12.5, color: '#333', mt: 1 }}>
            <Box component="span" sx={{ color: '#888' }}>
              To:{' '}
            </Box>
            {recipient.name}
            {recipient.phone ? ` · ${recipient.phone}` : ''}
          </Typography>
        )}

        {/* Items table */}
        <Box sx={{ mt: 2, border: '1px solid #e0e0e0', borderRadius: 1, overflow: 'hidden' }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: ITEM_GRID,
              bgcolor: '#f0f0f0',
              px: 1.5,
              py: 1,
              fontWeight: 700,
              fontSize: 11.5,
              letterSpacing: 0.3,
            }}
          >
            <Box>ITEM</Box>
            <Box sx={{ textAlign: 'center' }}>QTY</Box>
            <Box sx={{ textAlign: 'right' }}>UNIT PRICE</Box>
            <Box sx={{ textAlign: 'right' }}>SUBTOTAL</Box>
          </Box>
          {items.length === 0 && (
            <Box sx={{ px: 1.5, py: 1.5, color: '#999', fontSize: 12.5, textAlign: 'center' }}>No items yet</Box>
          )}
          {items.map((item, index) => (
            <Box
              key={index}
              sx={{
                display: 'grid',
                gridTemplateColumns: ITEM_GRID,
                px: 1.5,
                py: 1,
                fontSize: 12.5,
                borderTop: '1px solid #eee',
                alignItems: 'center',
              }}
            >
              <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', pr: 1 }}>
                {item.itemName || `Item ${index + 1}`}
              </Box>
              <Box sx={{ textAlign: 'center' }}>{item.quantity ? num(item.quantity) : '—'}</Box>
              <Box sx={{ textAlign: 'right', color: '#555' }}>{num(item.rate)}</Box>
              <Box sx={{ textAlign: 'right', fontWeight: 600 }}>{num(item.amount)}</Box>
            </Box>
          ))}
        </Box>

        {/* Bank + totals */}
        <Stack direction="row" spacing={2.5} sx={{ mt: 2.5, alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1, borderLeft: `3px solid ${GREEN}`, pl: 1.5, minWidth: 0 }}>
            {bankRows.length === 0 ? (
              <Typography sx={{ fontSize: 11, color: '#aaa' }}>
                Add bank details in Company Settings to show them here.
              </Typography>
            ) : (
              bankRows.map(([label, value]) => (
                <Box key={label} sx={{ display: 'flex', fontSize: 11, lineHeight: 1.7 }}>
                  <Box sx={{ width: 96, color: '#666', flexShrink: 0 }}>{label}</Box>
                  <Box sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>: {value}</Box>
                </Box>
              ))
            )}
          </Box>

          <Box sx={{ width: 190, flexShrink: 0 }}>
            <Row label="Subtotal" value={num(subtotal)} />
            {cgstPercent > 0 && <Row label={`Tax cGST ${cgstPercent}%`} value={num(cgstAmount)} />}
            {sgstPercent > 0 && <Row label={`Tax sGST ${sgstPercent}%`} value={num(sgstAmount)} />}
            <Box
              sx={{
                mt: 1,
                border: '2px solid #111',
                borderRadius: 999,
                px: 1.75,
                py: 0.75,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography sx={{ fontSize: 13.5, fontWeight: 800 }}>TOTAL</Typography>
              <Typography sx={{ fontSize: 13.5, fontWeight: 800 }}>{num(total)}</Typography>
            </Box>
          </Box>
        </Stack>

        {/* Sample decor images */}
        {images.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 12, mb: 0.75 }}>Sample Decor</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.75 }}>
              {images.map((src, index) => (
                <Box
                  key={index}
                  component="img"
                  src={src}
                  alt={`decor ${index + 1}`}
                  sx={{ width: '100%', height: 72, objectFit: 'cover', borderRadius: 0.5, border: '1px solid #eee' }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Standing terms from Company Settings — the same block the PDF prints. */}
        {company?.termsAndConditions && (
          <Box sx={{ mt: 2 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 12, mb: 0.5 }}>Terms &amp; Conditions</Typography>
            <Typography sx={{ fontSize: 11, color: '#555', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
              {company.termsAndConditions}
            </Typography>
          </Box>
        )}

        {/* Footer */}
        <Typography sx={{ fontWeight: 800, fontSize: 13, mt: 2.5 }}>
          {(company?.footerMessage ?? 'Thank you for your business.').toUpperCase()}
        </Typography>
        {company?.email && (
          <Typography sx={{ fontSize: 11, color: '#666', mt: 0.25 }}>
            If you have any questions, please contact us at {company.email}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, py: 0.4 }}>
      <Box sx={{ color: '#666' }}>{label} :</Box>
      <Box sx={{ fontWeight: 500 }}>{value}</Box>
    </Box>
  );
}
