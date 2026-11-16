import { Box, Stack, Typography, useTheme } from '@mui/material';

export interface DonutSlice {
  label: string;
  value: number;
  /** Formatted amount shown in the legend and tooltip. */
  displayValue: string;
}

interface DonutChartProps {
  slices: DonutSlice[];
  /** Text drawn in the middle of the ring, e.g. the formatted grand total. */
  centerLabel: string;
  centerCaption: string;
  ariaLabel: string;
  /** Slices beyond this many are folded into one "Other" slice so the legend stays readable. */
  maxSlices?: number;
}

const SIZE = 200;
const RADIUS = 76;
const STROKE = 30;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Colour carries identity here (which category), so slices take distinct hues; the order is fixed
// so a category keeps its colour while the filters change the amounts.
const SLICE_COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2'];
const OTHER_COLOR = '#94a3b8';

/**
 * A donut showing how a total splits across categories. Drawn with stroked circles (one dash per
 * slice), which — unlike arc paths — also renders a single 100% slice. The legend repeats every
 * name, amount and share, so the colours never have to be decoded from the ring alone.
 */
export function DonutChart({ slices, centerLabel, centerCaption, ariaLabel, maxSlices = 6 }: DonutChartProps) {
  const theme = useTheme();

  const positive = slices.filter((slice) => slice.value > 0).sort((a, b) => b.value - a.value);
  if (positive.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No data for the selected filters.
      </Typography>
    );
  }

  const shown = positive.slice(0, maxSlices);
  const rest = positive.slice(maxSlices);
  const entries = [
    ...shown.map((slice, index) => ({ ...slice, color: SLICE_COLORS[index % SLICE_COLORS.length] })),
    ...(rest.length > 0
      ? [
          {
            label: `Other (${rest.length})`,
            value: rest.reduce((sum, slice) => sum + slice.value, 0),
            displayValue: '',
            color: OTHER_COLOR,
          },
        ]
      : []),
  ];
  const total = entries.reduce((sum, entry) => sum + entry.value, 0);

  let consumed = 0;
  const arcs = entries.map((entry) => {
    const length = (entry.value / total) * CIRCUMFERENCE;
    const arc = { ...entry, length, offset: -consumed };
    consumed += length;
    return arc;
  });

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={3}
      sx={{ alignItems: 'center', justifyContent: 'center' }}
    >
      <Box component="svg" viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={ariaLabel} sx={{ width: 160, flexShrink: 0 }}>
        <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
          {arcs.map((arc) => (
            <circle
              key={arc.label}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={arc.color}
              strokeWidth={STROKE}
              strokeDasharray={`${arc.length} ${CIRCUMFERENCE - arc.length}`}
              strokeDashoffset={arc.offset}
            >
              <title>{`${arc.label}: ${arc.displayValue || Math.round((arc.value / total) * 100) + '%'}`}</title>
            </circle>
          ))}
        </g>
        <text
          x={SIZE / 2}
          y={SIZE / 2 - 4}
          textAnchor="middle"
          fontSize={15}
          fontWeight={700}
          fill={theme.palette.text.primary}
        >
          {centerLabel}
        </text>
        <text x={SIZE / 2} y={SIZE / 2 + 14} textAnchor="middle" fontSize={11} fill={theme.palette.text.secondary}>
          {centerCaption}
        </text>
      </Box>

      <Stack spacing={1} sx={{ minWidth: 0, flex: 1, width: '100%' }}>
        {arcs.map((arc) => (
          <Stack key={arc.label} direction="row" spacing={1.25} sx={{ alignItems: 'center', minWidth: 0 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '3px', bgcolor: arc.color, flexShrink: 0 }} />
            <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0, fontWeight: 600 }}>
              {arc.label}
            </Typography>
            <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
              {Math.round((arc.value / total) * 100)}%
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}
