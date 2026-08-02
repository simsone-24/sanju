export type EventTypeStatus = 'ACTIVE' | 'INACTIVE';

export interface EventTypeDetail {
  id: string;
  eventName: string;
  colorCode: string | null;
  displayOrder: number;
  status: EventTypeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventTypeInput {
  eventName: string;
  colorCode?: string;
  displayOrder?: number;
}

export interface UpdateEventTypeInput {
  eventName?: string;
  colorCode?: string;
  displayOrder?: number;
  status?: EventTypeStatus;
}

export interface ListEventTypesParams {
  page: number;
  limit: number;
  search?: string;
  status?: EventTypeStatus;
}
