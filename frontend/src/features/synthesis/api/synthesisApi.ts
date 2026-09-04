import { api } from '@/lib/axios';
import type {
  AssignmentSynthesisResponse,
  SubmissionSummaryResponse,
  GetSourceReviewsResponse,
  UpdateSummaryItemPayload,
} from '../types/synthesis.types';

export const synthesisApi = {
  // 1. Lấy AI Synthesis toàn bộ bài tập (Assignment-level)
  getAssignmentSynthesis: async (
    assignmentId: string,
    params?: { from?: string; to?: string }
  ): Promise<AssignmentSynthesisResponse> => {
    const res: any = await api.get(`/assignments/${assignmentId}/reviews/synthesis`, {
      params,
    });
    if (res && typeof res === 'object' && 'data' in res && res.data && typeof res.data === 'object' && 'summary' in res.data) {
      return res.data;
    }
    return res;
  },

  // 2. Lấy bản tổng hợp nhận xét của một Bài nộp cụ thể (Submission-level)
  getSubmissionSummary: async (submissionId: string): Promise<SubmissionSummaryResponse> => {
    const res: any = await api.get(`/submissions/${submissionId}/summary`);
    if (res && typeof res === 'object' && 'data' in res && res.data && typeof res.data === 'object' && 'summary' in res.data) {
      return res.data;
    }
    return res;
  },

  // 2.1 Kích hoạt tạo mới bản tổng hợp bằng AI (On-demand)
  generateSubmissionSummary: async (submissionId: string): Promise<void> => {
    await api.post(`/submissions/${submissionId}/summary/generate`);
  },


  // 3. Lấy danh sách vết nguồn bài phản biện gốc (Traceability - Double-Blind Safe)
  getSourceReviews: async (
    submissionId: string,
    page = 1,
    limit = 10
  ): Promise<GetSourceReviewsResponse> => {
    const res: any = await api.get(`/submissions/${submissionId}/reviews`, {
      params: { page, limit },
    });

    if (Array.isArray(res)) {
      return {
        reviews: res,
        total: res.length,
        page,
        limit,
      };
    }

    return {
      reviews: res.data || res.reviews || [],
      total: res.pagination?.total ?? res.total ?? 0,
      page: res.pagination?.page ?? page,
      limit: res.pagination?.limit ?? limit,
    };
  },

  // 4. Cập nhật nội dung/ghi chú cho 1 cụm nhận xét (Summary Item)
  updateSummaryItem: async (
    itemId: string,
    payload: UpdateSummaryItemPayload
  ): Promise<{ id: string; updatedAt: string }> => {
    const res: any = await api.patch(`/summary-items/${itemId}`, payload);
    return res.data || res;
  },

  // 5. Phê duyệt bản tổng hợp nhận xét của bài nộp (Approve Summary)
  approveSummary: async (
    submissionId: string
  ): Promise<{ id: string; status: 'APPROVED'; updatedAt: string }> => {
    const res: any = await api.patch(`/submissions/${submissionId}/summary/approve`);
    return res.data || res;
  },
};
