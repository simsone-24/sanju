export interface CreateEventTypeInput {
  eventName: string;
  colorCode?: string;
  displayOrder?: number;
}

export interface UpdateEventTypeInput {
  eventName?: string;
  colorCode?: string;
  displayOrder?: number;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface ListEventTypesParams {
  companyId: string;
  page: number;
  limit: number;
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}
