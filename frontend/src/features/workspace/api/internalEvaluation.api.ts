import { api } from '@/lib/axios';

export interface InternalEvaluationData {
  evaluateeId: string;
  c2_score: number;
  c3_score: number;
  c4_score: number;
}

export interface InternalEvaluationResponse {
  evaluatee_id: string;
  c2_score: number;
  c3_score: number;
  c4_score: number;
  updated_at: string;
}

export const submitInternalEvaluation = async (
  assignmentId: string, 
  groupId: string, 
  data: InternalEvaluationData
) => {
  const response = await api.post(
    `/assignments/${assignmentId}/groups/${groupId}/internal-evaluations`,
    data
  );
  return response;
};

export const getMyEvaluations = async (
  assignmentId: string, 
  groupId: string
): Promise<{ evaluations: InternalEvaluationResponse[]; isPublished: boolean }> => {
  const response: any = await api.get(
    `/assignments/${assignmentId}/groups/${groupId}/internal-evaluations`
  );
  if (Array.isArray(response)) {
    return { evaluations: response, isPublished: false };
  }
  return {
    evaluations: response?.evaluations || response?.data || [],
    isPublished: Boolean(response?.isPublished)
  };
};
