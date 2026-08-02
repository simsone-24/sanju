import BoltIcon from '@mui/icons-material/Bolt';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import LightModeIcon from '@mui/icons-material/LightMode';
import ListAltIcon from '@mui/icons-material/ListAlt';
import LogoutIcon from '@mui/icons-material/Logout';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PaymentsIcon from '@mui/icons-material/Payments';
import PeopleIcon from '@mui/icons-material/People';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SecurityIcon from '@mui/icons-material/Security';
import SettingsIcon from '@mui/icons-material/Settings';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Avatar,
  Box,
  ButtonBase,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Switch,
  Tooltip,
  Typography,
} from '@mui/material';
import { useColorScheme } from '@mui/material/styles';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth, useLogout } from '../hooks/useAuth';
import { hasPermission, type ModuleName } from '../hooks/usePermission';
import { useAuthStore } from '../store/authStore';

const DRAWER_WIDTH_EXPANDED = 260;
const DRAWER_WIDTH_COLLAPSED = 72;

// Sidebar is a fixed dark-navy brand surface, independent of the app's light/dark mode toggle
// (which only affects the main content area) — colors here are hardcoded, not theme tokens.
const SIDEBAR_BG = '#0B1330';
const SIDEBAR_BORDER = 'rgba(255, 255, 255, 0.08)';
const SIDEBAR_TEXT = '#E2E8F5';
const SIDEBAR_TEXT_MUTED = '#8B95B3';
const SIDEBAR_SELECTED_BG = 'rgba(59, 130, 246, 0.18)';
const SIDEBAR_HOVER_BG = 'rgba(255, 255, 255, 0.06)';

// Decorative rotated-square accents scattered across the sidebar background, purely
// atmospheric — matches the reference brand mock's faint geometric pattern.
const SIDEBAR_DECORATIONS = [
  { top: '6%', left: '70%', size: 70, opacity: 0.05 },
  { top: '28%', left: '10%', size: 40, opacity: 0.06 },
  { top: '52%', left: '78%', size: 55, opacity: 0.05 },
  { top: '78%', left: '18%', size: 90, opacity: 0.04 },
];

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  module: ModuleName;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    items: [{ label: 'Dashboard', path: '/', icon: <DashboardIcon />, module: 'DASHBOARD' }],
  },
  {
    title: 'OPERATIONS',
    items: [
      { label: 'Enquiries', path: '/enquiries', icon: <ListAltIcon />, module: 'ENQUIRIES' },
      { label: 'Quotations', path: '/quotations', icon: <RequestQuoteIcon />, module: 'QUOTATIONS' },
      { label: 'Orders', path: '/orders', icon: <Inventory2Icon />, module: 'ORDERS' },
      { label: 'Payment Tracker', path: '/payment-tracker', icon: <PaymentsIcon />, module: 'PAYMENTS' },
      { label: 'Calendar', path: '/calendar', icon: <CalendarMonthIcon />, module: 'CALENDAR' },
    ],
  },
  {
    title: 'MANAGEMENT',
    items: [{ label: 'Customers', path: '/customers', icon: <PeopleIcon />, module: 'CUSTOMERS' }],
  },
  {
    title: 'ADMINISTRATION',
    items: [
      { label: 'Reports', path: '/reports', icon: <AssessmentIcon />, module: 'REPORTS' },
      { label: 'Masters', path: '/masters', icon: <SettingsIcon />, module: 'MASTERS' },
      { label: 'Users', path: '/masters?tab=users', icon: <PeopleIcon />, module: 'MASTERS' },
      { label: 'User Groups', path: '/masters?tab=user-groups', icon: <SecurityIcon />, module: 'MASTERS' },
    ],
  },
];

export default function AppLayout() {
  const { user } = useAuth();
  const permissions = useAuthStore((state) => state.user?.permissions);
  const logoutMutation = useLogout();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [accountOpen, setAccountOpen] = useState(true);
  const { mode, systemMode, setMode } = useColorScheme();

  const drawerWidth = collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH_EXPANDED;
  const isDarkMode = (mode === 'system' ? systemMode : mode) === 'dark';

  function toggleColorScheme() {
    setMode(isDarkMode ? 'light' : 'dark');
  }

  const isItemActive = (item: NavItem): boolean => {
    if (item.path === '/') {
      return location.pathname === '/';
    }
    if (item.path.includes('?')) {
      const [path, query] = item.path.split('?');
      return location.pathname.startsWith(path) && location.search === `?${query}`;
    }
    return location.pathname.startsWith(item.path);
  };

  const filteredSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => hasPermission(permissions, item.module, 'canView')),
  })).filter((section) => section.items.length > 0);

  const userInitial = user?.fullName?.trim().charAt(0).toUpperCase() ?? '?';

  return (
    // The two class names are print hooks only (index.css @media print): the shell's 100vh flex
    // layout and the main pane's own scrollport both have to be neutralised so a printed page
    // starts at the paper's origin and is not clipped to one screen height.
    <Box className="app-shell" sx={{ display: 'flex', height: '100vh' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: SIDEBAR_BG,
            backgroundImage: 'radial-gradient(ellipse 600px 300px at top, rgba(59,130,246,0.15), transparent 70%)',
            borderRight: 'none',
            transition: 'width 0.3s ease',
          },
        }}
      >
        {/* Decorative background accents */}
        {SIDEBAR_DECORATIONS.map((deco, index) => (
          <Box
            key={index}
            sx={{
              position: 'absolute',
              top: deco.top,
              left: deco.left,
              width: deco.size,
              height: deco.size,
              border: '1px solid rgba(255,255,255,1)',
              opacity: deco.opacity,
              borderRadius: 2,
              transform: 'rotate(45deg)',
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* Header */}
        <Box sx={{ position: 'relative', p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              flexShrink: 0,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #14B8A6, #059669)',
            }}
          >
            <BoltIcon sx={{ color: '#FFFFFF', fontSize: 22 }} />
          </Box>
          {!collapsed && (
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, color: SIDEBAR_TEXT, fontSize: '1rem', lineHeight: 1.2 }} noWrap>
                Event ERP
              </Typography>
              <Typography sx={{ color: SIDEBAR_TEXT_MUTED, fontSize: '0.7rem' }} noWrap>
                Management Suite
              </Typography>
            </Box>
          )}
          <Tooltip title={collapsed ? 'Expand' : 'Collapse'}>
            <IconButton
              size="small"
              onClick={() => setCollapsed(!collapsed)}
              sx={{ color: SIDEBAR_TEXT_MUTED, flexShrink: 0, '&:hover': { backgroundColor: SIDEBAR_HOVER_BG } }}
            >
              {collapsed ? <ChevronRightIcon fontSize="small" /> : <CloseIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>

        <Divider sx={{ borderColor: SIDEBAR_BORDER, position: 'relative' }} />

        {/* Navigation */}
        <Box sx={{ position: 'relative', flex: 1, overflowY: 'auto' }}>
          {filteredSections.map((section, sectionIndex) => (
            <Box key={sectionIndex}>
              {section.title && !collapsed && (
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    px: 2,
                    py: 1.5,
                    fontWeight: 700,
                    color: SIDEBAR_TEXT_MUTED,
                    textTransform: 'uppercase',
                    fontSize: '0.7rem',
                    letterSpacing: 0.5,
                  }}
                >
                  {section.title}
                </Typography>
              )}
              <List disablePadding>
                {section.items.map((item) => {
                  const active = isItemActive(item);
                  return (
                    <Tooltip key={item.path} title={collapsed ? item.label : ''} placement="right">
                      <ListItemButton
                        selected={active}
                        onClick={() => navigate(item.path)}
                        sx={{
                          justifyContent: collapsed ? 'center' : 'flex-start',
                          px: collapsed ? 1.5 : 2,
                          mx: 1.5,
                          mb: 0.5,
                          borderRadius: 2.5,
                          width: 'auto',
                          color: active ? '#FFFFFF' : SIDEBAR_TEXT_MUTED,
                          backgroundColor: active ? SIDEBAR_SELECTED_BG : 'transparent',
                          transition: 'background-color 150ms ease, color 150ms ease',
                          '&:hover': {
                            backgroundColor: active ? SIDEBAR_SELECTED_BG : SIDEBAR_HOVER_BG,
                          },
                          '&.Mui-selected': {
                            backgroundColor: SIDEBAR_SELECTED_BG,
                          },
                          '&.Mui-selected:hover': {
                            backgroundColor: SIDEBAR_SELECTED_BG,
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: collapsed ? 0 : 40,
                            mr: collapsed ? 0 : 1,
                            color: active ? '#93C5FD' : SIDEBAR_TEXT_MUTED,
                          }}
                        >
                          {item.icon}
                        </ListItemIcon>
                        {!collapsed && <ListItemText primary={item.label} />}
                      </ListItemButton>
                    </Tooltip>
                  );
                })}
              </List>
            </Box>
          ))}
        </Box>

        <Divider sx={{ borderColor: SIDEBAR_BORDER, position: 'relative' }} />

        {/* Footer — the signed-in account and its actions read as one grouped panel rather than
            loose rows, so they sit apart from the navigation above. */}
        <Box sx={{ position: 'relative', p: 1.5 }}>
          <Box
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              backgroundColor: collapsed ? 'transparent' : 'rgba(255, 255, 255, 0.04)',
              border: collapsed ? 'none' : `1px solid ${SIDEBAR_BORDER}`,
            }}
          >
            <ButtonBase
              onClick={() => setAccountOpen((open) => !open)}
              aria-expanded={accountOpen}
              sx={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                justifyContent: collapsed ? 'center' : 'flex-start',
                px: collapsed ? 0 : 1.25,
                py: 1.25,
                '&:hover': { backgroundColor: SIDEBAR_HOVER_BG },
              }}
            >
              <Avatar sx={{ width: 34, height: 34, bgcolor: '#3B82F6', fontSize: '0.9rem' }}>{userInitial}</Avatar>
              {!collapsed && (
                <>
                  <Box sx={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <Typography
                      sx={{
                        fontWeight: 600,
                        color: SIDEBAR_TEXT,
                        fontSize: '0.85rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {user?.fullName}
                    </Typography>
                    <Typography
                      sx={{
                        color: SIDEBAR_TEXT_MUTED,
                        fontSize: '0.72rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {user?.userGroup?.groupName}
                    </Typography>
                  </Box>
                  <ExpandMoreIcon
                    fontSize="small"
                    sx={{
                      flexShrink: 0,
                      color: SIDEBAR_TEXT_MUTED,
                      transition: 'transform 200ms ease',
                      transform: accountOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                    }}
                  />
                </>
              )}
            </ButtonBase>

            <Collapse in={accountOpen || collapsed}>
              {/* Theme switch reads as a labelled preference here, not a bare icon toggle — the
                  label states which mode is active, matching the rest of the panel's rows. */}
              <ButtonBase
                onClick={toggleColorScheme}
                sx={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  px: collapsed ? 0 : 1.25,
                  py: 0.75,
                  color: SIDEBAR_TEXT_MUTED,
                  '&:hover': { backgroundColor: SIDEBAR_HOVER_BG, color: SIDEBAR_TEXT },
                }}
              >
                {isDarkMode ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
                {!collapsed && (
                  <>
                    <Typography sx={{ flex: 1, textAlign: 'left', fontSize: '0.85rem' }}>
                      {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                    </Typography>
                    {/* The switch mirrors the row's state; the whole row is the control, so it
                        must not take a second click of its own. */}
                    <Switch
                      size="small"
                      checked={!isDarkMode}
                      tabIndex={-1}
                      slotProps={{ input: { 'aria-hidden': true, tabIndex: -1 } }}
                      sx={{ pointerEvents: 'none', flexShrink: 0 }}
                    />
                  </>
                )}
              </ButtonBase>

              <ButtonBase
                onClick={() => logoutMutation.mutate()}
                sx={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  px: collapsed ? 0 : 1.25,
                  py: 1,
                  color: SIDEBAR_TEXT_MUTED,
                  '&:hover': { backgroundColor: SIDEBAR_HOVER_BG, color: SIDEBAR_TEXT },
                }}
              >
                <LogoutIcon fontSize="small" />
                {!collapsed && <Typography sx={{ fontSize: '0.85rem' }}>Sign out</Typography>}
              </ButtonBase>
            </Collapse>
          </Box>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        className="app-main"
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        {/* Faint decorative background pattern, purely atmospheric */}
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            left: `${drawerWidth}px`,
            pointerEvents: 'none',
            overflow: 'hidden',
            zIndex: 0,
            transition: 'left 0.3s ease',
          }}
        >
          {[
            { top: '8%', left: '85%', size: 60 },
            { top: '20%', left: '15%', size: 36 },
            { top: '45%', left: '92%', size: 48 },
            { top: '65%', left: '6%', size: 70 },
            { top: '85%', left: '78%', size: 40 },
          ].map((deco, index) => (
            <Box
              key={index}
              sx={{
                position: 'absolute',
                top: deco.top,
                left: deco.left,
                width: deco.size,
                height: deco.size,
                border: '1.5px dashed',
                borderColor: 'divider',
                opacity: 0.4,
                borderRadius: 2,
                transform: 'rotate(45deg)',
              }}
            />
          ))}
        </Box>

        <Box sx={{ position: 'relative', zIndex: 1, p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
