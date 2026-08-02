import { NextFunction, Request, Response } from 'express';
import { AuthenticatedUser } from '../auth/types';
import { AppError } from '../../utils/AppError';
import { normalizeLimit, normalizePage } from '../../utils/pagination';
import { parseQuery } from '../../utils/parseQuery';
import { sendSuccess } from '../../utils/response';
import * as enquiriesService from './service';
import {
  ChangeEnquiryStatusSchema,
  CreateEnquirySchema,
  CreateFollowUpSchema,
  UpdateEnquirySchema,
  listEnquiriesQuerySchema,
} from './validation';

function requireUser(req: Request): AuthenticatedUser {
  if (!req.user) throw new AppError(401, 'Authentication required.');
  return req.user;
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const query = parseQuery(listEnquiriesQuerySchema, req.query);
    const page = normalizePage(query.page);
    const limit = normalizeLimit(query.limit);

    const result = await enquiriesService.list({
      companyId: actor.companyId,
      page,
      limit,
      search: query.search,
      status: query.status,
      appointmentStatus: query.appointmentStatus,
      eventTypeId: query.eventTypeId,
      assignedUserId: query.assignedUserId,
      customerId: query.customerId,
      eventDateFrom: query.eventDateFrom,
      eventDateTo: query.eventDateTo,
      appointmentDateFrom: query.appointmentDateFrom,
      appointmentDateTo: query.appointmentDateTo,
    });

    sendSuccess(res, result.records, 'Enquiries retrieved successfully.', 200, result.meta);
  } catch (error) {
    next(error);
  }
}

export async function getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const stats = await enquiriesService.getStats(actor.companyId);
    sendSuccess(res, stats, 'Enquiry stats retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const enquiry = await enquiriesService.getById(actor.companyId, req.params.id);
    sendSuccess(res, enquiry, 'Enquiry retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

export async function create(
  req: Request<Record<string, never>, unknown, CreateEnquirySchema>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = requireUser(req);
    const enquiry = await enquiriesService.create(actor.companyId, actor.id, req.body);
    sendSuccess(res, enquiry, 'Enquiry created successfully.', 201);
  } catch (error) {
    next(error);
  }
}

export async function update(
  req: Request<{ id: string }, unknown, UpdateEnquirySchema>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = requireUser(req);
    const enquiry = await enquiriesService.update(actor, req.params.id, req.body);
    sendSuccess(res, enquiry, 'Enquiry updated successfully.');
  } catch (error) {
    next(error);
  }
}

export async function changeStatus(
  req: Request<{ id: string }, unknown, ChangeEnquiryStatusSchema>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = requireUser(req);
    const enquiry = await enquiriesService.changeStatus(
      actor.companyId,
      actor.id,
      req.params.id,
      req.body.status,
      req.body.remarks,
    );
    sendSuccess(res, enquiry, 'Enquiry status updated successfully.');
  } catch (error) {
    next(error);
  }
}

export async function addFollowUp(
  req: Request<{ id: string }, unknown, CreateFollowUpSchema>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = requireUser(req);
    const followUp = await enquiriesService.addFollowUp(actor.companyId, actor.id, req.params.id, req.body);
    sendSuccess(res, followUp, 'Follow-up added successfully.', 201);
  } catch (error) {
    next(error);
  }
}
