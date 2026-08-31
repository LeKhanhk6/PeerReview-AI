import { api } from '@/lib/axios';

export interface StudentDashboardAssignmentItem {
  assignment_id: string;
  title: string;
  deadline: string;
  group_id: string;
  group_name: string;
  is_late: boolean;
  days_left: number;
  submission?: {
    id?: string;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'LATE';
    submitted_at?: string;
    latest_version_id?: string;
  };
  review?: {
    status: 'NOT_REVIEWED' | 'UNDER_REVIEW' | 'REVIEWED';
  };
}

export interface GroupTaskItem {
  id: string;
  group_id: string;
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  assignee_id: string | null;
  created_at?: string;
}

export const getStudentDashboardAssignmentsApi = async (): Promise<{
  rows: StudentDashboardAssignmentItem[];
  total: number;
}> => {
  const response = await api.get('/submissions/me/dashboard');
  return response.data || response;
};

export const getGroupTasksApi = async (groupId: string): Promise<GroupTaskItem[]> => {
  const response = await api.get(`/groups/${groupId}/tasks`);
  return response.data || response;
};
