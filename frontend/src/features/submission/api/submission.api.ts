import { api } from '@/lib/axios';
import type { SubmissionVersion, SubmissionFeedback, TeacherSubmissionsMonitorData } from '../types/submission.types';

export const submissionApi = {
  // Submit assignment
  submitAssignment: async (
    assignmentId: string,
    payload: { file_url: string; file_name?: string; is_late?: boolean }
  ): Promise<SubmissionVersion> => {
    const res: any = await api.post(`/submissions/assignments/${assignmentId}`, payload);
    return res.data || res;
  },

  // Get Submission History
  getSubmissionHistory: async (assignmentId: string): Promise<SubmissionVersion[]> => {
    const res: any = await api.get(`/submissions/assignments/${assignmentId}/submission-history`);
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    return [];
  },

  // Get Submission Feedback
  getSubmissionFeedback: async (assignmentId: string): Promise<SubmissionFeedback> => {
    const res: any = await api.get(`/submissions/assignments/${assignmentId}/feedback`);
    return res.data || res;
  },

  // Get Teacher Submissions Monitor
  getTeacherSubmissionsMonitor: async (
    assignmentId: string,
    status?: string
  ): Promise<TeacherSubmissionsMonitorData> => {
    const params = status && status !== 'ALL' ? { status } : {};
    const res: any = await api.get(`/submissions/assignments/${assignmentId}/monitor`, { params });
    return res.data || res;
  },
};
