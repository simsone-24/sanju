import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DateRangeIcon from '@mui/icons-material/DateRange';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import ScheduleIcon from '@mui/icons-material/Schedule';
import TodayIcon from '@mui/icons-material/Today';
import UpcomingIcon from '@mui/icons-material/Upcoming';
import { Box } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { useAuth } from '../hooks/useAuth';
import * as calendarService from '../services/calendarService';
import * as enquiryService from '../services/enquiryService';
import * as reportService from '../services/reportService';
import { startOfWeekMonday } from './calendar/weekUtils';

// docs/03_MODULES.md §2 (Dashboard Widgets) and docs/06_UI_UX_GUIDELINES.md §6 (Dashboard
// Layout). No backend /dashboard endpoint exists — every tile here is assembled client-side from
// the Calendar/Enquiries/Reports endpoints already built, each with its own small query (limit=10
// is the server's minimum allowed page size, server/src/utils/pagination.ts's ALLOWED_LIMITS —
// only the count in meta.totalRecords/summary is read, never the records themselves).
export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const today = dayjs().format('YYYY-MM-DD');
  const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');

  const { data: todayEvents, isLoading: todayEventsLoading } = useQuery({
    queryKey: ['dashboard', 'today-events', today],
    queryFn: () => calendarService.getDay(today),
  });

  const { data: tomorrowEvents, isLoading: tomorrowEventsLoading } = useQuery({
    queryKey: ['dashboard', 'tomorrow-events', tomorrow],
    queryFn: () => calendarService.getDay(tomorrow),
  });

  // Week/month event counts come from the same calendar endpoints the Calendar page's Week and
  // Month views use, so each tile's number is exactly the number of events its drill-down shows.
  // Weeks run Monday–Sunday (server/src/modules/calendar/service.ts's getWeekRange).
  const weekStart = startOfWeekMonday(dayjs());
  const weekEnd = weekStart.add(6, 'day');
  const monthReference = dayjs().startOf('month');

  const { data: weekEvents, isLoading: weekEventsLoading } = useQuery({
    queryKey: ['dashboard', 'week-events', weekStart.format('YYYY-MM-DD')],
    queryFn: () => calendarService.getWeek(today),
  });

  const { data: monthEvents, isLoading: monthEventsLoading } = useQuery({
    queryKey: ['dashboard', 'month-events', monthReference.format('YYYY-MM')],
    queryFn: () => calendarService.getMonth(monthReference.month() + 1, monthReference.year()),
  });

  // Every event dated today or later, with no upper bound.
  const { data: allUpcomingEvents, isLoading: allUpcomingEventsLoading } = useQuery({
    queryKey: ['dashboard', 'upcoming-events-all', today],
    queryFn: () => reportService.getEvents({ page: 1, limit: 10, dateFrom: today }),
  });

  // Appointments are enquiries whose appointmentDate falls on the day — narrowed server-side by
  // the appointmentDateFrom/To filters, so the count is the server's own totalRecords and matches
  // exactly what the tile's /enquiries?apptFrom=…&apptTo=… drill-down lists.
  const { data: todayAppointments, isLoading: todayAppointmentsLoading } = useQuery({
    queryKey: ['dashboard', 'appointments', today],
    queryFn: () =>
      enquiryService.list({ page: 1, limit: 10, appointmentDateFrom: today, appointmentDateTo: today }),
  });

  const { data: tomorrowAppointments, isLoading: tomorrowAppointmentsLoading } = useQuery({
    queryKey: ['dashboard', 'appointments', tomorrow],
    queryFn: () =>
      enquiryService.list({ page: 1, limit: 10, appointmentDateFrom: tomorrow, appointmentDateTo: tomorrow }),
  });

  return (
    <Box>
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${user?.fullName}. ${user?.userGroup.groupName} · ${user?.company.companyName}`}
        breadcrumbs={[{ label: 'Dashboard' }]}
      />

      {/* Event and appointment counts at a glance. Each tile drills into the records behind its
          number: events open the calendar view covering that period (or the Events report for the
          open-ended upcoming count), appointments open the Enquiry list filtered to the same
          appointment-date range the count was computed from. */}
      <Box
        sx={{
          display: 'grid',
          // Capped at four tiles per row — seven across one line squeezes each card too narrow for
          // its label and dated subtext, so the row wraps to 4 + 3 on wide screens.
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(3, 1fr)', xl: 'repeat(4, 1fr)' },
          gap: 2,
        }}
      >
        <StatCard
          label="Today's Events"
          value={todayEvents?.length ?? 0}
          subtext={dayjs(today).format('ddd, D MMM YYYY')}
          icon={<TodayIcon />}
          tone="blue"
          loading={todayEventsLoading}
          onClick={() => navigate(`/calendar?view=day&date=${today}`)}
        />
        <StatCard
          label="Tomorrow's Events"
          value={tomorrowEvents?.length ?? 0}
          subtext={dayjs(tomorrow).format('ddd, D MMM YYYY')}
          icon={<EventRepeatIcon />}
          tone="cyan"
          loading={tomorrowEventsLoading}
          onClick={() => navigate(`/calendar?view=day&date=${tomorrow}`)}
        />
        <StatCard
          label="Events This Week"
          value={weekEvents?.length ?? 0}
          subtext={`${weekStart.format('D MMM')} – ${weekEnd.format('D MMM YYYY')}`}
          icon={<DateRangeIcon />}
          tone="green"
          loading={weekEventsLoading}
          onClick={() => navigate(`/calendar?view=week&date=${today}`)}
        />
        <StatCard
          label="Events This Month"
          value={monthEvents?.length ?? 0}
          subtext={monthReference.format('MMMM YYYY')}
          icon={<CalendarMonthIcon />}
          tone="slate"
          loading={monthEventsLoading}
          onClick={() => navigate(`/calendar?view=month&date=${today}`)}
        />
        <StatCard
          label="Upcoming Events"
          value={allUpcomingEvents?.summary.totalEvents ?? 0}
          subtext="All future dates"
          icon={<UpcomingIcon />}
          tone="orange"
          loading={allUpcomingEventsLoading}
          onClick={() => navigate(`/reports?tab=events&from=${today}`)}
        />
        <StatCard
          label="Today's Appointments"
          value={todayAppointments?.meta.totalRecords ?? 0}
          subtext={dayjs(today).format('ddd, D MMM YYYY')}
          icon={<PendingActionsIcon />}
          tone="violet"
          loading={todayAppointmentsLoading}
          onClick={() => navigate(`/enquiries?apptFrom=${today}&apptTo=${today}`)}
        />
        <StatCard
          label="Tomorrow's Appointments"
          value={tomorrowAppointments?.meta.totalRecords ?? 0}
          subtext={dayjs(tomorrow).format('ddd, D MMM YYYY')}
          icon={<ScheduleIcon />}
          tone="amber"
          loading={tomorrowAppointmentsLoading}
          onClick={() => navigate(`/enquiries?apptFrom=${tomorrow}&apptTo=${tomorrow}`)}
        />
      </Box>
    </Box>
  );
}
