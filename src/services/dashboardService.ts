import { apiClient } from './apiClient';

interface DashboardStats {
  userCount: number;
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    return apiClient.get<DashboardStats>('/dashboard/stats');
  },
};
