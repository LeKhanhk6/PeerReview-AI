export type ReviewStatus = 'PENDING' | 'COMPLETED';

export interface MaskedSubmission {
  publicId: string;
  title: string;
  submittedAt: string;
  fileUrl: string;
}

export interface ReviewAssignmentItem {
  id: string;
  status: ReviewStatus;
  assignedAt: string;
  submission: MaskedSubmission;
}

export interface GetMyReviewsResponse {
  rows: ReviewAssignmentItem[];
  total: number;
}

export interface ReviewFilterParams {
  page?: number;
  limit?: number;
  status?: ReviewStatus | 'ALL';
}

export interface RubricCriterionDetail {
  id: string;
  name: string;
  description: string | null;
  weight: number;
}

export interface RubricDetail {
  id: string;
  description: string | null;
  criteria: RubricCriterionDetail[];
}

export interface AssignmentAttachmentInfo {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number | null;
}

export interface AssignmentDetailInfo {
  title: string;
  description: string | null;
  reviewDeadline: string;
  attachments: AssignmentAttachmentInfo[];
}

export interface SubmittedCriterionScore {
  criteriaId: string;
  score: number;
  comment: string | null;
}

export interface SubmittedReviewDetail {
  scores: SubmittedCriterionScore[];
  comment: string;
  totalScore: number;
  submittedAt: string;
}

export interface ReviewAssignmentDetail {
  reviewAssignment: {
    id: string;
    status: ReviewStatus;
    assignedAt: string;
    isPastDeadline: boolean;
    isEditable: boolean;
    userRole?: 'LEADER' | 'MEMBER';
  };
  submission: MaskedSubmission;
  assignment: AssignmentDetailInfo;
  rubric: RubricDetail | null;
  review: SubmittedReviewDetail | null;
}

export interface CriterionScoreInput {
  criteriaId: string;
  score: number;
  comment?: string;
}

export interface SubmitReviewPayload {
  overallComment: string;
  criteriaScores: CriterionScoreInput[];
}

export interface ReviewDraftState {
  reviewAssignmentId: string;
  userId: string;
  overallComment: string;
  scores: Record<string, number>;
  comments: Record<string, string>;
  updatedAt: string;
}

export interface AIMentorAnalysis {
  category: string;
  rubric_criteria: string;
  guidance_message: string;
  suggested_rewrite: string;
}
