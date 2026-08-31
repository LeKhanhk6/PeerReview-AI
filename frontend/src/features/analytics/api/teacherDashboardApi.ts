import { api } from '@/lib/axios';

export interface DashboardOverviewMetrics {
  totalClasses: number;
  totalStudents: number;
  totalAssignments: number;
  hasAssignments: boolean;
  expectedSubmissions: number;
  actualSubmissions: number;
  expectedReviews: number;
  completedReviews: number;
  submissionRate: number;
  reviewCompletionRate: number;
  averageScore: number;
}

export interface CollaborationRiskItem {
  id: string;
  groupId: string;
  groupName: string;
  userId?: string | null;
  userName?: string | null;
  entityType: 'GROUP' | 'USER';
  riskType: 'DEAD_GROUP' | 'LOW_ACTIVITY' | 'LOW_CONTRIBUTION' | 'UNBALANCED_CONTRIBUTION' | 'INCOMPLETE_TASKS' | 'REVIEW_INACTIVITY';
  severity: 'HIGH' | 'MEDIUM';
  score: number;
  message: string;
  data?: any;
}

export const getTeacherClassesApi = async (): Promise<Array<{ id: string; name: string }>> => {
  const response = await api.get('/classes');
  return response.data || response.classes || response || [];
};

export const getDashboardOverviewApi = async (classId?: string): Promise<DashboardOverviewMetrics> => {
  const params = classId ? { classId } : {};
  const response = await api.get('/analytics/dashboard/overview', { params });
  return response.data || response;
};

export const getClassCollaborationRisksApi = async (classId: string): Promise<CollaborationRiskItem[]> => {
  if (!classId) return [];
  const response = await api.get(`/analytics/classes/${classId}/collaboration-risks`);
  return response.data || response || [];
};
