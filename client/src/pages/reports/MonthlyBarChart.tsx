import { Box, Typography, useTheme } from '@mui/material';
import { compactNumber, niceMax } from './chartUtils';

export interface MonthlyBarPoint {
  /** Short axis label, e.g. "Aug 26". */
  label: string;
  value: number;
  /** Full text shown on hover, e.g. "August 2026: ₹12,000". */
  tooltip: string;
}

interface MonthlyBarChartProps {
  points: MonthlyBarPoint[];
  /** Describes the chart for screen readers. */
  ariaLabel: string;
}

const WIDTH = 720;
const HEIGHT = 200;
const MARGIN = { top: 16, right: 12, bottom: 36, left: 56 };
const TICKS = 4;

/**
 * A vertical bar chart of one measure over time. No charting library is installed in this app (see
 * BreakdownBarList), so this is plain SVG: it scales to its container, labels the axes, thins the
 * month labels when there are many, and gives every bar a hover tooltip. One measure, so one hue.
 */
export function MonthlyBarChart({ points, ariaLabel }: MonthlyBarChartProps) {
  const theme = useTheme();

  if (points.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No data for the selected filters.
      </Typography>
    );
  }

  const plotWidth = WIDTH - MARGIN.left - MARGIN.right;
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const axisMax = niceMax(Math.max(...points.map((point) => point.value)));
  const slot = plotWidth / points.length;
  const barWidth = Math.min(48, slot * 0.62);
  const labelEvery = Math.ceil(points.length / 12);
  const ink = theme.palette.text.secondary;
  const y = (value: number) => MARGIN.top + plotHeight - (value / axisMax) * plotHeight;

  return (
    <Box
      component="svg"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={ariaLabel}
      sx={{ width: '100%', height: 'auto', display: 'block' }}
    >
      {Array.from({ length: TICKS + 1 }, (_, index) => {
        const value = (axisMax / TICKS) * index;
        return (
          <g key={index}>
            <line
              x1={MARGIN.left}
              x2={WIDTH - MARGIN.right}
              y1={y(value)}
              y2={y(value)}
              stroke={theme.palette.divider}
              strokeWidth={1}
            />
            <text x={MARGIN.left - 8} y={y(value)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill={ink}>
              {compactNumber.format(value)}
            </text>
          </g>
        );
      })}

      {points.map((point, index) => {
        const x = MARGIN.left + slot * index + (slot - barWidth) / 2;
        const height = Math.max((point.value / axisMax) * plotHeight, point.value > 0 ? 2 : 0);
        return (
          <g key={`${point.label}-${index}`}>
            <title>{point.tooltip}</title>
            <rect
              x={x}
              y={MARGIN.top + plotHeight - height}
              width={barWidth}
              height={height}
              rx={3}
              fill={theme.palette.primary.main}
            />
            {index % labelEvery === 0 && (
              <text x={x + barWidth / 2} y={HEIGHT - MARGIN.bottom + 18} textAnchor="middle" fontSize={11} fill={ink}>
                {point.label}
              </text>
            )}
          </g>
        );
      })}
    </Box>
  );
}
