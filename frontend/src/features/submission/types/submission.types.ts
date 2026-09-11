export interface SubmissionVersion {
  id: number | string;
  assignment_id: string;
  group_id?: string;
  user_id?: string;
  version_number: number;
  file_url: string;
  file_name?: string;
  is_current: boolean;
  is_late?: boolean;
  created_at: string;
}

export interface PeerReviewItem {
  id: number | string;
  reviewer_name?: string;
  score: number;
  comments?: string;
  criteria_scores?: Array<{
    criteria_id: string;
    criteria_title: string;
    score: number;
    max_score: number;
  }>;
  submitted_at: string;
}

export interface SubmissionFeedback {
  submission_id: string;
  assignment_title?: string;
  average_score?: number;
  score?: number | null;
  teacher_score?: number | null;
  teacher_feedback?: string | null;
  general_feedback?: string | null;
  reviews?: PeerReviewItem[];
  reviewCount?: number;
  summary?: {
    strengths?: string[];
    weaknesses?: string[];
    suggestions?: string[];
  };
}

export interface AssignmentDetailInfo {
  id: string;
  title: string;
  description?: string;
  deadline: string;
  class_name?: string;
  course_code?: string;
  max_score?: number;
}

export interface TeacherSubmissionGroupItem {
  groupId: string;
  groupName: string;
  status: 'SUBMITTED' | 'NOT_STARTED' | 'LATE';
  isLate: boolean;
  submission: {
    id: string;
    initialSubmittedAt: string;
    latestVersionNumber: number;
    latestFileUrl: string;
    latestSubmittedAt: string;
    totalVersions: number;
  } | null;
}

export interface TeacherSubmissionsMonitorData {
  assignment: {
    id: string;
    title: string;
    deadline: string;
    allow_early_internal_eval?: boolean;
    classId: string;
    className: string;
  };
  stats: {
    totalGroups: number;
    submittedCount: number;
    notStartedCount: number;
    lateCount: number;
  };
  groups: TeacherSubmissionGroupItem[];
}


