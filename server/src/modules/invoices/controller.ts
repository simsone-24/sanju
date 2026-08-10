import { NextFunction, Request, Response } from 'express';
import { AuthenticatedUser } from '../auth/types';
import { AppError } from '../../utils/AppError';
import { logActivity } from '../../utils/activityLogger';
import { sendSuccess } from '../../utils/response';
import * as invoicesService from './service';

function requireUser(req: Request): AuthenticatedUser {
  if (!req.user) throw new AppError(401, 'Authentication required.');
  return req.user;
}

export async function getForOrder(req: Request<{ orderId: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const invoice = await invoicesService.getForOrder(actor.companyId, actor.id, req.params.orderId);
    sendSuccess(res, invoice, 'Invoice retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

// Streams a freshly-rendered A4 PDF. Authenticated + company-scoped — an invoice carries customer
// PII and billing figures, so it is never served via the public static route.
export async function downloadPdf(req: Request<{ orderId: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const { absolutePath, fileName } = await invoicesService.getPdfForDownload(
      actor.companyId,
      actor.id,
      req.params.orderId,
    );
    await logActivity({
      companyId: actor.companyId,
      module: 'INVOICES',
      referenceId: req.params.orderId,
      action: 'PRINT',
      description: `Invoice PDF "${fileName}" downloaded.`,
      performedById: actor.id,
    });
    res.download(absolutePath, fileName, (error) => {
      if (error) next(error);
    });
  } catch (error) {
    next(error);
  }
}
