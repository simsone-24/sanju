import { Box, Stack, Typography } from '@mui/material';
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
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
  /** Advance agreed against the quotation; deducted from the printed total when present. */
  advanceAmount?: number;
  images: string[];
}

// Plain thousands-separated numbers with no currency symbol, matching the printed Sanju template.
function num(value: number): string {
  return value.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

const GREEN = '#4e9a2a';
const ITEM_GRID = '1fr 80px 92px 96px';

// A4 at 96 dpi. The sheets are laid out at this exact size and then scaled down to the width of
// whatever container they are placed in, so the preview keeps the proportions of the printed page.
const A4_WIDTH = 794;
const A4_HEIGHT = 1123;
const PAGE_GAP = 20;

// The live preview is embedded in side panels and dialogs of very different widths. Rather than
// reflowing the quotation (which would no longer look like the printed page), render it at A4 size
// and scale the whole sheet to fit.
function useFitScale() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const update = () => {
      const width = element.clientWidth;
      setScale(width > 0 ? Math.min(1, width / A4_WIDTH) : 1);
    };

    update();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }

    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, scale };
}

// One white A4 sheet. The content is measured at full size so the sheet can grow a little when a
// quotation has enough items to run past one page; the visible box is the scaled version.
function A4Sheet({ scale, children }: { scale: number; children: ReactNode }) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [pageHeight, setPageHeight] = useState(A4_HEIGHT);

  useLayoutEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    const update = () => setPageHeight(Math.max(A4_HEIGHT, element.offsetHeight));
    update();
    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <Box
      sx={{
        width: A4_WIDTH * scale,
        height: pageHeight * scale,
        flexShrink: 0,
        overflow: 'hidden',
        bgcolor: '#fff',
        borderRadius: 1,
        boxShadow: 4,
      }}
    >
      <Box
        ref={contentRef}
        sx={{
          width: A4_WIDTH,
          minHeight: A4_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          bgcolor: '#fff',
          color: '#1a1a1a',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

// On-screen replica of the company's printed quotation (green banner + QUOTATION pill, letterhead,
// item table, bank box + totals, thank-you footer). Sample decor images get their own A4 sheet,
// matching the server-side PDF, which prints them on a separate gallery page.
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
  advanceAmount = 0,
  images,
}: QuotationPreviewProps) {
  const { ref, scale } = useFitScale();

  const bankRows = [
    ['Bank Name', company?.bankName],
    ['Account Name', company?.bankAccountName],
    ['Account Number', company?.bankAccountNumber],
    ['Branch Name', company?.bankBranch],
    ['IFSC Code', company?.bankIfsc],
    ['UPI', company?.bankUpi],
  ].filter(([, value]) => Boolean(value)) as [string, string][];

  const galleryColumns = images.length === 1 ? 1 : 2;
  const galleryRows = Math.ceil(images.length / galleryColumns);

  return (
    <Box
      ref={ref}
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: `${PAGE_GAP * scale}px`,
      }}
    >
      <A4Sheet scale={scale}>
        {/* Header band */}
        <Box
          sx={{
            position: 'relative',
            height: 80,
            flexShrink: 0,
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

        <Box sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
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
                   py: 0.75,
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
                     py: 0.75,
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
              {advanceAmount > 0 && <Row label="Advance" value={`- ${num(advanceAmount)}`} />}
              <Box
                sx={{
                  mt: 1,
                  border: '2px solid #111',
                  borderRadius: 999,
                   px: 1.75,
                   py: 1.25,
                   display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography sx={{ fontSize: 13.5, fontWeight: 800 }}>TOTAL</Typography>
                <Typography sx={{ fontSize: 13.5, fontWeight: 800 }}>{num(total - advanceAmount)}</Typography>
              </Box>
            </Box>
          </Stack>

          {/* Standing terms from Company Settings — the same block the PDF prints. */}
          {company?.termsAndConditions && (
            <Box sx={{ mt: 2 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 12, mb: 0.5 }}>Terms &amp; Conditions</Typography>
              <Typography sx={{ fontSize: 11, color: '#555', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                {company.termsAndConditions}
              </Typography>
            </Box>
          )}

          {/* Footer pinned to the bottom of the sheet, like the printed page. */}
          <Box sx={{ mt: 'auto', pt: 2.5 }}>
            <Typography sx={{ fontWeight: 800, fontSize: 13 }}>
              {(company?.footerMessage ?? 'Thank you for your business.').toUpperCase()}
            </Typography>
            {company?.email && (
              <Typography sx={{ fontSize: 11, color: '#666', mt: 0.25 }}>
                If you have any questions, please contact us at {company.email}
              </Typography>
            )}
          </Box>
        </Box>
      </A4Sheet>

      {/* Sample decor images get their own page, matching the PDF's gallery page. */}
      {images.length > 0 && (
        <A4Sheet scale={scale}>
          <Box sx={{ p: 3, height: A4_HEIGHT, display: 'flex', flexDirection: 'column' }}>
            <Typography sx={{ fontWeight: 800, fontSize: 18 }}>Sample Decor</Typography>
            <Box
              sx={{
                mt: 2,
                flex: 1,
                minHeight: 0,
                display: 'grid',
                gridTemplateColumns: `repeat(${galleryColumns}, 1fr)`,
                gridTemplateRows: `repeat(${galleryRows}, 1fr)`,
                gap: 1.5,
              }}
            >
              {images.map((src, index) => (
                <Box
                  key={index}
                  sx={{
                    bgcolor: '#f7f7f7',
                    border: '1px solid #ececec',
                    borderRadius: 0.5,
                    overflow: 'hidden',
                    display: 'flex',
                  }}
                >
                  <Box
                    component="img"
                    src={src}
                    alt={`decor ${index + 1}`}
                    sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </Box>
              ))}
            </Box>
          </Box>
        </A4Sheet>
      )}
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
