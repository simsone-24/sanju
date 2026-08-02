import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import StorageIcon from '@mui/icons-material/Storage';
import { Box, Paper, Stack, Typography } from '@mui/material';
import type { ReactElement } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import CompanyInfoTab from './tabs/CompanyInfoTab';
import EventTypesTab from './tabs/EventTypesTab';
import UserGroupsTab from './tabs/UserGroupsTab';
import UsersTab from './tabs/UsersTab';

// masters/user.md v1.1 replaces the Roles master with User Groups and drops Task Templates from
// Masters (they move to the Order module). Event Types and Company Information stay: an enquiry
// cannot be raised without an event type, and Company Information is the only screen for the
// branding and banking details every quotation prints.
//
// The card-grid landing (styled after the reference "Master Data" screen) gives each master its own
// card, reusing the same `?tab=` keys the rest of the app already deep-links to.
interface MasterEntry {
  key: string;
  label: string;
  description: string;
  content: ReactElement;
}

const MASTERS: MasterEntry[] = [
  {
    key: 'user-groups',
    label: 'User Groups',
    description: 'Groups and their permissions',
    content: <UserGroupsTab />,
  },
  { key: 'users', label: 'Users', description: 'Application user accounts', content: <UsersTab /> },
  { key: 'event-types', label: 'Event Types', description: 'Types of events offered', content: <EventTypesTab /> },
  { key: 'company', label: 'Company Information', description: 'Organisation profile details', content: <CompanyInfoTab /> },
];

function MasterCard({ master }: { master: MasterEntry }) {
  return (
    <Paper
      variant="outlined"
      component={RouterLink}
      to={`?tab=${master.key}`}
      sx={{
        p: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        textDecoration: 'none',
        color: 'text.primary',
        transition: 'border-color 150ms ease, box-shadow 150ms ease',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.12)',
        },
        '&:hover .master-card-icon': {
          bgcolor: 'primary.main',
          color: 'common.white',
        },
        '&:hover .master-card-label': { color: 'primary.main' },
      }}
    >
      <Box
        className="master-card-icon"
        sx={{
          width: 40,
          height: 40,
          borderRadius: 2,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(37, 99, 235, 0.1)',
          color: 'primary.main',
          transition: 'background-color 150ms ease, color 150ms ease',
        }}
      >
        <StorageIcon fontSize="small" />
      </Box>
      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <Typography className="master-card-label" variant="body1" sx={{ fontWeight: 600, lineHeight: 1.3 }} noWrap>
          {master.label}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
          {master.description}
        </Typography>
      </Box>
      <ChevronRightIcon sx={{ color: 'text.secondary', flexShrink: 0 }} />
    </Paper>
  );
}

export default function MastersPage() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab');
  const activeMaster = MASTERS.find((master) => master.key === tab);

  if (activeMaster) {
    return (
      <Box>
        <PageHeader
          title={activeMaster.label}
          subtitle={activeMaster.description}
          breadcrumbs={[
            { label: 'Dashboard', to: '/' },
            { label: 'Master Data', to: '/masters' },
            { label: activeMaster.label },
          ]}
        />
        {activeMaster.content}
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 4 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(37, 99, 235, 0.1)',
            color: 'primary.main',
          }}
        >
          <StorageIcon />
        </Box>
        <Box>
          <Typography variant="h1">Master Data</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage reference data used across the application
          </Typography>
        </Box>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(4, 1fr)',
          },
        }}
      >
        {MASTERS.map((master) => (
          <MasterCard key={master.key} master={master} />
        ))}
      </Box>
    </Box>
  );
}
