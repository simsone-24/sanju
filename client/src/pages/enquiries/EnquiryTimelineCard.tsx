import HistoryIcon from '@mui/icons-material/History';
import { Box, Chip, Stack } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { InfoCard } from '../../components/InfoCard';
import { AppTimeline, type TimelineEntry } from '../../components/Timeline';
import { Button } from '../../components/ui/Button';
import * as enquiryService from '../../services/enquiryService';
import type { EnquiryTimelineEntry } from '../../types/enquiry';

// "md files/Enquiry/enq.md" §8 — the enquiry's complete history in one place: its own events, those
// of every quotation raised against it, and of the order it became. The dot colour says which
// record an entry belongs to, so the strands stay readable as a single list.
type ModuleTone = 'primary' | 'info' | 'success' | 'warning';

const MODULE_META: Record<string, { label: string; tone: ModuleTone }> = {
  ENQUIRIES: { label: 'Enquiry', tone: 'primary' },
  QUOTATIONS: { label: 'Quotation', tone: 'info' },
  ORDERS: { label: 'Order', tone: 'success' },
  PAYMENT_TRACKER: { label: 'Payment', tone: 'warning' },
};

// A long-running enquiry accumulates a lot of entries; showing the recent ones keeps this a summary
// rather than a wall, with the rest one click away.
const COLLAPSED_COUNT = 8;

function toTimelineEntry(entry: EnquiryTimelineEntry): TimelineEntry {
  const meta = MODULE_META[entry.module];
  return {
    id: entry.id,
    // The module is prefixed onto the action so a bare "STATUS CHANGE" says what changed status.
    action: `${meta?.label ?? entry.module} · ${entry.action.replaceAll('_', ' ')}`,
    description: entry.description,
    performedAt: entry.performedAt,
    performedBy: entry.performedBy,
    color: meta?.tone ?? 'grey',
  };
}

export function EnquiryTimelineCard({ enquiryId }: { enquiryId: string }) {
  const [expanded, setExpanded] = useState(false);

  const { data: timeline, isLoading } = useQuery({
    queryKey: ['enquiry-timeline', enquiryId],
    queryFn: () => enquiryService.getTimeline(enquiryId),
    enabled: Boolean(enquiryId),
  });

  const entries = timeline ?? [];
  const visible = expanded ? entries : entries.slice(0, COLLAPSED_COUNT);

  return (
    <InfoCard
      title="Timeline"
      icon={<HistoryIcon />}
      action={
        entries.length > COLLAPSED_COUNT ? (
          <Button size="sm" variant="ghost" onClick={() => setExpanded((open) => !open)}>
            {expanded ? 'Show less' : `Show all ${entries.length}`}
          </Button>
        ) : undefined
      }
    >
      {isLoading ? (
        <div className="tw-h-24 tw-animate-pulse tw-rounded tw-bg-slate-100 dark:tw-bg-slate-700" />
      ) : (
        <Box>
          <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', rowGap: 0.75, mb: 1.5 }}>
            {Object.entries(MODULE_META).map(([module, meta]) => (
              <Chip key={module} size="small" variant="outlined" color={meta.tone} label={meta.label} />
            ))}
          </Stack>
          <AppTimeline
            entries={visible.map(toTimelineEntry)}
            emptyMessage="Nothing has happened on this enquiry yet."
          />
        </Box>
      )}
    </InfoCard>
  );
}
