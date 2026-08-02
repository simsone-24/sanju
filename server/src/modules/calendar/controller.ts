import { NextFunction, Request, Response } from 'express';
import { AuthenticatedUser } from '../auth/types';
import { AppError } from '../../utils/AppError';
import { parseQuery } from '../../utils/parseQuery';
import { sendSuccess } from '../../utils/response';
import * as calendarService from './service';
import { calendarDayQuerySchema, calendarMonthQuerySchema, calendarWeekQuerySchema } from './validation';

function requireUser(req: Request): AuthenticatedUser {
  if (!req.user) throw new AppError(401, 'Authentication required.');
  return req.user;
}

export async function month(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const query = parseQuery(calendarMonthQuerySchema, req.query);
    const events = await calendarService.getMonth(actor.companyId, query.month, query.year);
    sendSuccess(res, events, 'Monthly calendar retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

export async function week(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const query = parseQuery(calendarWeekQuerySchema, req.query);
    const events = await calendarService.getWeek(actor.companyId, query.date);
    sendSuccess(res, events, 'Weekly calendar retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

export async function day(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const query = parseQuery(calendarDayQuerySchema, req.query);
    const events = await calendarService.getDay(actor.companyId, query.date);
    sendSuccess(res, events, 'Daily calendar retrieved successfully.');
  } catch (error) {
    next(error);
  }
}
