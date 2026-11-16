import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import { Box, ButtonBase, Stack, Typography } from '@mui/material';
import { useEffect, useState, type ReactNode } from 'react';

export interface FormNavSection {
  /** DOM id of the section's FormSection. */
  id: string;
  label: string;
  /** Marks the section as holding a validation error, so it can be found without scrolling. */
  hasError?: boolean;
  icon?: ReactNode;
}

interface FormSectionNavProps {
  sections: FormNavSection[];
  /** `vertical` is the sticky rail beside the form; `horizontal` is the chip bar used where the rail will not fit. */
  orientation: 'vertical' | 'horizontal';
}

/**
 * Which section is currently under the top of the viewport. The sections are plain DOM elements
 * (their ids), so this watches them with an IntersectionObserver instead of listening to scroll
 * events: a section counts as "current" while it crosses a band near the top of the screen.
 */
function useActiveSection(ids: string[]): [string | null, (id: string) => void] {
  const [active, setActive] = useState<string | null>(ids[0] ?? null);
  const key = ids.join('|');

  useEffect(() => {
    const visible = new Set<string>();
    let observer: IntersectionObserver | null = null;

    function observe() {
      observer?.disconnect();
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) visible.add(entry.target.id);
            else visible.delete(entry.target.id);
          }
          // The first visible section in page order wins; with none in the band, keep the last one.
          const current = ids.find((id) => visible.has(id));
          if (current) setActive(current);
        },
        { rootMargin: '-96px 0px -55% 0px', threshold: 0 },
      );
      for (const id of ids) {
        const element = document.getElementById(id);
        if (element) observer.observe(element);
      }
    }

    observe();
    // Some sections mount a moment after the page does (their data is still loading) — look again.
    const retry = window.setTimeout(observe, 600);
    return () => {
      window.clearTimeout(retry);
      observer?.disconnect();
    };
    // `key` stands in for `ids`, whose identity changes on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [active, setActive];
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function FormSectionNav({ sections, orientation }: FormSectionNavProps) {
  const [active, setActive] = useActiveSection(sections.map((section) => section.id));

  function go(id: string) {
    setActive(id);
    scrollToSection(id);
  }

  const tint = (theme: { vars?: { palette: { primary: { main: string } } }; palette: { primary: { main: string } } }) =>
    `color-mix(in srgb, ${(theme.vars ?? theme).palette.primary.main} 10%, transparent)`;

  if (orientation === 'horizontal') {
    return (
      <Stack
        component="nav"
        aria-label="Form sections"
        direction="row"
        spacing={1}
        sx={{ overflowX: 'auto', pb: 0.5, mb: 2.5, '&::-webkit-scrollbar': { display: 'none' } }}
      >
        {sections.map((section, index) => {
          const isActive = section.id === active;
          return (
            <ButtonBase
              key={section.id}
              onClick={() => go(section.id)}
              aria-current={isActive ? 'step' : undefined}
              sx={(theme) => ({
                flexShrink: 0,
                gap: 1,
                px: 1.5,
                py: 0.75,
                borderRadius: 999,
                border: 1,
                borderColor: section.hasError ? 'error.main' : isActive ? 'primary.main' : 'divider',
                color: section.hasError ? 'error.main' : isActive ? 'primary.main' : 'text.secondary',
                backgroundColor: isActive ? tint(theme) : 'transparent',
                fontSize: '0.8125rem',
                fontWeight: isActive ? 700 : 500,
              })}
            >
              <Box component="span" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                {index + 1}
              </Box>
              {section.label}
            </ButtonBase>
          );
        })}
      </Stack>
    );
  }

  return (
    <Stack component="nav" aria-label="Form sections" spacing={0.5}>
      <Typography
        variant="caption"
        sx={{ px: 1.5, mb: 0.75, letterSpacing: '0.08em', fontWeight: 700, color: 'text.disabled' }}
      >
        SECTIONS
      </Typography>
      {sections.map((section, index) => {
        const isActive = section.id === active;
        return (
          <ButtonBase
            key={section.id}
            onClick={() => go(section.id)}
            aria-current={isActive ? 'step' : undefined}
            sx={(theme) => ({
              justifyContent: 'flex-start',
              gap: 1.5,
              px: 1.5,
              py: 1.1,
              borderRadius: '12px',
              textAlign: 'left',
              color: section.hasError ? 'error.main' : isActive ? 'primary.main' : 'text.secondary',
              backgroundColor: isActive ? tint(theme) : 'transparent',
              transition: 'background-color 150ms ease, color 150ms ease',
              '&:hover': { backgroundColor: isActive ? tint(theme) : 'action.hover' },
            })}
          >
            <Box
              component="span"
              sx={{
                width: 26,
                height: 26,
                flexShrink: 0,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
                border: 1.5,
                borderColor: section.hasError ? 'error.main' : isActive ? 'primary.main' : 'divider',
                color: isActive && !section.hasError ? 'primary.contrastText' : 'inherit',
                backgroundColor: isActive && !section.hasError ? 'primary.main' : 'transparent',
              }}
            >
              {section.hasError ? <ErrorOutlinedIcon sx={{ fontSize: 16 }} /> : index + 1}
            </Box>
            <Typography variant="body2" sx={{ fontWeight: isActive ? 700 : 500, color: 'inherit' }}>
              {section.label}
            </Typography>
          </ButtonBase>
        );
      })}
    </Stack>
  );
}
