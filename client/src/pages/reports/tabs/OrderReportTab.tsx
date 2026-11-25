import CelebrationIcon from '@mui/icons-material/Celebration';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import { Box, Stack, Typography } from '@mui/material';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import { useState } from 'react';
import { resolveStatusConfig } from '../../../components/statusConfig';
import * as reportService from '../../../services/reportService';
import type { ExpenseGranularity } from '../../../types/report';
import { BreakdownBarList } from '../BreakdownBarList';
import { DonutChart } from '../DonutChart';
import { DurationControls } from '../DurationControls';
import type { MonthlyBarPoint } from '../MonthlyBarChart';
import { MonthlyLineChart } from '../MonthlyLineChart';
import { PeriodFilter } from '../PeriodFilter';
import { ReportFilterBar } from '../ReportFilterBar';
import { ReportPanel } from '../ReportPanel';
import { useReportPeriod } from '../useReportPeriod';
import { durationRange, fillPeriods, periodLabel, type Duration } from '../reportDuration';

interface OrderReportTabProps {
  /**
   * `filters` (default): the Reports page's Month / Year bar, bucketed by day (month) or month (year).
   * `duration`: the Dashboard's single Duration dropdown inside the trend panel.
   */
  mode?: 'filters' | 'duration';
}

/** Orders over time, by status and by event type — placed in the window by their event date (orders with no event date set are left out). */
export default function OrderReportTab({ mode = 'filters' }: OrderReportTabProps) {
  const period = useReportPeriod();
  const [duration, setDuration] = useState<Duration>('THIS_YEAR');
  const [customMonth, setCustomMonth] = useState<Dayjs>(dayjs().startOf('month'));

  const durationMode = mode === 'duration';
  // The Dashboard picks a Duration; the Reports page picks a month or a year. Either way the window
  // also decides how finely the trend is bucketed (day / week / month).
  const range = durationMode ? durationRange(duration, customMonth) : period.range;
  const granularity: ExpenseGranularity = range.granularity;

  const filters = {
    granularity,
    dateFrom: range.from,
    dateTo: range.to,
  };

  const { data } = useQuery({
    queryKey: ['reports', 'orders', filters],
    queryFn: () => reportService.getOrders(filters),
    placeholderData: keepPreviousData,
  });

  // Drawn at the granularity the data was fetched at — placeholder data from the previous duration
  // can briefly carry the other one, and its periods would not parse as the new format.
  const shownGranularity = data?.granularity ?? granularity;
  const trend = data
    ? data.granularity === range.granularity
      ? fillPeriods(data.trend, range, (key) => ({ period: key, orderCount: 0, amount: 0 }))
      : data.trend
    : [];

  const countPoints: MonthlyBarPoint[] = trend.map((point) => ({
    label: periodLabel(point.period, shownGranularity, false, range),
    value: point.orderCount,
    tooltip: `${periodLabel(point.period, shownGranularity, true, range)}: ${point.orderCount} order(s)`,
  }));
  const unitName = shownGranularity;

  return (
    <>
      {!durationMode && (
        <ReportFilterBar onClear={period.reset} active={!period.isDefault}>
          <PeriodFilter period={period} />
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
                  Orders - {data?.totalOrders ?? 0}
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

        <ReportPanel icon={<CelebrationIcon fontSize="small" />} title="Orders by Event Type">
          <BreakdownBarList
            items={(data?.byEventType ?? []).map((entry) => ({
              label: entry.eventTypeName,
              value: entry.orderCount,
              displayValue: String(entry.orderCount),
            }))}
          />
        </ReportPanel>
      </Box>
    </>
  );
}
