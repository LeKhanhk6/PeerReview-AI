import { usePaginatedQuery } from '@/hooks/usePaginatedQuery';
import { getMyReviews, type GetMyReviewsResult } from '../api/review.api';

export function useReviews(assignmentId: string, defaultLimit: number = 10) {
  return usePaginatedQuery<GetMyReviewsResult>(
    ['reviewAssignments', assignmentId || 'all'],
    (params) => getMyReviews(assignmentId, params),
    defaultLimit
  );
}
