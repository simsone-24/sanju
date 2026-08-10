import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import EventNoteIcon from '@mui/icons-material/EventNote';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { Box, Typography } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { AppTabs } from '../../components/AppTabs';
import { PageHeader } from '../../components/PageHeader';
import { usePermission } from '../../hooks/usePermission';
import CustomerReportTab from './tabs/CustomerReportTab';
import EventReportTab from './tabs/EventReportTab';
import OutstandingReportTab from './tabs/OutstandingReportTab';
import RevenueReportTab from './tabs/RevenueReportTab';

// docs/03_MODULES.md §8 documents 5 report types (Revenue, Payment, Quotation, Event, Customer)
// plus PDF/Excel/Print export, but the actual backend (server/src/modules/reports) only
// implements 4 endpoints — revenue, outstanding, customers, events — with no separate Payment or
// Quotation report and no export endpoint at all. Built to match what the backend actually
// supports, not the literal doc list; CSV export of the current page is still available via each
// table's existing DataTable export button, same as every other list page in this app.
// Slug per tab, in tab order — the active tab lives in the query string so a report can be linked
// to directly (the Dashboard's event tiles open `?tab=events&from=…`) and survives a refresh.
const TAB_SLUGS = ['revenue', 'outstanding', 'customers', 'events'] as const;

export default function ReportsPage() {
  const canView = usePermission('REPORTS', 'canView');
  const [searchParams, setSearchParams] = useSearchParams();

  const slugIndex = TAB_SLUGS.indexOf((searchParams.get('tab') ?? '') as (typeof TAB_SLUGS)[number]);
  const activeIndex = slugIndex === -1 ? 0 : slugIndex;

  function handleTabChange(index: number) {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.set('tab', TAB_SLUGS[index]);
        return next;
      },
      { replace: true },
    );
  }

  return (
    <Box>
      <PageHeader
        title="Reports"
        subtitle="Revenue, outstanding balances, customers, and events."
        breadcrumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Reports' }]}
      />

      {canView ? (
        <AppTabs
          surface
          idPrefix="reports"
          activeIndex={activeIndex}
          onActiveIndexChange={handleTabChange}
          tabs={[
            { label: 'Revenue', icon: <TrendingUpIcon fontSize="small" />, content: <RevenueReportTab /> },
            {
              label: 'Outstanding',
              icon: <AccountBalanceWalletIcon fontSize="small" />,
              content: <OutstandingReportTab />,
            },
            { label: 'Customers', icon: <PeopleAltOutlinedIcon fontSize="small" />, content: <CustomerReportTab /> },
            { label: 'Events', icon: <EventNoteIcon fontSize="small" />, content: <EventReportTab /> },
          ]}
        />
      ) : (
        <Typography color="text.secondary">You do not have access to view reports.</Typography>
      )}
    </Box>
  );
}
