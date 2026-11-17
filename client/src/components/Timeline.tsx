import {
  Timeline as MuiTimeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
} from '@mui/lab';
import { Box, Typography } from '@mui/material';
import dayjs from 'dayjs';

export interface TimelineEntry {
  id: number;
  action: string;
  description?: string | null;
  performedAt: string;
  performedBy?: { fullName: string } | null;
  /** Labelled facts shown in place of the description (e.g. Old / New amount, Reason). */
  details?: { label: string; value: string }[];
  /** Dot colour, for timelines that span more than one record (see the enquiry timeline). */
  color?: 'primary' | 'success' | 'warning' | 'info' | 'error' | 'grey';
}

interface TimelineProps {
  entries: TimelineEntry[];
  emptyMessage?: string;
}

// Read-only per docs/02_BUSINESS_WORKFLOW.md §16 — "Timeline cannot be edited manually."
export function AppTimeline({ entries, emptyMessage = 'No activity yet.' }: TimelineProps) {
  if (entries.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {emptyMessage}
      </Typography>
    );
  }

  return (
    <MuiTimeline sx={{ p: 0, m: 0 }}>
      {entries.map((entry, index) => (
        <TimelineItem key={entry.id}>
          <TimelineOppositeContent color="text.secondary" sx={{ flex: 0.3 }}>
            {dayjs(entry.performedAt).format('DD MMM YYYY, h:mm A')}
          </TimelineOppositeContent>
          <TimelineSeparator>
            <TimelineDot color={entry.color ?? 'primary'} />
            {index < entries.length - 1 && <TimelineConnector />}
          </TimelineSeparator>
          <TimelineContent>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {entry.action.replaceAll('_', ' ')}
            </Typography>
            {entry.details && entry.details.length > 0 && (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 1.5, rowGap: 0.25, my: 0.5 }}>
                {entry.details.map((detail) => (
                  <Box key={detail.label} sx={{ display: 'contents' }}>
                    <Typography variant="body2" color="text.secondary">
                      {detail.label}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, overflowWrap: 'anywhere' }}>
                      {detail.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
            {!entry.details?.length && entry.description && (
              <Typography variant="body2" color="text.secondary">
                {entry.description}
              </Typography>
            )}
            {entry.performedBy && (
              <Typography variant="caption" color="text.secondary">
                by {entry.performedBy.fullName}
              </Typography>
            )}
          </TimelineContent>
        </TimelineItem>
      ))}
    </MuiTimeline>
  );
}
