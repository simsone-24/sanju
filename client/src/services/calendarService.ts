import { apiClient } from '../api/client';
import type { ApiSuccessResponse } from '../types/api';
import type { CalendarEvent } from '../types/calendar';

export async function getMonth(month: number, year: number): Promise<CalendarEvent[]> {
  const response = await apiClient.get<ApiSuccessResponse<CalendarEvent[]>>('/calendar/month', {
    params: { month, year },
  });
  return response.data.data;
}

export async function getWeek(date: string): Promise<CalendarEvent[]> {
  const response = await apiClient.get<ApiSuccessResponse<CalendarEvent[]>>('/calendar/week', { params: { date } });
  return response.data.data;
}

export async function getDay(date: string): Promise<CalendarEvent[]> {
  const response = await apiClient.get<ApiSuccessResponse<CalendarEvent[]>>('/calendar/day', { params: { date } });
  return response.data.data;
}
