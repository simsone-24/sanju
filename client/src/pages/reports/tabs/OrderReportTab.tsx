import BarChartIcon from '@mui/icons-material/BarChart';
import CelebrationIcon from '@mui/icons-material/Celebration';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import { Box, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import { useState } from 'react';
import { DatePickerField } from '../../../components/DatePickerField';
import { resolveStatusConfig } from '../../../components/statusConfig';
import * as eventTypeService from '../../../services/eventTypeService';
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

interface OrderReportTabProps {
  /**
   * `filters` (default): the Reports page's date range + event type bar, grouped by month.
   * `duration`: the Dashboard's single Duration dropdown inside the trend panel.
   */
  mode?: 'filters' | 'duration';
}

/** Orders over time, by status and by event type — placed in the window by their event date (orders with no event date set are left out). */
export default function OrderReportTab({ mode = 'filters' }: OrderReportTabProps) {
  const [dateFrom, setDateFrom] = useState<Dayjs | null>(null);
  const [dateTo, setDateTo] = useState<Dayjs | null>(null);
  const [eventTypeId, setEventTypeId] = useState('');
  const [duration, setDuration] = useState<Duration>('THIS_YEAR');
  const [customMonth, setCustomMonth] = useState<Dayjs>(dayjs().startOf('month'));

  const durationMode = mode === 'duration';
  const range = durationMode ? durationRange(duration, customMonth) : null;
  const granularity: ExpenseGranularity = range?.granularity ?? 'month';

  const { data: eventTypes } = useQuery({
    queryKey: ['event-types', 'active'],
    queryFn: () => eventTypeService.listActive(),
    enabled: !durationMode,
  });

  const filters = {
    granularity,
    dateFrom: range ? range.from : dateFrom?.format('YYYY-MM-DD'),
    dateTo: range ? range.to : dateTo?.format('YYYY-MM-DD'),
    eventTypeId: durationMode ? undefined : toOptionalId(eventTypeId),
  };

  const { data } = useQuery({
    queryKey: ['reports', 'orders', filters],
    queryFn: () => reportService.getOrders(filters),
    placeholderData: keepPreviousData,
  });

  const filtersActive = Boolean(dateFrom || dateTo || eventTypeId);

  function clearFilters() {
    setDateFrom(null);
    setDateTo(null);
    setEventTypeId('');
  }

  // Drawn at the granularity the data was fetched at — placeholder data from the previous duration
  // can briefly carry the other one, and its periods would not parse as the new format.
  const shownGranularity = data?.granularity ?? granularity;
  const trend = data
    ? range && data.granularity === range.granularity
      ? fillPeriods(data.trend, range, (period) => ({ period, orderCount: 0, amount: 0 }))
      : data.trend
    : [];

  const countPoints: MonthlyBarPoint[] = trend.map((point) => ({
    label: periodLabel(point.period, shownGranularity, false, range),
    value: point.orderCount,
    tooltip: `${periodLabel(point.period, shownGranularity, true, range)}: ${point.orderCount} order(s) · ${formatCurrency(point.amount)}`,
  }));
  const valuePoints: MonthlyBarPoint[] = trend.map((point) => ({
    label: periodLabel(point.period, shownGranularity, false, range),
    value: point.amount,
    tooltip: `${periodLabel(point.period, shownGranularity, true, range)}: ${formatCurrency(point.amount)} (${point.orderCount} order(s))`,
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
            label="Event Type"
            value={eventTypeId}
            onChange={(event) => setEventTypeId(event.target.value)}
          >
            <MenuItem value="">All Event Types</MenuItem>
            {eventTypes?.map((type) => (
              <MenuItem key={type.id} value={type.id}>
                {type.eventName}
              </MenuItem>
            ))}
          </TextField>
        </ReportFilterBar>
      )}

      <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
        <Box sx={{ gridColumn: { md: '1 / -1' }, minWidth: 0 }}>
          <ReportPanel
            icon={<ShowChartIcon fontSize="small" />}
            title="Orders Trend"
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
                  Orders - {data?.totalOrders ?? 0} · Value - {formatCurrency(data?.totalValue ?? 0)}
                </Typography>
              </Stack>
            }
          >
            <MonthlyLineChart
              ariaLabel={`Line graph of orders by event date for each ${unitName}`}
              seriesName="Orders"
              points={countPoints}
            />
          </ReportPanel>
        </Box>

        <ReportPanel icon={<BarChartIcon fontSize="small" />} title={`Order Value by ${unitTitle}`}>
          <MonthlyBarChart ariaLabel={`Bar chart of order value for each ${unitName}`} points={valuePoints} />
        </ReportPanel>

        <ReportPanel icon={<DonutLargeIcon fontSize="small" />} title="Orders by Status">
          <DonutChart
            ariaLabel="Donut chart showing the share of orders in each status"
            centerLabel={String(data?.totalOrders ?? 0)}
            centerCaption="Orders"
            slices={(data?.byStatus ?? []).map((entry) => ({
              label: resolveStatusConfig('order', entry.status).label,
              value: entry.orderCount,
              displayValue: String(entry.orderCount),
            }))}
          />
        </ReportPanel>

        <Box sx={{ gridColumn: { md: '1 / -1' }, minWidth: 0 }}>
          <ReportPanel icon={<CelebrationIcon fontSize="small" />} title="Orders by Event Type">
            <BreakdownBarList
              items={(data?.byEventType ?? []).map((entry) => ({
                label: entry.eventTypeName,
                value: entry.orderCount,
                displayValue: `${entry.orderCount} · ${formatCurrency(entry.amount)}`,
              }))}
            />
          </ReportPanel>
        </Box>
      </Box>
    </>
  );
}
