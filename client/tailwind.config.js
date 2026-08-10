
/** @type {import('tailwindcss').Config} */

// Tailwind runs ALONGSIDE Material UI, not instead of it — the app's 58 MUI files and its
// theme.ts remain the primary styling system. Two settings keep the two from colliding:
//
// 1. `preflight: false` — Tailwind's CSS reset would otherwise fight MUI's <CssBaseline>,
//    silently restyling every button, heading, and form control in the app.
// 2. `prefix: 'tw-'` — every utility is namespaced (tw-flex, tw-gap-4), so a Tailwind class
//    can never accidentally match or override an MUI/emotion-generated class name.
//
// Colors mirror theme.ts's palette so the two systems can't drift; darkMode targets the same
// `class="dark"` that MUI's `colorSchemeSelector: 'class'` stamps on <html>.
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  prefix: 'tw-',
  // MUI's `colorSchemeSelector: 'class'` stamps a plain `class="dark"` on <html>, so Tailwind's
  // `dark:` variant must key off that same class. It's matched with an ATTRIBUTE selector rather
  // than `.dark` on purpose: `prefix` below rewrites every `.class` token it sees — including ones
  // written into a variant selector — so `.dark` silently becomes `.tw-dark` and never matches.
  // `[class~="dark"]` has no class token to rewrite, so it survives prefixing intact.
  darkMode: ['class', '[class~="dark"]'],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2563EB',
          dark: '#1D4ED8',
          light: '#3B82F6',
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#64748B',
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#EEF2FB',
          dark: '#1E293B',
          'dark-muted': '#0F172A',
        },
        ink: {
          DEFAULT: '#111827',
          muted: '#6B7280',
          'dark': '#F1F5F9',
          'dark-muted': '#94A3B8',
        },
        hairline: {
          DEFAULT: '#E5E7EB',
          dark: '#334155',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        control: '12px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04)',
        lifted: '0 12px 32px -12px rgba(15, 23, 42, 0.18)',
      },
    },
  },
  plugins: [],
};
