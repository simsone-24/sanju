import { NextFunction, Request, Response } from 'express';
import { AuthenticatedUser } from '../auth/types';
import { AppError } from '../../utils/AppError';
import { normalizeLimit, normalizePage } from '../../utils/pagination';
import { parseQuery } from '../../utils/parseQuery';
import { sendSuccess } from '../../utils/response';
import * as paymentTrackerService from './service';
import { UpdatePaymentTrackerSchema, listPaymentTrackerQuerySchema } from './validation';

function requireUser(req: Request): AuthenticatedUser {
  if (!req.user) throw new AppError(401, 'Authentication required.');
  return req.user;
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const query = parseQuery(listPaymentTrackerQuerySchema, req.query);

    const result = await paymentTrackerService.list({
      companyId: actor.companyId,
      page: normalizePage(query.page),
      limit: normalizeLimit(query.limit),
      search: query.search,
      customerId: query.customerId,
      paymentStatus: query.paymentStatus,
      statusGroup: query.statusGroup,
      orderStatus: query.orderStatus,
      eventDateFrom: query.eventDateFrom,
      eventDateTo: query.eventDateTo,
    });

    sendSuccess(res, result.records, 'Payment tracker records retrieved successfully.', 200, result.meta);
  } catch (error) {
    next(error);
  }
}

export async function stats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const query = parseQuery(listPaymentTrackerQuerySchema, req.query);
    const result = await paymentTrackerService.stats({
      companyId: actor.companyId,
      search: query.search,
      customerId: query.customerId,
      paymentStatus: query.paymentStatus,
      statusGroup: query.statusGroup,
      orderStatus: query.orderStatus,
      eventDateFrom: query.eventDateFrom,
      eventDateTo: query.eventDateTo,
    });
    sendSuccess(res, result, 'Payment tracker statistics retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

export async function getByOrderId(req: Request<{ orderId: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const record = await paymentTrackerService.getByOrderId(actor.companyId, req.params.orderId);
    sendSuccess(res, record, 'Payment details retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

export async function getHistory(req: Request<{ orderId: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const payments = await paymentTrackerService.getHistory(actor.companyId, req.params.orderId);
    sendSuccess(res, payments, 'Payment history retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

export async function update(
  req: Request<{ orderId: string }, unknown, UpdatePaymentTrackerSchema>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = requireUser(req);
    const record = await paymentTrackerService.update(actor.companyId, actor.id, req.params.orderId, req.body);
    sendSuccess(res, record, 'Payment details updated successfully.');
  } catch (error) {
    next(error);
  }
}
