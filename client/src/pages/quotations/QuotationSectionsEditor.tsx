import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Button, IconButton, Stack, TextField, Typography } from '@mui/material';
import { QuotationTaxTotals } from './QuotationTaxTotals';
import {
  editQuotationSectionItem,
  newQuotationSectionDraft,
  removeQuotationSectionItem,
  type QuotationDraftTotals,
  type QuotationSectionDraft,
} from './quotationDraft';

interface QuotationSectionsEditorProps {
  sections: QuotationSectionDraft[];
  onSectionsChange: (sections: QuotationSectionDraft[]) => void;
  cgstPercent: string;
  sgstPercent: string;
  onCgstChange: (value: string) => void;
  onSgstChange: (value: string) => void;
  totals: QuotationDraftTotals;
  error?: string | null;
  /** Optional advance, offered beside the tax percentages (see QuotationTaxTotals). */
  advanceAmount?: string;
  onAdvanceChange?: (value: string) => void;
}

// The section-wise way of composing a quotation, as on Sanju's printed quotation: items are listed
// under a section ("EVENING STAGE") and the whole section carries one amount. Each section can have a
// heading, or none for a group priced together without one. A single item quoted alone is simply a
// section with one item.
export function QuotationSectionsEditor({
  sections,
  onSectionsChange,
  cgstPercent,
  sgstPercent,
  onCgstChange,
  onSgstChange,
  totals,
  error,
  advanceAmount,
  onAdvanceChange,
}: QuotationSectionsEditorProps) {
  function updateSection(index: number, next: QuotationSectionDraft) {
    onSectionsChange(sections.map((section, i) => (i === index ? next : section)));
  }

  // Serial numbers run on across sections, like the printed S.NO column.
  let serial = 0;

  return (
    <Box>
      <Stack spacing={2}>
        {sections.map((section, sectionIndex) => (
          <Box
            key={sectionIndex}
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: { xs: 1.5, sm: 2 } }}
          >
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'flex-start' } }}>
              <TextField
                size="small"
                fullWidth
                label="Section heading (optional)"
                placeholder="e.g. EVENING STAGE"
                value={section.title}
                onChange={(event) => updateSection(sectionIndex, { ...section, title: event.target.value })}
              />
              <TextField
                size="small"
                label="Section Amount"
                value={section.amount}
                onChange={(event) =>
                  updateSection(sectionIndex, {
                    ...section,
                    amount: event.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'),
                  })
                }
                sx={{ width: { xs: '100%', sm: 190 }, flexShrink: 0 }}
                slotProps={{ htmlInput: { inputMode: 'decimal', style: { textAlign: 'right' } } }}
              />
              {sections.length > 1 && (
                <IconButton
                  size="small"
                  color="error"
                  title="Delete section"
                  onClick={() => onSectionsChange(sections.filter((_, i) => i !== sectionIndex))}
                  sx={{ alignSelf: { xs: 'flex-end', sm: 'center' } }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Stack>

            <Stack spacing={1} sx={{ mt: 1.5 }}>
              {section.items.map((item, itemIndex) => {
                const isTrailingEmpty = itemIndex === section.items.length - 1 && !item.description.trim();
                if (item.description.trim()) serial += 1;
                return (
                  <Stack key={itemIndex} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ width: 28, textAlign: 'center', flexShrink: 0 }}>
                      {item.description.trim() ? serial : ''}
                    </Typography>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder={isTrailingEmpty ? 'Type to add an item…' : 'Item description'}
                      value={item.description}
                      onChange={(event) =>
                        updateSection(
                          sectionIndex,
                          editQuotationSectionItem(section, itemIndex, 'description', event.target.value),
                        )
                      }
                    />
                    <TextField
                      size="small"
                      placeholder="Size / Qty"
                      value={item.sizeQty}
                      onChange={(event) =>
                        updateSection(
                          sectionIndex,
                          editQuotationSectionItem(section, itemIndex, 'sizeQty', event.target.value),
                        )
                      }
                      sx={{ width: { xs: 96, sm: 140 }, flexShrink: 0 }}
                    />
                    <Box sx={{ width: 34, flexShrink: 0 }}>
                      {section.items.length > 1 && !isTrailingEmpty && (
                        <IconButton
                          size="small"
                          color="error"
                          title="Delete item"
                          onClick={() => updateSection(sectionIndex, removeQuotationSectionItem(section, itemIndex))}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </Stack>
                );
              })}
            </Stack>
          </Box>
        ))}
      </Stack>

      <Button
        size="small"
        startIcon={<AddIcon />}
        sx={{ mt: 1.5 }}
        onClick={() => onSectionsChange([...sections, newQuotationSectionDraft()])}
      >
        Add Section
      </Button>

      {error && (
        <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
          {error}
        </Typography>
      )}

      <QuotationTaxTotals
        cgstPercent={cgstPercent}
        sgstPercent={sgstPercent}
        onCgstChange={onCgstChange}
        onSgstChange={onSgstChange}
        totals={totals}
        advanceAmount={advanceAmount}
        onAdvanceChange={onAdvanceChange}
      />
    </Box>
  );
}
