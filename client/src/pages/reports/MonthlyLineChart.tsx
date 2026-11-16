import { Box, Stack, Typography, useTheme } from '@mui/material';
import { niceMax } from './chartUtils';
import type { MonthlyBarPoint } from './MonthlyBarChart';

interface MonthlyLineChartProps {
  points: MonthlyBarPoint[];
  /** Name shown in the legend under the chart. */
  seriesName: string;
  /** Describes the chart for screen readers. */
  ariaLabel: string;
}

const WIDTH = 960;
const HEIGHT = 240;
const MARGIN = { top: 24, right: 28, bottom: 36, left: 92 };
const TICKS = 4;

// Indian digit grouping without a currency symbol (12,34,567) — the same grouping the rest of the
// app's amounts use, kept short enough to label every point.
const wholeNumber = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

interface Coordinate {
  x: number;
  y: number;
}

/**
 * Smooth path through the points using monotone cubic interpolation. Unlike a plain spline it never
 * overshoots between points, so the curve cannot dip below zero or past a month's real value.
 */
function smoothPath(coordinates: Coordinate[]): string {
  const count = coordinates.length;
  if (count === 0) return '';
  if (count === 1) return `M${coordinates[0].x},${coordinates[0].y}`;

  const slopes: number[] = [];
  for (let index = 0; index < count - 1; index += 1) {
    const dx = coordinates[index + 1].x - coordinates[index].x;
    slopes.push((coordinates[index + 1].y - coordinates[index].y) / dx);
  }

  const tangents: number[] = [slopes[0]];
  for (let index = 1; index < count - 1; index += 1) {
    tangents.push(slopes[index - 1] * slopes[index] <= 0 ? 0 : (slopes[index - 1] + slopes[index]) / 2);
  }
  tangents.push(slopes[count - 2]);

  for (let index = 0; index < count - 1; index += 1) {
    if (slopes[index] === 0) {
      tangents[index] = 0;
      tangents[index + 1] = 0;
      continue;
    }
    const a = tangents[index] / slopes[index];
    const b = tangents[index + 1] / slopes[index];
    const magnitude = Math.hypot(a, b);
    if (magnitude > 3) {
      tangents[index] = (3 * a * slopes[index]) / magnitude;
      tangents[index + 1] = (3 * b * slopes[index]) / magnitude;
    }
  }

  let path = `M${coordinates[0].x},${coordinates[0].y}`;
  for (let index = 0; index < count - 1; index += 1) {
    const from = coordinates[index];
    const to = coordinates[index + 1];
    const third = (to.x - from.x) / 3;
    path += ` C${from.x + third},${from.y + tangents[index] * third} ${to.x - third},${to.y - tangents[index + 1] * third} ${to.x},${to.y}`;
  }
  return path;
}

/**
 * A smooth line graph of one measure over time: hollow markers, the value written above each point,
 * dashed vertical gridlines per month and a legend. Plain SVG — no charting library is installed.
 * Each point also carries a hover tooltip with the full detail.
 */
export function MonthlyLineChart({ points, seriesName, ariaLabel }: MonthlyLineChartProps) {
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
  const labelEvery = Math.ceil(points.length / 14);
  const ink = theme.palette.text.secondary;
  const grid = theme.palette.divider;
  const color = theme.palette.error.main;

  const x = (index: number) =>
    points.length === 1 ? MARGIN.left + plotWidth / 2 : MARGIN.left + (plotWidth / (points.length - 1)) * index;
  const y = (value: number) => MARGIN.top + plotHeight - (value / axisMax) * plotHeight;
  const baseline = MARGIN.top + plotHeight;
  const coordinates = points.map((point, index) => ({ x: x(index), y: y(point.value) }));

  return (
    <Box>
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
            <text key={index} x={MARGIN.left - 12} y={y(value)} textAnchor="end" dominantBaseline="middle" fontSize={12} fill={ink}>
              {wholeNumber.format(value)}
            </text>
          );
        })}

        {/* Dashed vertical guides, one per month, and the two axes. */}
        {points.map((point, index) => (
          <line
            key={`guide-${point.label}-${index}`}
            x1={x(index)}
            x2={x(index)}
            y1={MARGIN.top}
            y2={baseline}
            stroke={grid}
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        ))}
        <line x1={MARGIN.left} x2={MARGIN.left} y1={MARGIN.top} y2={baseline} stroke={ink} strokeWidth={1} />
        <line x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={baseline} y2={baseline} stroke={ink} strokeWidth={1} />

        {points.length > 1 && (
          <path d={smoothPath(coordinates)} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
        )}

        {points.map((point, index) => (
          <g key={`${point.label}-${index}`}>
            <title>{point.tooltip}</title>
            {/* A wider invisible target keeps the tooltip easy to hit on a thin line. */}
            <circle cx={x(index)} cy={y(point.value)} r={14} fill="transparent" />
            <circle
              cx={x(index)}
              cy={y(point.value)}
              r={4.5}
              fill={theme.palette.background.paper}
              stroke={color}
              strokeWidth={2.5}
            />
            {index % labelEvery === 0 && (
              <>
                <text
                  x={x(index)}
                  y={y(point.value) - 12}
                  textAnchor="middle"
                  fontSize={12}
                  fill={ink}
                  stroke={theme.palette.background.paper}
                  strokeWidth={3}
                  paintOrder="stroke"
                >
                  {wholeNumber.format(point.value)}
                </text>
                <text x={x(index)} y={baseline + 22} textAnchor="middle" fontSize={12} fill={ink}>
                  {point.label}
                </text>
              </>
            )}
          </g>
        ))}
      </Box>

      <Stack direction="row" spacing={1} sx={{ justifyContent: 'center', alignItems: 'center', mt: 1 }}>
        <Box component="svg" viewBox="0 0 28 12" sx={{ width: 28, height: 12 }} aria-hidden>
          <line x1={0} x2={28} y1={6} y2={6} stroke={color} strokeWidth={2.5} />
          <circle cx={14} cy={6} r={4} fill={theme.palette.background.paper} stroke={color} strokeWidth={2.5} />
        </Box>
        <Typography variant="body2" sx={{ color }}>
          {seriesName}
        </Typography>
      </Stack>
    </Box>
  );
}
