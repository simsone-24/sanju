import path from 'path';
import { NextFunction, Request, Response } from 'express';
import { AuthenticatedUser } from '../auth/types';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';
import { normalizeLimit, normalizePage } from '../../utils/pagination';
import { parseQuery } from '../../utils/parseQuery';
import { sendSuccess } from '../../utils/response';
import * as quotationsService from './service';
import { logActivity } from '../../utils/activityLogger';
import { parseId } from '../../utils/parseId';
import {
  ChangeQuotationStatusSchema,
  CreateQuotationSchema,
  UpdateQuotationSchema,
  listQuotationsQuerySchema,
} from './validation';

function requireUser(req: Request): AuthenticatedUser {
  if (!req.user) throw new AppError(401, 'Authentication required.');
  return req.user;
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const query = parseQuery(listQuotationsQuerySchema, req.query);
    const page = normalizePage(query.page);
    const limit = normalizeLimit(query.limit);

    const result = await quotationsService.list({
      companyId: actor.companyId,
      page,
      limit,
      search: query.search,
      source: query.source,
      status: query.status,
      enquiryId: query.enquiryId,
      customerId: query.customerId,
      orderId: query.orderId,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    });

    sendSuccess(res, result.records, 'Quotations retrieved successfully.', 200, result.meta);
  } catch (error) {
    next(error);
  }
}

export async function listGrouped(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const query = parseQuery(listQuotationsQuerySchema, req.query);
    const page = normalizePage(query.page);
    const limit = normalizeLimit(query.limit);

    const result = await quotationsService.listGrouped({
      companyId: actor.companyId,
      page,
      limit,
      search: query.search,
      source: query.source,
      status: query.status,
      customerId: query.customerId,
      assignedUserId: query.assignedUserId,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    });

    sendSuccess(res, result.records, 'Quotations retrieved successfully.', 200, result.meta);
  } catch (error) {
    next(error);
  }
}

export async function stats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const result = await quotationsService.getStats(actor.companyId);
    sendSuccess(res, result, 'Quotation statistics retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const quotation = await quotationsService.getById(actor.companyId, parseId(req.params.id));
    sendSuccess(res, quotation, 'Quotation retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

export async function getTimeline(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const entries = await quotationsService.getTimeline(actor.companyId, parseId(req.params.id));
    sendSuccess(res, entries, 'Quotation timeline retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

export async function branding(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const company = await quotationsService.getBranding(actor.companyId);
    sendSuccess(res, company, 'Company branding retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

export async function create(
  req: Request<Record<string, never>, unknown, CreateQuotationSchema>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = requireUser(req);
    const quotation = await quotationsService.create(actor.companyId, actor.id, req.body);
    sendSuccess(res, quotation, 'Quotation created successfully.', 201);
  } catch (error) {
    next(error);
  }
}

export async function update(
  req: Request<{ id: string }, unknown, UpdateQuotationSchema>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = requireUser(req);
    const quotation = await quotationsService.update(actor.companyId, actor.id, parseId(req.params.id), req.body);
    sendSuccess(res, quotation, 'Quotation updated successfully.');
  } catch (error) {
    next(error);
  }
}

export async function changeStatus(
  req: Request<{ id: string }, unknown, ChangeQuotationStatusSchema>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = requireUser(req);
    const quotation = await quotationsService.changeStatus(
      actor.companyId,
      actor.id,
      parseId(req.params.id),
      req.body.status,
      req.body.remarks,
    );
    sendSuccess(res, quotation, 'Quotation status updated successfully.');
  } catch (error) {
    next(error);
  }
}

export async function approve(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const quotation = await quotationsService.approve(actor.companyId, actor.id, parseId(req.params.id));
    sendSuccess(res, quotation, 'Quotation approved successfully.');
  } catch (error) {
    next(error);
  }
}

export async function uploadImages(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    if (!files.length) {
      throw new AppError(400, 'At least one image is required.', [{ field: 'images', message: 'Select an image.' }]);
    }
    const mapped = files.map((file) => ({
      fileName: file.originalname,
      filePath: path.relative(env.uploadPath, file.path).split(path.sep).join('/'),
    }));
    const quotation = await quotationsService.addImages(actor.companyId, actor.id, parseId(req.params.id), mapped);
    sendSuccess(res, quotation, 'Images added successfully.', 201);
  } catch (error) {
    next(error);
  }
}

export async function deleteImage(
  req: Request<{ id: string; imageId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = requireUser(req);
    const quotation = await quotationsService.removeImage(actor.companyId, actor.id, parseId(req.params.id), parseId(req.params.imageId, 'imageId'));
    sendSuccess(res, quotation, 'Image removed successfully.');
  } catch (error) {
    next(error);
  }
}

// Streams the generated A4 PDF (regenerating on demand if missing). Authenticated + company-scoped —
// quotations can contain customer PII, so they're never served via the public static route.
export async function downloadPdf(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const { absolutePath, fileName } = await quotationsService.getPdfForDownload(actor.companyId, parseId(req.params.id));
    await logActivity({
      companyId: actor.companyId,
      module: 'QUOTATIONS',
      referenceId: parseId(req.params.id),
      action: 'PRINT',
      description: `Quotation PDF "${fileName}" downloaded.`,
      performedById: actor.id,
    });
    res.download(absolutePath, fileName, (error) => {
      if (error) next(error);
    });
  } catch (error) {
    next(error);
  }
}
