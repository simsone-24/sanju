import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PaymentsIcon from '@mui/icons-material/Payments';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { Box, Typography } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { AppTabs, type AppTabItem } from '../../components/AppTabs';
import { PageHeader } from '../../components/PageHeader';
import { usePermission } from '../../hooks/usePermission';
import CustomerReportTab from './tabs/CustomerReportTab';
import ExpenseReportTab from './tabs/ExpenseReportTab';
import OrderReportTab from './tabs/OrderReportTab';
import OutstandingReportTab from './tabs/OutstandingReportTab';
import RevenueReportTab from './tabs/RevenueReportTab';

// docs/03_MODULES.md §8 documents 5 report types (Revenue, Payment, Quotation, Event, Customer)
// plus PDF/Excel/Print export, but the actual backend (server/src/modules/reports) only
// implements 4 endpoints — revenue, outstanding, customers, events — with no separate Payment or
// Quotation report and no export endpoint at all. Built to match what the backend actually
// supports, not the literal doc list; CSV export of the current page is still available via each
// table's existing DataTable export button, same as every other list page in this app.

export default function ReportsPage() {
  const canView = usePermission('REPORTS', 'canView');
  // The Expenses tab shows expense data, so it needs the Expenses module's View as well.
  const canViewExpenses = usePermission('EXPENSES', 'canView');
  const canViewOrders = usePermission('ORDERS', 'canView');
  const [searchParams, setSearchParams] = useSearchParams();

  // Slug per tab, in tab order — the active tab lives in the query string so a report can be linked
  // to directly and survives a refresh.
  const tabs: (AppTabItem & { slug: string })[] = [
    { slug: 'revenue', label: 'Revenue', icon: <TrendingUpIcon fontSize="small" />, content: <RevenueReportTab /> },
    {
      slug: 'outstanding',
      label: 'Outstanding',
      icon: <AccountBalanceWalletIcon fontSize="small" />,
      content: <OutstandingReportTab />,
    },
    { slug: 'customers', label: 'Customers', icon: <PeopleAltOutlinedIcon fontSize="small" />, content: <CustomerReportTab /> },
    ...(canViewOrders
      ? [{ slug: 'orders', label: 'Orders', icon: <ShoppingBagOutlinedIcon fontSize="small" />, content: <OrderReportTab /> }]
      : []),
    ...(canViewExpenses
      ? [{ slug: 'expenses', label: 'Expenses', icon: <PaymentsIcon fontSize="small" />, content: <ExpenseReportTab /> }]
      : []),
  ];

  const slugIndex = tabs.findIndex((tab) => tab.slug === searchParams.get('tab'));
  const activeIndex = slugIndex === -1 ? 0 : slugIndex;

  function handleTabChange(index: number) {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.set('tab', tabs[index].slug);
        return next;
      },
      { replace: true },
    );
  }

  return (
    <Box>
      <PageHeader title="Reports" />

      {canView ? (
        <AppTabs
          surface
          idPrefix="reports"
          activeIndex={activeIndex}
          onActiveIndexChange={handleTabChange}
          tabs={tabs}
        />
      ) : (
        <Typography color="text.secondary">You do not have access to view reports.</Typography>
      )}
    </Box>
  );
}
