import { PaymentMethod } from '@prisma/client';
import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/response';

export function list(_req: Request, res: Response): void {
  sendSuccess(res, Object.values(PaymentMethod), 'Payment methods retrieved successfully.');
}
