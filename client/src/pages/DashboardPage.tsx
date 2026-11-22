import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import BarChartIcon from '@mui/icons-material/BarChart';
import DateRangeIcon from '@mui/icons-material/DateRange';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import ScheduleIcon from '@mui/icons-material/Schedule';
import TodayIcon from '@mui/icons-material/Today';
import UpcomingIcon from '@mui/icons-material/Upcoming';
import { Box, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppTabs } from '../components/AppTabs';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { useAuth } from '../hooks/useAuth';
import { usePermission } from '../hooks/usePermission';
import * as calendarService from '../services/calendarService';
import * as enquiryService from '../services/enquiryService';
import * as reportService from '../services/reportService';
import { startOfWeekMonday } from './calendar/weekUtils';
import type { CalendarEvent } from '../types/calendar';
import type { OrderStatus } from '../types/order';
import DashboardEventSection from './dashboard/DashboardEventSection';
import { DashboardReports } from './dashboard/DashboardReports';

// An event is "pending" while its order is still open — not yet closed out or rejected.
const PENDING_EVENT_STATUSES: readonly OrderStatus[] = ['YET_TO_START', 'IN_PROGRESS'];

function countPendingEvents(events: CalendarEvent[] | undefined): number {
  return events?.filter((event) => PENDING_EVENT_STATUSES.includes(event.status)).length ?? 0;
}

// docs/03_MODULES.md §2 (Dashboard Widgets) and docs/06_UI_UX_GUIDELINES.md §6 (Dashboard
// Layout). No backend /dashboard endpoint exists — every tile here is assembled client-side from
// the Calendar/Enquiries/Reports endpoints already built, each with its own small query (limit=10
// is the server's minimum allowed page size, server/src/utils/pagination.ts's ALLOWED_LIMITS —
// only the count in meta.totalRecords/summary is read, never the records themselves).
export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  // The Reports tab shows order and expense graphs from the Reports endpoints; each needs its own
  // module's View permission as well as Dashboard Reports.
  const canViewReports = usePermission('DASHBOARD_REPORTS', 'canView');
  const canViewOrders = usePermission('ORDERS', 'canView');
  const canViewExpenses = usePermission('EXPENSES', 'canView');
  const showReportsTab = canViewReports && (canViewOrders || canViewExpenses);
  const [searchParams, setSearchParams] = useSearchParams();

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

  const nextWeekStart = weekStart.add(7, 'day');
  const nextWeekEnd = nextWeekStart.add(6, 'day');

  const { data: nextWeekEvents, isLoading: nextWeekEventsLoading } = useQuery({
    queryKey: ['dashboard', 'next-week-events', nextWeekStart.format('YYYY-MM-DD')],
    queryFn: () => calendarService.getWeek(nextWeekStart.format('YYYY-MM-DD')),
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

  // Pending appointments use the Enquiry list's own APPOINTMENT_PENDING group (appointment still
  // Pending or In Progress), so the number matches what the tile's drill-down lists.
  const { data: todayPendingAppointments, isLoading: todayPendingAppointmentsLoading } = useQuery({
    queryKey: ['dashboard', 'appointments-pending', today],
    queryFn: () =>
      enquiryService.list({
        page: 1,
        limit: 10,
        appointmentDateFrom: today,
        appointmentDateTo: today,
        statusGroup: 'APPOINTMENT_PENDING',
      }),
  });

  const { data: tomorrowPendingAppointments, isLoading: tomorrowPendingAppointmentsLoading } = useQuery({
    queryKey: ['dashboard', 'appointments-pending', tomorrow],
    queryFn: () =>
      enquiryService.list({
        page: 1,
        limit: 10,
        appointmentDateFrom: tomorrow,
        appointmentDateTo: tomorrow,
        statusGroup: 'APPOINTMENT_PENDING',
      }),
  });

  function handleEventClick(event: CalendarEvent) {
    navigate(`/orders/${event.id}`);
  }

  const overview = (
    <>
      {/* Event and appointment counts at a glance. Each tile drills into the records behind its
          number: events open the calendar view covering that period (or the Events report for the
          open-ended upcoming count), appointments open the Enquiry list filtered to the same
          appointment-date range the count was computed from. */}
      <Box
        sx={{
          display: 'grid',
          // Phones: two equal columns filling the width, so no card is stranded alone in a row.
          // From `sm` up each column is capped at 220px rather than stretching to fill the row, so
          // the cards stay narrow and as many fit per row as the screen allows.
          gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(auto-fill, minmax(170px, 220px))' },
          gap: { xs: 1, sm: 2 },
        }}
      >
        <StatCard
          label="Today's Events"
          value={countPendingEvents(todayEvents)}
          subtext={[`${todayEvents?.length ?? 0} total`, dayjs(today).format('ddd, D MMM YYYY')]}
          icon={<TodayIcon />}
          tone="blue"
          loading={todayEventsLoading}
          onClick={() => navigate(`/calendar?view=day&date=${today}`)}
        />
        <StatCard
          label="Tomorrow's Events"
          value={countPendingEvents(tomorrowEvents)}
          subtext={[`${tomorrowEvents?.length ?? 0} total`, dayjs(tomorrow).format('ddd, D MMM YYYY')]}
          icon={<EventRepeatIcon />}
          tone="cyan"
          loading={tomorrowEventsLoading}
          onClick={() => navigate(`/calendar?view=day&date=${tomorrow}`)}
        />
        <StatCard
          label="Events This Week"
          value={countPendingEvents(weekEvents)}
          subtext={[
            `${weekEvents?.length ?? 0} total`,
            `${weekStart.format('D MMM')} – ${weekEnd.format('D MMM YYYY')}`,
          ]}
          icon={<DateRangeIcon />}
          tone="green"
          loading={weekEventsLoading}
          onClick={() => navigate(`/calendar?view=week&date=${today}`)}
        />
        <StatCard
          label="Events This Month"
          value={countPendingEvents(monthEvents)}
          subtext={[`${monthEvents?.length ?? 0} total`, monthReference.format('MMMM YYYY')]}
          icon={<CalendarMonthIcon />}
          tone="slate"
          loading={monthEventsLoading}
          onClick={() => navigate(`/calendar?view=month&date=${today}`)}
        />
        <StatCard
          label="Upcoming Events"
          value={
            allUpcomingEvents?.summary.statusCounts
              .filter((entry) => PENDING_EVENT_STATUSES.includes(entry.status))
              .reduce((sum, entry) => sum + entry.count, 0) ?? 0
          }
          subtext={[`${allUpcomingEvents?.summary.totalEvents ?? 0} total`, 'All future dates']}
          icon={<UpcomingIcon />}
          tone="orange"
          loading={allUpcomingEventsLoading}
        />
        <StatCard
          label="Today's Appointments"
          value={todayPendingAppointments?.meta.totalRecords ?? 0}
          subtext={[`${todayAppointments?.meta.totalRecords ?? 0} total`, dayjs(today).format('ddd, D MMM YYYY')]}
          icon={<PendingActionsIcon />}
          tone="violet"
          loading={todayAppointmentsLoading || todayPendingAppointmentsLoading}
          onClick={() => navigate(`/enquiries?apptFrom=${today}&apptTo=${today}&view=APPOINTMENT_PENDING`)}
        />
        <StatCard
          label="Tomorrow's Appointments"
          value={tomorrowPendingAppointments?.meta.totalRecords ?? 0}
          subtext={[
            `${tomorrowAppointments?.meta.totalRecords ?? 0} total`,
            dayjs(tomorrow).format('ddd, D MMM YYYY'),
          ]}
          icon={<ScheduleIcon />}
          tone="amber"
          loading={tomorrowAppointmentsLoading || tomorrowPendingAppointmentsLoading}
          onClick={() => navigate(`/enquiries?apptFrom=${tomorrow}&apptTo=${tomorrow}&view=APPOINTMENT_PENDING`)}
        />
      </Box>

      {/* Agenda: what's actually on in each period, not just the count. Click an event to open
          its order — same destination as the Calendar page's own event cards. */}
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 3, mb: 1.25 }}>
        Agenda
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(3, 1fr)', xl: 'repeat(5, 1fr)' },
          gap: 2,
          // Each card sizes to its own content: grid's default `stretch` would pad every card in
          // the row out to match whichever one is expanded.
          alignItems: 'start',
        }}
      >
        <DashboardEventSection
          title="Today"
          subtitle={dayjs(today).format('ddd, D MMM YYYY')}
          events={todayEvents}
          loading={todayEventsLoading}
          onEventClick={handleEventClick}
        />
        <DashboardEventSection
          title="Tomorrow"
          subtitle={dayjs(tomorrow).format('ddd, D MMM YYYY')}
          events={tomorrowEvents}
          loading={tomorrowEventsLoading}
          onEventClick={handleEventClick}
        />
        <DashboardEventSection
          title="This Week"
          subtitle={`${weekStart.format('D MMM')} – ${weekEnd.format('D MMM YYYY')}`}
          events={weekEvents}
          loading={weekEventsLoading}
          onEventClick={handleEventClick}
        />
        <DashboardEventSection
          title="Next Week"
          subtitle={`${nextWeekStart.format('D MMM')} – ${nextWeekEnd.format('D MMM YYYY')}`}
          events={nextWeekEvents}
          loading={nextWeekEventsLoading}
          onEventClick={handleEventClick}
        />
        <DashboardEventSection
          title="This Month"
          subtitle={monthReference.format('MMMM YYYY')}
          events={monthEvents}
          loading={monthEventsLoading}
          onEventClick={handleEventClick}
        />
      </Box>
    </>
  );

  // Overview is the dashboard as it always was; Reports adds the expense graphs. The active tab
  // lives in the query string so a refresh keeps it.
  const tabs = [
    { label: 'Overview', icon: <DashboardOutlinedIcon fontSize="small" />, content: overview },
    ...(showReportsTab
      ? [{ label: 'Reports', icon: <BarChartIcon fontSize="small" />, content: <DashboardReports /> }]
      : []),
  ];
  const activeIndex = showReportsTab && searchParams.get('tab') === 'reports' ? 1 : 0;

  function handleTabChange(index: number) {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (index === 1) next.set('tab', 'reports');
        else next.delete('tab');
        return next;
      },
      { replace: true },
    );
  }

  return (
    <Box>
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${user?.fullName}. ${user?.userGroup.groupName} · ${user?.company.companyName}`}
      />

      <AppTabs idPrefix="dashboard" tabs={tabs} activeIndex={activeIndex} onActiveIndexChange={handleTabChange} />
    </Box>
  );
}
