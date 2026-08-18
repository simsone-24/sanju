import CloseIcon from '@mui/icons-material/Close';
import { Box, Divider, Drawer, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { AppTimeline } from '../../components/Timeline';
import { IconButton } from '../../components/ui/IconButton';
import * as quotationService from '../../services/quotationService';

interface QuotationActivityDrawerProps {
  open: boolean;
  quotationId: number;
  onClose: () => void;
}

// The quotation's audit trail — created, edited, sent, approved, downloaded. A drawer rather than a
// section on the page: it is consulted occasionally, and the page belongs to the customer, the
// event and the quotation itself.
export function QuotationActivityDrawer({ open, quotationId, onClose }: QuotationActivityDrawerProps) {
  // Only fetched once the drawer is actually opened, so the page below loads in one request.
  const { data: timeline, isLoading } = useQuery({
    queryKey: ['quotation-timeline', quotationId],
    queryFn: () => quotationService.getTimeline(quotationId),
    enabled: open,
  });

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: { xs: '100vw', sm: 430 }, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2.25 }}>
          <Typography variant="h4">Activity</Typography>
          <IconButton title="Close" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
        <Divider />

        <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, py: 2 }}>
          {isLoading ? (
            <div className="tw-h-24 tw-animate-pulse tw-rounded tw-bg-slate-100 dark:tw-bg-slate-700" />
          ) : (
            <AppTimeline entries={timeline ?? []} emptyMessage="No activity recorded for this quotation yet." />
          )}
        </Box>
      </Box>
    </Drawer>
  );
}
