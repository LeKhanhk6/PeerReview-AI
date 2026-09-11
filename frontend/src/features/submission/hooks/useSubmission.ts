import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { submissionApi } from '../api/submission.api';
import type { SubmissionVersion } from '../types/submission.types';

export const submissionKeys = {
  all: ['submissions'] as const,
  history: (assignmentId: string) => ['submissions', 'history', assignmentId] as const,
  feedback: (assignmentId: string) => ['submissions', 'feedback', assignmentId] as const,
  monitor: (assignmentId: string, status?: string) => ['submissions', 'monitor', assignmentId, status || 'ALL'] as const,
};

export const useSubmissionHistory = (assignmentId: string) => {
  const isValidId = Boolean(assignmentId && assignmentId !== 'null' && assignmentId !== 'undefined');
  return useQuery({
    queryKey: submissionKeys.history(assignmentId),
    queryFn: () => submissionApi.getSubmissionHistory(assignmentId),
    enabled: isValidId,
  });
};

export const useSubmissionFeedback = (assignmentId: string) => {
  const isValidId = Boolean(assignmentId && assignmentId !== 'null' && assignmentId !== 'undefined');
  return useQuery({
    queryKey: submissionKeys.feedback(assignmentId),
    queryFn: () => submissionApi.getSubmissionFeedback(assignmentId),
    enabled: isValidId,
  });
};

export const useTeacherSubmissionsMonitor = (assignmentId: string, status?: string) => {
  const isValidId = Boolean(assignmentId && assignmentId !== 'null' && assignmentId !== 'undefined');
  return useApiQuery(
    submissionKeys.monitor(assignmentId, status),
    () => submissionApi.getTeacherSubmissionsMonitor(assignmentId, status),
    { enabled: isValidId }
  );
};

export const useSubmitAssignment = (assignmentId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: FormData) =>
      submissionApi.submitAssignment(assignmentId, payload),
    onSuccess: (newSubmission) => {
      queryClient.setQueryData<SubmissionVersion[]>(
        submissionKeys.history(assignmentId),
        (old = []) => {
          if (!old) return [newSubmission];
          return [newSubmission, ...old];
        }
      );
      queryClient.invalidateQueries({ queryKey: submissionKeys.history(assignmentId) });
      queryClient.invalidateQueries({ queryKey: submissionKeys.feedback(assignmentId) });
      queryClient.invalidateQueries({ queryKey: submissionKeys.monitor(assignmentId) });
      queryClient.invalidateQueries({ queryKey: ['student-dashboard-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-dashboard-overview'] });
    },
  });
};

export const useToggleEarlyInternalEval = (assignmentId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (allow: boolean) =>
      submissionApi.toggleEarlyInternalEval(assignmentId, allow),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: submissionKeys.monitor(assignmentId) });
      queryClient.invalidateQueries({ queryKey: ['internal-evaluations'] });
      queryClient.invalidateQueries({ queryKey: ['assignment-detail', assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['student-dashboard-assignments'] });
    },
  });
};


