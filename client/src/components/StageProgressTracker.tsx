import CancelIcon from '@mui/icons-material/Cancel';
import CheckIcon from '@mui/icons-material/Check';
import { Box, Paper, Stack, Typography } from '@mui/material';
import { formatDate } from '../utils/format';

export interface ProgressStage {
  key: string;
  label: string;
  /**
   * When the record entered this stage. Omit the property entirely on trackers that have no dates
   * to show; pass null for a stage that was skipped or never recorded, which reads as an em dash.
   */
  date?: string | null;
}

interface StageProgressTrackerProps {
  stages: ProgressStage[];
  /** Index of the stage the record sits at now. Use -1 when it never entered one. */
  currentIndex: number;
  /**
   * Replaces the steps entirely for a record that left the path — a rejected order, a lost enquiry.
   * Such a record didn't progress *into* a further stage, so a highlighted step would misread.
   */
  halted?: { title: string; description: string };
}

/**
 * The horizontal stage tracker a detail page carries under its header ("md files/order/view.md"
 * §Quick Progress Tracker): completed stages in green with a tick, the current one ringed, the rest
 * recessive. Shared so Orders and Enquiries walk their different paths in the same visual language.
 */
export function StageProgressTracker({ stages, currentIndex, halted }: StageProgressTrackerProps) {
  if (halted) {
    return (
      <Paper
        variant="outlined"
        sx={(theme) => ({
          borderRadius: '16px',
          p: 2.5,
          mb: 2,
          borderColor: 'error.main',
          backgroundColor: `color-mix(in srgb, ${(theme.vars ?? theme).palette.error.main} 8%, transparent)`,
        })}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Box
            sx={(theme) => ({
              width: 36,
              height: 36,
              flexShrink: 0,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'error.main',
              backgroundColor: `color-mix(in srgb, ${(theme.vars ?? theme).palette.error.main} 16%, transparent)`,
            })}
          >
            <CancelIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.dark' }}>
              {halted.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {halted.description}
            </Typography>
          </Box>
        </Stack>
      </Paper>
    );
  }

  // A tracker whose stages carry no date property shows labels only, rather than a row of dashes.
  const showDates = stages.some((stage) => stage.date !== undefined);

  return (
    <Paper variant="outlined" sx={{ borderRadius: '16px', p: { xs: 2, sm: 3 }, mb: 2 }}>
      <Stack direction="row" sx={{ alignItems: 'flex-start' }}>
        {stages.map((stage, index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;
          return (
            <Stack
              key={stage.key}
              direction="row"
              sx={{ flex: index < stages.length - 1 ? 1 : 'none', alignItems: 'center', minWidth: 0 }}
            >
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    flexShrink: 0,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    color: done || active ? 'common.white' : 'text.disabled',
                    bgcolor: done ? 'success.main' : active ? 'primary.main' : 'action.hover',
                    boxShadow: (theme) =>
                      active
                        ? `0 0 0 4px color-mix(in srgb, ${(theme.vars ?? theme).palette.primary.main} 18%, transparent)`
                        : 'none',
                  }}
                >
                  {done ? <CheckIcon sx={{ fontSize: 18 }} /> : index + 1}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    noWrap
                    sx={{ fontWeight: done || active ? 700 : 500 }}
                    color={done || active ? 'text.primary' : 'text.secondary'}
                  >
                    {stage.label}
                  </Typography>
                  {showDates && (
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                      {stage.date ? formatDate(stage.date) : '—'}
                    </Typography>
                  )}
                </Box>
              </Stack>

              {index < stages.length - 1 && (
                <Box
                  aria-hidden
                  sx={{
                    flex: 1,
                    minWidth: 16,
                    height: 2,
                    mx: 2,
                    borderRadius: 1,
                    bgcolor: done ? 'success.main' : 'divider',
                  }}
                />
              )}
            </Stack>
          );
        })}
      </Stack>
    </Paper>
  );
}
