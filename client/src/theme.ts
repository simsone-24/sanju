import { createTheme } from '@mui/material/styles';
// Side-effect import only: augments MUI's `Components` theme type with the Pickers-specific
// component keys (MuiPickersOutlinedInput, etc.) used below so the date/time pickers' labels
// and borders can be themed the same way as every other outlined field.
import '@mui/x-date-pickers/themeAugmentation';

// Palette, typography, and component shapes per md files/UI-1.md (Modern UI/UX Design
// Guidelines) for light mode. Dark mode is a parallel palette using the same hues (Tailwind's
// "400" shades for accent colors, slate greys for surfaces) so both schemes read as the same
// product. Uses MUI's CSS-variables theming (colorSchemes + cssVariables) so palette tokens
// referenced via `theme.vars.palette.*` — or MUI's own internal `var(--mui-palette-*)` usage in
// unstyled components — automatically switch when the color scheme changes, no remount needed.
export const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'class',
  },
  colorSchemes: {
    light: {
      palette: {
        background: {
          default: '#EEF2FB',
          paper: '#FFFFFF',
        },
        primary: { main: '#2563EB', dark: '#1D4ED8' },
        secondary: { main: '#6B7280' },
        success: { main: '#10B981' },
        warning: { main: '#F59E0B' },
        error: { main: '#EF4444' },
        info: { main: '#64748B' },
        text: {
          primary: '#111827',
          secondary: '#6B7280',
        },
        divider: '#E5E7EB',
      },
    },
    dark: {
      palette: {
        background: {
          default: '#0F172A',
          paper: '#1E293B',
        },
        primary: { main: '#3B82F6', dark: '#2563EB' },
        secondary: { main: '#94A3B8' },
        success: { main: '#34D399' },
        warning: { main: '#FBBF24' },
        error: { main: '#F87171' },
        info: { main: '#94A3B8' },
        text: {
          primary: '#F1F5F9',
          secondary: '#94A3B8',
        },
        divider: '#334155',
      },
    },
  },
  typography: {
    fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif",
    h1: { fontSize: 32, fontWeight: 700, lineHeight: 1.5 },
    h2: { fontSize: 28, fontWeight: 700, lineHeight: 1.5 },
    h3: { fontSize: 24, fontWeight: 600, lineHeight: 1.5 },
    h4: { fontSize: 20, fontWeight: 600, lineHeight: 1.5 },
    body1: { fontSize: 16, lineHeight: 1.5 },
    body2: { fontSize: 14, lineHeight: 1.5 },
    button: { textTransform: 'none', fontWeight: 500 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
        outlined: ({ theme }) => ({
          borderRadius: 16,
          borderColor: theme.vars.palette.divider,
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
          ...theme.applyStyles('dark', {
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.4)',
          }),
        }),
        elevation: ({ theme }) => ({
          borderRadius: 16,
          boxShadow: '0 4px 16px rgba(15, 23, 42, 0.08)',
          ...theme.applyStyles('dark', {
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
          }),
        }),
      },
    },
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 16,
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
          ...theme.applyStyles('dark', {
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.4)',
          }),
        }),
      },
    },
    MuiToolbar: {
      styleOverrides: {
        regular: { minHeight: 72, '@media (min-width:600px)': { minHeight: 72 } },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: ({ theme }) => ({
          backgroundColor: theme.vars.palette.background.paper,
          borderRight: `1px solid ${theme.vars.palette.divider}`,
          borderRadius: 0,
        }),
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 12 },
        contained: { borderRadius: 999, paddingLeft: 20, paddingRight: 20 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 500 },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
      },
    },
    // md files/forms.md "Labels & Input Fields": labels must be a separate block above each
    // input, never crossing or sitting on the input's border line. MUI's outlined variant
    // normally floats the label so it overlaps the border (cut into it via a "notch"), which
    // also breaks once React Hook Form's `reset()` populates a field — `reset()` writes values
    // straight to the uncontrolled input's DOM ref, which never trips MUI's own "is this
    // filled?" check, so the label fails to shrink and renders on top of the value underneath.
    // Docking every label to `position: static` (falling into ordinary flex flow above the
    // input, ahead of it in the DOM) sidesteps both problems: labels are always fully separate
    // from the box, regardless of how the value got there.
    MuiInputLabel: {
      defaultProps: { shrink: true },
      styleOverrides: {
        root: {
          position: 'static',
          transform: 'none !important',
          maxWidth: 'none',
          marginBottom: 6,
          fontSize: '0.8125rem',
          fontWeight: 500,
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        // "Required fields should display a red '*' indicator."
        asterisk: ({ theme }) => ({ color: theme.vars.palette.error.main }),
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: { marginLeft: 2, fontSize: '0.75rem' },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          transition: 'box-shadow 150ms ease',
          '&.Mui-focused': {
            boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.12)',
            ...theme.applyStyles('dark', {
              boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.18)',
            }),
          },
        }),
        // md files/forms.md "Labels & Input Fields": consistent input height 48–52px. The
        // project defaults every TextField to size="small" (~40px stock), so bump vertical
        // padding here instead of per-field — 14px + the ~20px line-height lands at ~48px.
        input: { paddingTop: 14, paddingBottom: 14 },
        // The label no longer sits over the border, so the notch cut into it (reserved for a
        // floating label) has nothing left to frame — collapse it to keep the border an
        // unbroken rectangle.
        notchedOutline: { '& legend': { maxWidth: '0.01px !important' } },
      },
    },
    // Date/Time pickers render their own outlined input (PickersOutlinedInput) rather than
    // MuiOutlinedInput, but share the same MuiInputLabel — mirror the notch collapse here too.
    MuiPickersOutlinedInput: {
      styleOverrides: {
        notchedOutline: { '& legend': { maxWidth: '0.01px !important' } },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        // Generous vertical rhythm and a consistent divider colour on every cell so index
        // tables read as roomy, scannable rows rather than a dense grid — the default even for
        // the project's size="small" tables. A right-hand divider between every column (except
        // the last) turns the row-only dividers into a full grid.
        root: ({ theme }) => ({
          borderColor: theme.vars.palette.divider,
          paddingTop: 14,
          paddingBottom: 14,
          '&:not(:last-of-type)': {
            borderRight: `1px solid ${theme.vars.palette.divider}`,
          },
        }),
        head: ({ theme }) => ({
          backgroundColor: theme.vars.palette.background.default,
          fontWeight: 600,
          color: theme.vars.palette.text.secondary,
          textTransform: 'uppercase',
          fontSize: '0.7rem',
          letterSpacing: '0.05em',
          paddingTop: 12,
          paddingBottom: 12,
        }),
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: ({ theme }) => ({
          '&:hover': { backgroundColor: 'rgba(37, 99, 235, 0.04)' },
          ...theme.applyStyles('dark', {
            '&:hover': { backgroundColor: 'rgba(59, 130, 246, 0.08)' },
          }),
        }),
      },
    },
  },
});
