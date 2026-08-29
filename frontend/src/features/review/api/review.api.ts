import { api } from '@/lib/axios';
import type {
  ReviewAssignmentItem,
  ReviewAssignmentDetail,
  SubmitReviewPayload,
  AIMentorAnalysis,
} from '../types/review.types';

export interface GetMyReviewsResult {
  data: ReviewAssignmentItem[];
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
}

export const getMyReviews = async (
  assignmentId: string,
  params?: Record<string, any>
): Promise<GetMyReviewsResult> => {
  const response = await api.get(`/assignments/${assignmentId}/my-reviews`, { params });

  if (Array.isArray(response)) {
    return {
      data: response,
      page: params?.page || 1,
      limit: params?.limit || 10,
      total: response.length,
      hasNext: false,
    };
  }

  return (response as unknown) as GetMyReviewsResult;
};

export const getReviewAssignmentDetail = async (
  reviewAssignmentId: string
): Promise<ReviewAssignmentDetail> => {
  const response = await api.get(`/my-reviews/${reviewAssignmentId}`);
  return (response as unknown) as ReviewAssignmentDetail;
};

export const submitReview = async (
  reviewAssignmentId: string,
  payload: SubmitReviewPayload
): Promise<{ reviewId: string; totalScore: number; status: string; submittedAt: string }> => {
  const response = await api.post(`/my-reviews/${reviewAssignmentId}/submit`, payload);
  return (response as unknown) as { reviewId: string; totalScore: number; status: string; submittedAt: string };
};

export const analyzeReviewText = async (
  comment: string,
  signal?: AbortSignal
): Promise<AIMentorAnalysis> => {
  const response = await api.post('/analyze', { comment }, { signal });
  return (response as unknown) as AIMentorAnalysis;
};
