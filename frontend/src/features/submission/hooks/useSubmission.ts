import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { submissionApi } from '../api/submission.api';
import type { SubmissionVersion } from '../types/submission.types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const submissionKeys = {
  all: ['submissions'] as const,
  history: (assignmentId: string) => ['submissions', 'history', assignmentId] as const,
  feedback: (assignmentId: string) => ['submissions', 'feedback', assignmentId] as const,
  monitor: (assignmentId: string, status?: string) => ['submissions', 'monitor', assignmentId, status || 'ALL'] as const,
};

export const useSubmissionHistory = (assignmentId: string) => {
  const isValidUuid = Boolean(assignmentId && UUID_REGEX.test(assignmentId));
  return useQuery({
    queryKey: submissionKeys.history(assignmentId),
    queryFn: () => submissionApi.getSubmissionHistory(assignmentId),
    enabled: isValidUuid,
  });
};

export const useSubmissionFeedback = (assignmentId: string) => {
  const isValidUuid = Boolean(assignmentId && UUID_REGEX.test(assignmentId));
  return useQuery({
    queryKey: submissionKeys.feedback(assignmentId),
    queryFn: () => submissionApi.getSubmissionFeedback(assignmentId),
    enabled: isValidUuid,
  });
};

export const useTeacherSubmissionsMonitor = (assignmentId: string, status?: string) => {
  const isValidUuid = Boolean(assignmentId && UUID_REGEX.test(assignmentId));
  return useApiQuery(
    submissionKeys.monitor(assignmentId, status),
    () => submissionApi.getTeacherSubmissionsMonitor(assignmentId, status),
    { enabled: isValidUuid }
  );
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
