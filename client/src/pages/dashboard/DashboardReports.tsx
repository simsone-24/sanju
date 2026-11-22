import { Box, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useState } from 'react';
import { usePermission } from '../../hooks/usePermission';
import ExpenseReportTab from '../reports/tabs/ExpenseReportTab';
import OrderReportTab from '../reports/tabs/OrderReportTab';

type DashboardReport = 'orders' | 'expenses';

/**
 * The Dashboard's Reports tab: a switch between the Orders graphs and the Expenses graphs, each with
 * its own Duration dropdown. Only the reports the user may read are offered — both draw on data from
 * another module, so each needs that module's View permission as well as Dashboard Reports.
 */
export function DashboardReports() {
  const canViewOrders = usePermission('ORDERS', 'canView');
  const canViewExpenses = usePermission('EXPENSES', 'canView');

  const available: { value: DashboardReport; label: string }[] = [
    ...(canViewOrders ? [{ value: 'orders' as const, label: 'Orders' }] : []),
    ...(canViewExpenses ? [{ value: 'expenses' as const, label: 'Expenses' }] : []),
  ];
  const [selected, setSelected] = useState<DashboardReport>(canViewOrders ? 'orders' : 'expenses');
  const active = available.some((option) => option.value === selected) ? selected : available[0]?.value;

  return (
    <Box>
      {available.length > 1 && (
        <ToggleButtonGroup
          exclusive
          size="small"
          value={active}
          onChange={(_event, value: DashboardReport | null) => value && setSelected(value)}
          aria-label="Report"
          sx={{ mb: 2.5 }}
        >
          {available.map((option) => (
            <ToggleButton key={option.value} value={option.value} sx={{ px: 2.5 }}>
              {option.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      )}
      {active === 'orders' && <OrderReportTab mode="duration" />}
      {active === 'expenses' && <ExpenseReportTab mode="duration" />}
    </Box>
  );
}
