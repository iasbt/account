import { apiClient } from './apiClient';

export interface AppInfo {
  id: string;
  name: string;
  url: string;
  description: string;
  icon: string;
}

export interface DashboardStats {
  userCount: number;
  apps: AppInfo[];
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    return apiClient.get<DashboardStats>('/dashboard/stats');
  },
};
