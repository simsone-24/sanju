import { NextFunction, Request, Response } from 'express';
import { AuthenticatedUser } from '../auth/types';
import { AppError } from '../../utils/AppError';
import { normalizeLimit, normalizePage } from '../../utils/pagination';
import { parseQuery } from '../../utils/parseQuery';
import { sendSuccess } from '../../utils/response';
import * as ordersService from './service';
import {
  ChangeOrderStatusSchema,
  ConvertToOrderSchema,
  UpdateOrderSchema,
  listOrdersQuerySchema,
} from './validation';

function requireUser(req: Request): AuthenticatedUser {
  if (!req.user) throw new AppError(401, 'Authentication required.');
  return req.user;
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const query = parseQuery(listOrdersQuerySchema, req.query);
    const page = normalizePage(query.page);
    const limit = normalizeLimit(query.limit);

    const result = await ordersService.list({
      companyId: actor.companyId,
      page,
      limit,
      search: query.search,
      status: query.status,
      statusGroup: query.statusGroup,
      customerId: query.customerId,
      eventDateFrom: query.eventDateFrom,
      eventDateTo: query.eventDateTo,
    });

    sendSuccess(res, result.records, 'Orders retrieved successfully.', 200, result.meta);
  } catch (error) {
    next(error);
  }
}

export async function stats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const result = await ordersService.getStats(actor.companyId);
    sendSuccess(res, result, 'Order statistics retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const order = await ordersService.getById(actor.companyId, req.params.id);
    sendSuccess(res, order, 'Order retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

export async function getTimeline(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const timeline = await ordersService.getTimeline(actor.companyId, req.params.id);
    sendSuccess(res, timeline, 'Order timeline retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

export async function listEligibleEnquiries(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const enquiries = await ordersService.listEligibleEnquiries(actor.companyId);
    sendSuccess(res, enquiries, 'Enquiries eligible for order conversion retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

export async function convert(
  req: Request<Record<string, never>, unknown, ConvertToOrderSchema>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = requireUser(req);
    const order = await ordersService.convert(actor.companyId, actor.id, req.body);
    sendSuccess(res, order, 'Order created successfully.', 201);
  } catch (error) {
    next(error);
  }
}

export async function update(
  req: Request<{ id: string }, unknown, UpdateOrderSchema>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = requireUser(req);
    const order = await ordersService.update(actor.companyId, actor.id, req.params.id, req.body);
    sendSuccess(res, order, 'Order updated successfully.');
  } catch (error) {
    next(error);
  }
}

export async function changeStatus(
  req: Request<{ id: string }, unknown, ChangeOrderStatusSchema>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = requireUser(req);
    const order = await ordersService.changeStatus(actor.companyId, actor.id, req.params.id, req.body);
    sendSuccess(res, order, 'Order status updated successfully.');
  } catch (error) {
    next(error);
  }
}
