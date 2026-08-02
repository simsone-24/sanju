import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import { CssBaseline, ThemeProvider } from '@mui/material';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { theme } from './theme';

// Powers the "3 days ago" relative dates shown alongside absolute ones in list tables.
dayjs.extend(relativeTime);
// Required for dayjs(value, format) parsing — stored times come back as "10:30 AM" strings
// (enquiry appointment time) and filter dates as "YYYY-MM-DD". Without this plugin dayjs ignores
// the format argument entirely and falls back to Date parsing, which rejects both.
dayjs.extend(customParseFormat);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Sets the `class="dark"`/`class="light"` attribute on <html> before first paint, matching
        theme.ts's `colorSchemeSelector: 'class'`, so there's no flash of the wrong scheme.
        defaultMode="light" makes the app open white regardless of the OS's dark-mode preference —
        it only switches once the user explicitly clicks the theme toggle in the sidebar. */}
    <InitColorSchemeScript attribute="class" defaultMode="light" />
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme} defaultMode="light">
        <CssBaseline enableColorScheme />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <App />
        </LocalizationProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
);
