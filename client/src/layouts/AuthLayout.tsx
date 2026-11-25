import BoltIcon from '@mui/icons-material/Bolt';
import { Box, Paper, Typography } from '@mui/material';
import { Outlet } from 'react-router-dom';

// The company logo and name are only known once someone has signed in, so the login card carries the
// product's own name and the same gradient mark the sidebar shows for a company without a logo.
const APP_NAME = 'Event Management ERP';

export default function AuthLayout() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 4,
        background: 'linear-gradient(135deg, #0F172A 0%, #134E4A 55%, #059669 100%)',
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 420 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4.5 },
            borderRadius: 4,
            boxShadow: '0 24px 60px rgba(2, 6, 23, 0.45)',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3.5 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #14B8A6, #059669)',
                boxShadow: '0 8px 20px rgba(5, 150, 105, 0.35)',
                mb: 1.5,
              }}
            >
              <BoltIcon sx={{ color: '#FFFFFF', fontSize: 32 }} />
            </Box>
            <Typography component="p" sx={{ fontSize: '1.125rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
              {APP_NAME}
            </Typography>
          </Box>
          <Outlet />
        </Paper>
        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 2.5, color: 'rgba(255,255,255,0.7)' }}>
          © {new Date().getFullYear()} {APP_NAME}
        </Typography>
      </Box>
    </Box>
  );
}
