import { AppError } from '../../utils/AppError';
import { logActivity } from '../../utils/activityLogger';
import { buildPaginationMeta } from '../../utils/pagination';
import * as eventTypesRepository from './repository';
import { CreateEventTypeInput, ListEventTypesParams, UpdateEventTypeInput } from './types';

export async function list(params: ListEventTypesParams) {
  const { records, totalRecords } = await eventTypesRepository.listEventTypes(params);
  return { records, meta: buildPaginationMeta(params.page, params.limit, totalRecords) };
}

export async function getById(companyId: string, id: string) {
  const eventType = await eventTypesRepository.findEventTypeById(companyId, id);
  if (!eventType) throw new AppError(404, 'Event type not found.');
  return eventType;
}

export async function create(companyId: string, actorId: string, input: CreateEventTypeInput) {
  const existing = await eventTypesRepository.findEventTypeByName(companyId, input.eventName);
  if (existing) {
    throw new AppError(409, 'An event type with this name already exists.', [
      { field: 'eventName', message: 'Event type name is already in use.' },
    ]);
  }

  const eventType = await eventTypesRepository.createEventType({
    companyId,
    eventName: input.eventName,
    colorCode: input.colorCode,
    displayOrder: input.displayOrder ?? 0,
    status: 'ACTIVE',
  });

  await logActivity({
    companyId,
    module: 'MASTERS',
    referenceId: eventType.id,
    action: 'CREATE',
    description: `Event type "${eventType.eventName}" created.`,
    performedById: actorId,
  });

  return eventType;
}

export async function update(companyId: string, actorId: string, id: string, input: UpdateEventTypeInput) {
  const existingEventType = await eventTypesRepository.findEventTypeById(companyId, id);
  if (!existingEventType) throw new AppError(404, 'Event type not found.');

  if (input.eventName && input.eventName !== existingEventType.eventName) {
    const nameOwner = await eventTypesRepository.findEventTypeByName(companyId, input.eventName);
    if (nameOwner && nameOwner.id !== id) {
      throw new AppError(409, 'An event type with this name already exists.', [
        { field: 'eventName', message: 'Event type name is already in use.' },
      ]);
    }
  }

  const eventType = await eventTypesRepository.updateEventType(id, {
    eventName: input.eventName,
    colorCode: input.colorCode,
    displayOrder: input.displayOrder,
    status: input.status,
  });

  await logActivity({
    companyId,
    module: 'MASTERS',
    referenceId: eventType.id,
    action: 'UPDATE',
    description: `Event type "${eventType.eventName}" updated.`,
    performedById: actorId,
  });

  return eventType;
}

export async function remove(companyId: string, actorId: string, id: string): Promise<void> {
  const existingEventType = await eventTypesRepository.findEventTypeById(companyId, id);
  if (!existingEventType) throw new AppError(404, 'Event type not found.');

  const enquiryCount = await eventTypesRepository.countEnquiriesForEventType(id);
  if (enquiryCount > 0) {
    throw new AppError(
      409,
      `Cannot delete event type "${existingEventType.eventName}" while ${enquiryCount} enquiry(ies) reference it.`,
    );
  }

  await eventTypesRepository.softDeleteEventType(id);

  await logActivity({
    companyId,
    module: 'MASTERS',
    referenceId: id,
    action: 'DELETE',
    description: `Event type "${existingEventType.eventName}" deleted.`,
    performedById: actorId,
  });
}
