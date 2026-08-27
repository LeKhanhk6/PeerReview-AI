import { api } from '@/lib/axios';
import type {
  DashboardOverviewMetrics,
  GroupContributionSummary,
  GroupMemberContribution,
  CollaborationRiskItem,
} from '../types/analytics.types';

export const analyticsApi = {
  // Lấy chỉ số tổng quan Dashboard
  getDashboardOverview: async (classId?: string): Promise<DashboardOverviewMetrics> => {
    const res: any = await api.get('/analytics/dashboard/overview', {
      params: classId ? { classId } : undefined,
    });
    return res.data || res;
  },

  // Lấy danh sách đóng góp của các nhóm trong Lớp học
  getClassContributions: async (classId: string): Promise<GroupContributionSummary[]> => {
    const res: any = await api.get(`/analytics/classes/${classId}/contributions`);
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    return [];
  },

  // Lấy đóng góp chi tiết từng thành viên trong Nhóm (Level 2 Drill-down)
  getGroupContribution: async (groupId: string): Promise<GroupMemberContribution[]> => {
    const res: any = await api.get(`/analytics/groups/${groupId}/contribution`);
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    return [];
  },

  // Lấy danh sách cảnh báo rủi ro làm việc nhóm (Early Warning Panel)
  getClassCollaborationRisks: async (classId: string): Promise<CollaborationRiskItem[]> => {
    const res: any = await api.get(`/analytics/classes/${classId}/collaboration-risks`);
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    return [];
  },
};
