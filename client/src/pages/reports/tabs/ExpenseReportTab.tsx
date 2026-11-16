import BarChartIcon from '@mui/icons-material/BarChart';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import DonutSmallIcon from '@mui/icons-material/DonutSmall';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import { Box, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import { useState } from 'react';
import { DatePickerField } from '../../../components/DatePickerField';
import * as expenseService from '../../../services/expenseService';
import * as reportService from '../../../services/reportService';
import type { ExpenseGranularity } from '../../../types/report';
import { formatCurrency } from '../../../utils/format';
import { toOptionalId } from '../../../utils/ids';
import { BreakdownBarList } from '../BreakdownBarList';
import { DonutChart } from '../DonutChart';
import { DurationControls } from '../DurationControls';
import { MonthlyBarChart, type MonthlyBarPoint } from '../MonthlyBarChart';
import { MonthlyLineChart } from '../MonthlyLineChart';
import { ReportFilterBar } from '../ReportFilterBar';
import { ReportPanel } from '../ReportPanel';
import { durationRange, fillPeriods, periodLabel, type Duration } from '../reportDuration';

interface ExpenseReportTabProps {
  /**
   * `filters` (default): the Reports page's date range + category bar, grouped by month.
   * `duration`: the Dashboard's single Duration dropdown inside the trend panel.
   */
  mode?: 'filters' | 'duration';
}

export default function ExpenseReportTab({ mode = 'filters' }: ExpenseReportTabProps) {
  const [dateFrom, setDateFrom] = useState<Dayjs | null>(null);
  const [dateTo, setDateTo] = useState<Dayjs | null>(null);
  const [categoryId, setCategoryId] = useState('');
  const [duration, setDuration] = useState<Duration>('THIS_YEAR');
  const [customMonth, setCustomMonth] = useState<Dayjs>(dayjs().startOf('month'));

  const durationMode = mode === 'duration';
  const range = durationMode ? durationRange(duration, customMonth) : null;
  const granularity: ExpenseGranularity = range?.granularity ?? 'month';

  const { data: categories } = useQuery({
    queryKey: ['expense-categories', 'options'],
    queryFn: () => expenseService.listCategories({ page: 1, limit: 100 }),
    enabled: !durationMode,
  });

  const filters = {
    granularity,
    dateFrom: range ? range.from : dateFrom?.format('YYYY-MM-DD'),
    dateTo: range ? range.to : dateTo?.format('YYYY-MM-DD'),
    categoryId: durationMode ? undefined : toOptionalId(categoryId),
  };

  const { data } = useQuery({
    queryKey: ['reports', 'expenses', filters],
    queryFn: () => reportService.getExpenses(filters),
    placeholderData: keepPreviousData,
  });

  const filtersActive = Boolean(dateFrom || dateTo || categoryId);

  function clearFilters() {
    setDateFrom(null);
    setDateTo(null);
    setCategoryId('');
  }

  // Drawn at the granularity the data was fetched at — placeholder data from the previous duration
  // can briefly carry the other one, and its periods would not parse as the new format.
  const shownGranularity = data?.granularity ?? granularity;
  const trend = data
    ? range && data.granularity === range.granularity
      ? fillPeriods(data.trend, range, (period) => ({ period, amount: 0, expenseCount: 0 }))
      : data.trend
    : [];
  const points: MonthlyBarPoint[] = trend.map((point) => ({
    label: periodLabel(point.period, shownGranularity, false, range),
    value: point.amount,
    tooltip: `${periodLabel(point.period, shownGranularity, true, range)}: ${formatCurrency(point.amount)} (${point.expenseCount} expense(s))`,
  }));
  const unitName = shownGranularity;
  const unitTitle = { day: 'Day', week: 'Week', month: 'Month' }[shownGranularity];

  return (
    <>
      {!durationMode && (
        <ReportFilterBar onClear={clearFilters} active={filtersActive}>
          <DatePickerField label="Date From" margin="none" value={dateFrom} onChange={setDateFrom} />
          <DatePickerField
            label="Date To"
            margin="none"
            value={dateTo}
            onChange={setDateTo}
            minDate={dateFrom ?? undefined}
          />
          <TextField
            select
            size="small"
            label="Category"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            <MenuItem value="">All Categories</MenuItem>
            {categories?.records.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </TextField>
        </ReportFilterBar>
      )}

      {/* Two panels per row from md up; each chart answers a different question — compare single
          periods (bars), see the direction of travel (line), see who the money went to (donut + list). */}
      <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
        <Box sx={{ gridColumn: { md: '1 / -1' }, minWidth: 0 }}>
          <ReportPanel
            icon={<ShowChartIcon fontSize="small" />}
            title="Expense Trend"
            action={
              <Stack spacing={1} sx={{ alignItems: 'flex-end' }}>
                {durationMode && (
                  <DurationControls
                    duration={duration}
                    onDurationChange={setDuration}
                    customMonth={customMonth}
                    onCustomMonthChange={setCustomMonth}
                  />
                )}
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  Total - {formatCurrency(data?.totalAmount ?? 0)}
                </Typography>
              </Stack>
            }
          >
            <MonthlyLineChart
              ariaLabel={`Line graph of total expenses for each ${unitName}`}
              seriesName="Expenses"
              points={points}
            />
          </ReportPanel>
        </Box>
        <ReportPanel
          icon={<BarChartIcon fontSize="small" />}
          title={`Expenses by ${unitTitle}`}
        >
          <MonthlyBarChart ariaLabel={`Bar chart of total expenses for each ${unitName}`} points={points} />
        </ReportPanel>
        <ReportPanel icon={<DonutLargeIcon fontSize="small" />} title="Category Share">
          <DonutChart
            ariaLabel="Donut chart showing each expense category's share of total expenses"
            centerLabel={formatCurrency(data?.totalAmount ?? 0)}
            centerCaption="Total"
            slices={(data?.byCategory ?? []).map((entry) => ({
              label: entry.categoryName,
              value: entry.amount,
              displayValue: formatCurrency(entry.amount),
            }))}
          />
        </ReportPanel>
        <ReportPanel icon={<CategoryOutlinedIcon fontSize="small" />} title="Expenses by Category">
          <BreakdownBarList
            items={(data?.byCategory ?? []).map((entry) => ({
              label: entry.categoryName,
              value: entry.amount,
              displayValue: formatCurrency(entry.amount),
            }))}
          />
        </ReportPanel>
        <ReportPanel icon={<DonutSmallIcon fontSize="small" />} title="Expenses by Payment Method">
          <BreakdownBarList
            items={(data?.byMethod ?? []).map((entry) => ({
              label: entry.paymentMethod,
              value: entry.amount,
              displayValue: formatCurrency(entry.amount),
            }))}
          />
        </ReportPanel>
      </Box>
    </>
  );
}
