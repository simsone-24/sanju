import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import HistoryIcon from '@mui/icons-material/History';
import { Box, Typography } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { AppTabs, type AppTabItem } from '../../components/AppTabs';
import { PageHeader } from '../../components/PageHeader';
import { usePermission } from '../../hooks/usePermission';
import ActivityLogTab from './ActivityLogTab';
import DeletedItemsTab from './DeletedItemsTab';

// Slug per tab, in tab order — the active tab lives in the query string so a view survives a refresh
// and can be linked to.
const TABS: (AppTabItem & { slug: string })[] = [
  { slug: 'activity', label: 'Activity', icon: <HistoryIcon fontSize="small" />, content: <ActivityLogTab /> },
  {
    slug: 'deleted',
    label: 'Deleted Items',
    icon: <DeleteSweepIcon fontSize="small" />,
    content: <DeletedItemsTab />,
  },
];

/** Who did what, and when — the activity log, and the records that have since been deleted. */
export default function AuditLogPage() {
  const canView = usePermission('AUDIT_LOG', 'canView');
  const [searchParams, setSearchParams] = useSearchParams();

  const slugIndex = TABS.findIndex((tab) => tab.slug === searchParams.get('tab'));
  const activeIndex = slugIndex === -1 ? 0 : slugIndex;

  function handleTabChange(index: number) {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.set('tab', TABS[index].slug);
        return next;
      },
      { replace: true },
    );
  }

  if (!canView) {
    return <Typography color="text.secondary">You do not have access to view the audit log.</Typography>;
  }

  return (
    <Box>
      <PageHeader title="Audit Log" subtitle="Who did what, and when — and what has been deleted." />

      <AppTabs
        surface
        idPrefix="audit-log"
        activeIndex={activeIndex}
        onActiveIndexChange={handleTabChange}
        tabs={TABS}
      />
    </Box>
  );
}
