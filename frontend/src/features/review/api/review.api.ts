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
  const url = assignmentId ? `/assignments/${assignmentId}/my-reviews` : '/my-reviews';
  const response = await api.get(url, { params });

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

export const generateReviewAssignments = async (
  assignmentId: string,
  reviewsPerGroup?: number
): Promise<{ success: boolean; message: string; count: number }> => {
  const response = await api.post(`/assignments/${assignmentId}/review-assignments/generate`, { reviewsPerGroup });
  return (response as unknown) as { success: boolean; message: string; count: number };
};
