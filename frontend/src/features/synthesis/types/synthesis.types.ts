export type SynthesisStatus = 'DRAFT' | 'REVIEWING' | 'APPROVED';

export type TopicCategory = 'STRENGTH' | 'WEAKNESS' | 'SUGGESTION' | 'QUESTION';

export interface AssignmentSynthesisResponse {
  requestId: string;
  summary: string;
  reason?: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  totalReviews: number;
  reviewsUsed: number;
  confidence: number;
}

export interface ReviewSummaryHeader {
  id: string;
  submissionId?: string;
  status: SynthesisStatus;
  updatedBy: string | null;
  updatedAt: string;
  generatedAt: string;
}

export interface SummaryItem {
  id: string;
  summary_id?: string;
  topic_category: TopicCategory;
  content: string;
  note?: string;
  frequency_count: number;
  is_teacher_edited: boolean;
  source_review_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface SubmissionSummaryResponse {
  summary: ReviewSummaryHeader;
  items: SummaryItem[];
  sourceReviewsCount: number;
}

export interface SourceReviewItem {
  id: string;
  total_score: number;
  overall_comment: string;
  submitted_at: string;
  reviewer_group_id?: string;
  status?: string;
}

export interface GetSourceReviewsResponse {
  reviews: SourceReviewItem[];
  total: number;
  page: number;
  limit: number;
}

export interface UpdateSummaryItemPayload {
  content?: string;
  note?: string;
  updatedAt: string;
}
