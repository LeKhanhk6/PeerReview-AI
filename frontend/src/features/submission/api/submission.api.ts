import { api } from '@/lib/axios';
import type { SubmissionVersion, SubmissionFeedback, TeacherSubmissionsMonitorData } from '../types/submission.types';

export const submissionApi = {
  // Submit assignment
  submitAssignment: async (
    assignmentId: string,
    payload: FormData
  ): Promise<SubmissionVersion> => {
    // Explicitly delete Content-Type so Axios/browser automatically sets the boundary for FormData
    const res: any = await api.post(`/submissions/assignments/${assignmentId}`, payload, {
      headers: {
        'Content-Type': undefined
      }
    });
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

  // Toggle Early Internal Evaluation
  toggleEarlyInternalEval: async (
    assignmentId: string,
    allow: boolean
  ): Promise<{ id: string; allow_early_internal_eval: boolean }> => {
    const res: any = await api.patch(`/assignments/${assignmentId}/early-internal-eval`, { allow });
    return res.data || res;
  },
};

