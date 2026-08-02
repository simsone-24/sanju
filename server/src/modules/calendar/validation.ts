import { z } from 'zod';

export const calendarMonthQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});

export const calendarWeekQuerySchema = z.object({
  date: z.coerce.date(),
});

export const calendarDayQuerySchema = z.object({
  date: z.coerce.date(),
});

export type CalendarMonthQuerySchema = z.infer<typeof calendarMonthQuerySchema>;
export type CalendarWeekQuerySchema = z.infer<typeof calendarWeekQuerySchema>;
export type CalendarDayQuerySchema = z.infer<typeof calendarDayQuerySchema>;
