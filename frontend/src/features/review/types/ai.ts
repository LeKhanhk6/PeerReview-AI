export type AIFeedbackCategory = 
  | "1. Tiêu cực/xúc phạm"
  | "2. Qua loa/hời hợt"
  | "3. Khen chung chung"
  | "4. Góp ý chi tiết bám sát tiêu chí chấm điểm"
  | "UNKNOWN";

export type RubricCriteria = 
  | "Nội dung" 
  | "Hình thức" 
  | "Thái độ" 
  | "Sáng tạo"
  | "UNKNOWN";

export interface AIFeedbackResponse {
  category: AIFeedbackCategory;
  rubric_criteria: RubricCriteria;
  guidance_message: string;
  suggested_rewrite: string;
}

export interface AnalyzeCommentPayload {
  comment: string;
}
