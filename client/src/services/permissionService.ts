import { apiClient } from '../api/client';
import type { ApiSuccessResponse } from '../types/api';
import type { PermissionModuleDefinition } from '../types/permission';

/**
 * The list of modules and the actions each can grant. Served by the backend so the permission
 * editors always offer exactly what the server enforces — a module added to the catalog appears
 * here without a frontend change.
 */
export async function getCatalog(): Promise<PermissionModuleDefinition[]> {
  const response = await apiClient.get<ApiSuccessResponse<PermissionModuleDefinition[]>>(
    '/permissions/catalog',
  );
  return response.data.data;
}
