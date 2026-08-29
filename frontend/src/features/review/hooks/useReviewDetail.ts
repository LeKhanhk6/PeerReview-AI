import { useApiQuery } from '@/hooks/useApiQuery';
import { getReviewAssignmentDetail } from '../api/review.api';
import type { ReviewAssignmentDetail } from '../types/review.types';

export function useReviewDetail(reviewAssignmentId: string) {
  return useApiQuery<ReviewAssignmentDetail>(
    ['reviewDetail', reviewAssignmentId],
    () => getReviewAssignmentDetail(reviewAssignmentId),
    {
      enabled: Boolean(reviewAssignmentId),
      staleTime: 60 * 1000,
    }
  );
}
