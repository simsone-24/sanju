import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../utils/AppError';
import { normalizeLimit, normalizePage } from '../../utils/pagination';
import { parseId } from '../../utils/parseId';
import { parseQuery } from '../../utils/parseQuery';
import { sendSuccess } from '../../utils/response';
import { AuthenticatedUser } from '../auth/types';
import { resolveReceiptPath, uploadedReceipts } from './receipt';
import * as expensesService from './service';
import { CreateExpenseSchema, UpdateExpenseSchema, listExpensesQuerySchema } from './validation';

function requireUser(req: Request): AuthenticatedUser {
  if (!req.user) throw new AppError(401, 'Authentication required.');
  return req.user;
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const query = parseQuery(listExpensesQuerySchema, req.query);

    const result = await expensesService.list({
      companyId: actor.companyId,
      page: normalizePage(query.page),
      limit: normalizeLimit(query.limit),
      search: query.search,
      categoryId: query.categoryId,
      paymentMethod: query.paymentMethod,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    });

    sendSuccess(res, result.records, 'Expenses retrieved successfully.', 200, result.meta);
  } catch (error) {
    next(error);
  }
}

export async function getById(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const expense = await expensesService.getById(actor.companyId, parseId(req.params.id));
    sendSuccess(res, expense, 'Expense retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

export async function create(
  req: Request<Record<string, never>, unknown, CreateExpenseSchema>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = requireUser(req);
    const expense = await expensesService.create(actor.companyId, actor.id, req.body, uploadedReceipts(req));
    sendSuccess(res, expense, 'Expense created successfully.', 201);
  } catch (error) {
    next(error);
  }
}

export async function update(
  req: Request<{ id: string }, unknown, UpdateExpenseSchema>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = requireUser(req);
    const expense = await expensesService.update(
      actor.companyId,
      actor.id,
      parseId(req.params.id),
      req.body,
      uploadedReceipts(req),
    );
    sendSuccess(res, expense, 'Expense updated successfully.');
  } catch (error) {
    next(error);
  }
}

// Authenticated and company-scoped, like order documents: receipts can hold private business data
// and are never served through the public static route.
export async function downloadReceipt(
  req: Request<{ id: string; receiptId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = requireUser(req);
    const { filePath, fileName } = await expensesService.getReceiptForDownload(
      actor.companyId,
      parseId(req.params.id),
      parseId(req.params.receiptId, 'receiptId'),
    );
    res.download(resolveReceiptPath(filePath), fileName, (error) => {
      if (error) next(error);
    });
  } catch (error) {
    next(error);
  }
}

export async function remove(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    await expensesService.remove(actor.companyId, actor.id, parseId(req.params.id));
    sendSuccess(res, null, 'Expense deleted successfully.');
  } catch (error) {
    next(error);
  }
}
