import { useApiMutation } from '@/hooks/useApiMutation';
import { useQueryClient } from '@tanstack/react-query';
import { submitReview } from '../api/review.api';
import type { SubmitReviewPayload } from '../types/review.types';

export function useSubmitReview(reviewAssignmentId: string) {
  const queryClient = useQueryClient();

  return useApiMutation(
    (payload: SubmitReviewPayload) => submitReview(reviewAssignmentId, payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['reviewDetail', reviewAssignmentId] });
        queryClient.invalidateQueries({ queryKey: ['reviewAssignments'] });
        queryClient.invalidateQueries({ queryKey: ['student-dashboard-assignments'] });
        queryClient.invalidateQueries({ queryKey: ['assignment-synthesis'] });
        queryClient.invalidateQueries({ queryKey: ['submission-summary'] });
        queryClient.invalidateQueries({ queryKey: ['teacher-dashboard-overview'] });
      },
    }
  );
}
