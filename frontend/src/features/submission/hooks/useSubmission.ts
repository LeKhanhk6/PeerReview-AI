import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { submissionApi } from '../api/submission.api';
import type { SubmissionVersion } from '../types/submission.types';

export const submissionKeys = {
  all: ['submissions'] as const,
  history: (assignmentId: string) => ['submissions', 'history', assignmentId] as const,
  feedback: (assignmentId: string) => ['submissions', 'feedback', assignmentId] as const,
};

export const useSubmissionHistory = (assignmentId: string) => {
  return useQuery({
    queryKey: submissionKeys.history(assignmentId),
    queryFn: () => submissionApi.getSubmissionHistory(assignmentId),
    enabled: Boolean(assignmentId),
  });
};

export const useSubmissionFeedback = (assignmentId: string) => {
  return useQuery({
    queryKey: submissionKeys.feedback(assignmentId),
    queryFn: () => submissionApi.getSubmissionFeedback(assignmentId),
    enabled: Boolean(assignmentId),
  });
};

export const useSubmitAssignment = (assignmentId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { file_url: string; file_name?: string; is_late?: boolean }) =>
      submissionApi.submitAssignment(assignmentId, payload),
    onSuccess: (newSubmission) => {
      queryClient.setQueryData<SubmissionVersion[]>(
        submissionKeys.history(assignmentId),
        (old = []) => {
          const updated = old.map((v) => ({ ...v, is_current: false }));
          return [newSubmission, ...updated];
        }
      );
      queryClient.invalidateQueries({ queryKey: submissionKeys.history(assignmentId) });
      queryClient.invalidateQueries({ queryKey: submissionKeys.feedback(assignmentId) });
    },
  });
};
