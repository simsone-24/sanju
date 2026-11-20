import { Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';

// How a quotation's lines are entered: grouped under sections that each carry one amount, one priced
// line per item (item, quantity, unit price, subtotal), or both together in the same quotation.
export type QuotationLayout = 'SECTIONS' | 'ITEMS' | 'BOTH';

const LABELS: Record<QuotationLayout, string> = {
  SECTIONS: 'Section-wise',
  ITEMS: 'Line items',
  BOTH: 'Both',
};

interface QuotationLayoutToggleProps {
  value: QuotationLayout;
  onChange: (value: QuotationLayout) => void;
  /** The choices offered. A saved quotation is only offered layouts that cannot drop what it holds. */
  options?: QuotationLayout[];
}

export function QuotationLayoutToggle({ value, onChange, options = ['SECTIONS', 'ITEMS', 'BOTH'] }: QuotationLayoutToggleProps) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'center' }, mb: 1.5 }}>
      <Typography variant="body2" color="text.secondary">
        Quotation layout
      </Typography>
      <ToggleButtonGroup
        exclusive
        size="small"
        color="primary"
        value={value}
        // An exclusive group reports null when the selected button is clicked again — ignored, so one
        // layout is always chosen.
        onChange={(_event, next: QuotationLayout | null) => {
          if (next) onChange(next);
        }}
      >
        {options.map((option) => (
          <ToggleButton key={option} value={option} sx={{ textTransform: 'none', px: 2 }}>
            {LABELS[option]}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Stack>
  );
}

/**
 * The layout a saved quotation is edited in, from what it holds, plus the layouts it may be switched to
 * without losing a line: it can gain the other kind of line (→ Both) but never drop the one it has.
 */
export function layoutForSavedQuotation(hasSections: boolean, hasItems: boolean): {
  layout: QuotationLayout;
  options: QuotationLayout[];
} {
  if (hasSections && hasItems) return { layout: 'BOTH', options: [] };
  if (hasSections) return { layout: 'SECTIONS', options: ['SECTIONS', 'BOTH'] };
  return { layout: 'ITEMS', options: ['ITEMS', 'BOTH'] };
}
