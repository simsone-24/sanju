import { Box, Typography } from '@mui/material';

interface ProgressDonutProps {
  /** 0–100. Values outside the range are clamped rather than drawn past the ring. */
  percent: number;
  /** Names what the ring measures — the figure alone is never enough. */
  caption: string;
  tone?: 'success' | 'primary' | 'warning';
  size?: number;
}

const VIEWBOX = 128;
const RADIUS = 54;
const STROKE = 12;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * A single proportion drawn as a ring with the figure in the middle.
 *
 * One series, so there is no legend: the centre label names it directly. The remainder is a
 * recessive track rather than a second colour, and the arc keeps a rounded end so a small
 * percentage still reads as a mark instead of a hairline.
 */
export function ProgressDonut({ percent, caption, tone = 'success', size = 128 }: ProgressDonutProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(percent)));
  const arc = (clamped / 100) * CIRCUMFERENCE;

  return (
    <Box
      role="img"
      aria-label={`${clamped}% ${caption}`}
      sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}
    >
      <Box
        component="svg"
        aria-hidden
        viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
        sx={(theme) => ({
          width: '100%',
          height: '100%',
          '& .donut-track': { stroke: (theme.vars ?? theme).palette.action.hover },
          '& .donut-arc': { stroke: (theme.vars ?? theme).palette[tone].main },
        })}
      >
        <circle
          className="donut-track"
          cx={VIEWBOX / 2}
          cy={VIEWBOX / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
        />
        {/* Nothing collected yet draws no arc at all — a rounded cap on a zero-length dash would
            still paint a dot, reading as progress that has not happened. */}
        {clamped > 0 && (
          <circle
            className="donut-arc"
            cx={VIEWBOX / 2}
            cy={VIEWBOX / 2}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={`${arc} ${CIRCUMFERENCE - arc}`}
            transform={`rotate(-90 ${VIEWBOX / 2} ${VIEWBOX / 2})`}
          />
        )}
      </Box>

      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="h3" component="div" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
          {clamped}%
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {caption}
        </Typography>
      </Box>
    </Box>
  );
}
