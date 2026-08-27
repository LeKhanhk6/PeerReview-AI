import { api } from '@/lib/axios';
import type { SubmissionVersion, SubmissionFeedback } from '../types/submission.types';
import {
  mockSubmissionHistory,
  mockSubmissionFeedback,
} from '@/mocks/handlers/submission.handlers';

export const submissionApi = {
  // Submit assignment
  submitAssignment: async (
    assignmentId: string,
    payload: { file_url: string; file_name?: string; is_late?: boolean }
  ): Promise<SubmissionVersion> => {
    try {
      const res: any = await api.post(`/submissions/assignments/${assignmentId}`, payload);
      return res.data || res;
    } catch (_err) {
      const newVersionNumber = mockSubmissionHistory.length + 1;
      mockSubmissionHistory.forEach((v) => (v.is_current = false));

      const newSubmission: SubmissionVersion = {
        id: Date.now(),
        assignment_id: assignmentId,
        version_number: newVersionNumber,
        file_name: payload.file_name || `Bai_Nop_v${newVersionNumber}.pdf`,
        file_url: payload.file_url,
        is_current: true,
        is_late: Boolean(payload.is_late),
        created_at: new Date().toISOString(),
      };
      mockSubmissionHistory.unshift(newSubmission);
      return newSubmission;
    }
  },

  // Get Submission History
  getSubmissionHistory: async (assignmentId: string): Promise<SubmissionVersion[]> => {
    try {
      const res: any = await api.get(`/submissions/assignments/${assignmentId}/submission-history`);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      return mockSubmissionHistory;
    } catch (_err) {
      return mockSubmissionHistory;
    }
  },

  // Get Submission Feedback
  getSubmissionFeedback: async (assignmentId: string): Promise<SubmissionFeedback> => {
    try {
      const res: any = await api.get(`/submissions/assignments/${assignmentId}/feedback`);
      return res.data || res;
    } catch (_err) {
      return mockSubmissionFeedback;
    }
  },
};
