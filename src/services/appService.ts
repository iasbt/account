
import { adminApiClient } from './apiClient';

export interface App {
  id: string;
  app_id: string;
  name: string;
  allowed_origins: string[];
  secret: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAppDto {
  name: string;
  appId: string;
  allowedOrigins: string[];
  secret: string;
}

export interface UpdateAppDto {
  name?: string;
  allowedOrigins?: string[];
  secret?: string;
  isActive?: boolean;
}

export const appService = {
  getApps: async (): Promise<App[]> => {
    return adminApiClient.get<App[]>('/apps');
  },

  getApp: async (id: string): Promise<App> => {
    return adminApiClient.get<App>(`/apps/${id}`);
  },

  createApp: async (data: CreateAppDto): Promise<App> => {
    return adminApiClient.post<App>('/apps', data);
  },

  updateApp: async (id: string, data: UpdateAppDto): Promise<App> => {
    return adminApiClient.put<App>(`/apps/${id}`, data);
  },

  rotateSecret: async (id: string): Promise<{ secret: string }> => {
    return adminApiClient.post<{ secret: string }>(`/apps/${id}/rotate-secret`, {});
  },

  deleteApp: async (id: string): Promise<{ message: string }> => {
    return adminApiClient.delete<{ message: string }>(`/apps/${id}`);
  }
};
