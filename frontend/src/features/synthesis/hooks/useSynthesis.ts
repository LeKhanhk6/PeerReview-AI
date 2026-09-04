import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { synthesisMessages } from '@/constants/messages/synthesis';
import { synthesisApi } from '../api/synthesisApi';
import type { UpdateSummaryItemPayload } from '../types/synthesis.types';

export const SYNTHESIS_QUERY_KEYS = {
  assignmentSynthesis: (assignmentId: string, timeframe?: { from?: string; to?: string }) => [
    'assignment-synthesis',
    assignmentId,
    timeframe,
  ],
  submissionSummary: (submissionId: string) => ['submission-summary', submissionId],
  sourceReviews: (submissionId: string, page: number, limit: number) => [
    'source-reviews',
    submissionId,
    page,
    limit,
  ],
};

/**
 * Hook lấy AI Synthesis cấp Bài tập (Assignment-level)
 */
export const useAssignmentSynthesis = (
  assignmentId: string,
  timeframe?: { from?: string; to?: string }
) => {
  return useQuery({
    queryKey: SYNTHESIS_QUERY_KEYS.assignmentSynthesis(assignmentId, timeframe),
    queryFn: () => synthesisApi.getAssignmentSynthesis(assignmentId, timeframe),
    enabled: Boolean(assignmentId),
    staleTime: 1000 * 60 * 5, // Cache 5 min
    retry: 1,
  });
};

/**
 * Hook lấy Bản tổng hợp cấp Bài nộp (Submission-level)
 * Áp dụng Polling 5s linh hoạt khi trạng thái là DRAFT hoặc REVIEWING
 */
export const useSubmissionSummary = (submissionId: string) => {
  return useQuery({
    queryKey: SYNTHESIS_QUERY_KEYS.submissionSummary(submissionId),
    queryFn: () => synthesisApi.getSubmissionSummary(submissionId),
    enabled: Boolean(submissionId),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      const status = data.summary?.status;
      // Dừng polling khi đã APPROVED
      if (status === 'APPROVED') return false;
      // Tự động poll 5s khi DRAFT hoặc REVIEWING
      if (status === 'DRAFT' || status === 'REVIEWING') return 5000;
      return false;
    },
  });
};

/**
 * Hook tạo mới bản tổng hợp AI (On-Demand)
 */
export const useGenerateSubmissionSummaryMutation = (submissionId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => synthesisApi.generateSubmissionSummary(submissionId),
    onSuccess: () => {
      toast.success('Bắt đầu tạo bản tổng hợp thành công!');
      queryClient.invalidateQueries({
        queryKey: SYNTHESIS_QUERY_KEYS.submissionSummary(submissionId),
      });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Có lỗi xảy ra khi gọi AI tổng hợp.';
      toast.error(msg);
    },
  });
};

/**
 * Hook lấy danh sách Vết nguồn phản biện (Source reviews) phân trang
 */
export const useSourceReviews = (submissionId: string, page = 1, limit = 10) => {
  return useQuery({
    queryKey: SYNTHESIS_QUERY_KEYS.sourceReviews(submissionId, page, limit),
    queryFn: () => synthesisApi.getSourceReviews(submissionId, page, limit),
    enabled: Boolean(submissionId),
    placeholderData: (previousData) => previousData,
  });
};

/**
 * Hook Mutation cập nhật 1 cụm nhận xét (Summary Item)
 * Xử lý lỗi 409 Conflict khi có Giáo viên/Admin khác cùng sửa
 */
export const useUpdateSummaryItemMutation = (submissionId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, payload }: { itemId: string; payload: UpdateSummaryItemPayload }) =>
      synthesisApi.updateSummaryItem(itemId, payload),
    onSuccess: () => {
      // Invalidate cache bài nộp hiện tại và tổng quan bài tập
      queryClient.invalidateQueries({
        queryKey: SYNTHESIS_QUERY_KEYS.submissionSummary(submissionId),
      });
      queryClient.invalidateQueries({
        queryKey: ['assignment-synthesis'],
      });
    },
    onError: (error: any) => {
      if (error?.status === 409 || error?.code === 'CONFLICT') {
        toast.error(synthesisMessages.errors.conflictError409);
      } else {
        toast.error(error?.message || synthesisMessages.errors.updateItemError);
      }
    },
  });
};

/**
 * Hook Mutation Phê duyệt bản tổng hợp (Approve Summary)
 */
export const useApproveSummaryMutation = (submissionId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => synthesisApi.approveSummary(submissionId),
    onSuccess: () => {
      toast.success(synthesisMessages.validation.approveSuccessToast);
      queryClient.invalidateQueries({
        queryKey: SYNTHESIS_QUERY_KEYS.submissionSummary(submissionId),
      });
      queryClient.invalidateQueries({
        queryKey: ['assignment-synthesis'],
      });
    },
    onError: (error: any) => {
      toast.error(error?.message || synthesisMessages.errors.approveError);
    },
  });
};


