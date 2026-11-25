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
  // Each tab is granted on its own (Masters → User Groups → Reports).
  const canViewRevenue = usePermission('REPORTS', 'canViewRevenueReport');
  const canViewOutstanding = usePermission('REPORTS', 'canViewOutstandingReport');
  const canViewCustomers = usePermission('REPORTS', 'canViewCustomerReport');
  // The Orders and Expenses tabs show that module's own data, so they need its View as well.
  const hasOrderReport = usePermission('REPORTS', 'canViewOrderReport');
  const hasExpenseReport = usePermission('REPORTS', 'canViewExpenseReport');
  const canViewOrders = usePermission('ORDERS', 'canView');
  const canViewExpenses = usePermission('EXPENSES', 'canView');
  const canViewOrderReport = hasOrderReport && canViewOrders;
  const canViewExpenseReport = hasExpenseReport && canViewExpenses;
  const [searchParams, setSearchParams] = useSearchParams();

  // Slug per tab, in tab order — the active tab lives in the query string so a report can be linked
  // to directly and survives a refresh.
  const tabs: (AppTabItem & { slug: string })[] = [
    ...(canViewRevenue
      ? [{ slug: 'revenue', label: 'Revenue', icon: <TrendingUpIcon fontSize="small" />, content: <RevenueReportTab /> }]
      : []),
    ...(canViewOutstanding
      ? [
          {
            slug: 'outstanding',
            label: 'Outstanding',
            icon: <AccountBalanceWalletIcon fontSize="small" />,
            content: <OutstandingReportTab />,
          },
        ]
      : []),
    ...(canViewCustomers
      ? [
          {
            slug: 'customers',
            label: 'Customers',
            icon: <PeopleAltOutlinedIcon fontSize="small" />,
            content: <CustomerReportTab />,
          },
        ]
      : []),
    ...(canViewOrderReport
      ? [{ slug: 'orders', label: 'Orders', icon: <ShoppingBagOutlinedIcon fontSize="small" />, content: <OrderReportTab /> }]
      : []),
    ...(canViewExpenseReport
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

      {tabs.length > 0 ? (
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
