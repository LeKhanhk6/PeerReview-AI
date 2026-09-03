import { useMutation, useQueryClient } from '@tanstack/react-query';
import { generateReviewAssignments } from '../api/review.api';
import { toast } from 'sonner';

export const useGenerateReviews = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assignmentId, reviewsPerGroup }: { assignmentId: string; reviewsPerGroup?: number }) =>
      generateReviewAssignments(assignmentId, reviewsPerGroup),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['monitor', variables.assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['synthesis', variables.assignmentId] });
      toast.success('Phân công chấm chéo thành công!');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.error?.message || 'Có lỗi xảy ra khi phân công chấm chéo';
      toast.error(msg);
    },
  });
};
