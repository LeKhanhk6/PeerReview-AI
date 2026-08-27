import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import type { AIFeedbackResponse, AnalyzeCommentPayload } from '../types/ai';

const analyzeComment = async (payload: AnalyzeCommentPayload): Promise<AIFeedbackResponse> => {
  return api.post('/reviews/analyze', payload);
};

export const useAIMentor = () => {
  return useMutation({
    mutationFn: analyzeComment,
  });
};
