import { useRouteId } from '../../hooks/useRouteId';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { AppTabs } from '../../components/AppTabs';
import { PageHeader } from '../../components/PageHeader';
import * as customerService from '../../services/customerService';
import CustomerOrdersTab from './tabs/CustomerOrdersTab';
import CustomerPaymentsTab from './tabs/CustomerPaymentsTab';
import CustomerProfileTab from './tabs/CustomerProfileTab';

// Full page, not a drawer — Customer Profile is documented as a tabbed page in its own right
// (docs/06_UI_UX_GUIDELINES.md §18). 3 of the 5 documented tabs are built (Profile, Orders,
// Payments); Documents and Timeline are deferred — there's no customer-scoped backend endpoint
// for either yet (server/src/modules/customers only exposes list/detail/orders), unlike Order
// Detail where those endpoints already existed before their tabs were built.
export default function CustomerDetailPage() {
  const id = useRouteId();

  const { data: customer, isLoading: customerLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customerService.getById(id),
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['customer-history', id],
    queryFn: () => customerService.getHistory(id),
  });

  if (customerLoading || historyLoading) return <CircularProgress size={28} />;
  if (!customer) return <Typography color="text.secondary">Customer not found.</Typography>;

  return (
    <Box>
      <PageHeader
        title={customer.customerName}
        subtitle={customer.customerCode}
        breadcrumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Customers', to: '/customers' }, { label: customer.customerName }]}
      />

      <AppTabs
        idPrefix="customer-detail"
        tabs={[
          { label: 'Profile', content: <CustomerProfileTab customer={customer} /> },
          {
            label: 'Orders',
            content: (
              <CustomerOrdersTab
                previousEvents={history?.previousEvents ?? []}
                upcomingEvents={history?.upcomingEvents ?? []}
              />
            ),
          },
          { label: 'Payments', content: <CustomerPaymentsTab payments={history?.payments ?? []} /> },
        ]}
      />
    </Box>
  );
}
