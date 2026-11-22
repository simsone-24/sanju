import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../utils/AppError';
import { normalizeLimit, normalizePage } from '../../utils/pagination';
import { parseQuery } from '../../utils/parseQuery';
import { sendSuccess } from '../../utils/response';
import { AuthenticatedUser } from '../auth/types';
import * as auditLogsService from './service';
import { deletedItemParamsSchema, listAuditLogsQuerySchema, listDeletedItemsQuerySchema } from './validation';

function requireUser(req: Request): AuthenticatedUser {
  if (!req.user) throw new AppError(401, 'Authentication required.');
  return req.user;
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const query = parseQuery(listAuditLogsQuerySchema, req.query);

    const result = await auditLogsService.list({
      companyId: actor.companyId,
      page: normalizePage(query.page),
      limit: normalizeLimit(query.limit),
      search: query.search,
      module: query.module,
      action: query.action,
      userId: query.userId,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    });

    sendSuccess(res, result.records, 'Audit log retrieved successfully.', 200, result.meta);
  } catch (error) {
    next(error);
  }
}

export async function listDeleted(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const query = parseQuery(listDeletedItemsQuerySchema, req.query);

    const result = await auditLogsService.listDeleted({
      companyId: actor.companyId,
      type: query.type,
      page: normalizePage(query.page),
      limit: normalizeLimit(query.limit),
      search: query.search,
    });

    sendSuccess(res, result.records, 'Deleted items retrieved successfully.', 200, result.meta);
  } catch (error) {
    next(error);
  }
}

export async function getDeleted(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const params = parseQuery(deletedItemParamsSchema, req.params);
    const detail = await auditLogsService.getDeletedItem(actor.companyId, params.type, params.id);
    sendSuccess(res, detail, 'Deleted record retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

export async function deletedSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const summary = await auditLogsService.getDeletedSummary(actor.companyId);
    sendSuccess(res, summary, 'Deleted item counts retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

export async function filterOptions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const options = await auditLogsService.getFilterOptions(actor.companyId);
    sendSuccess(res, options, 'Audit log filters retrieved successfully.');
  } catch (error) {
    next(error);
  }
}
