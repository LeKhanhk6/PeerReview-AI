export type ContributionCategory = 'HIGH' | 'NORMAL' | 'LOW' | 'FREE_RIDER' | 'INACTIVE';

export interface ActivityBreakdown {
  [actionType: string]: number;
}

export interface GroupMemberContribution {
  userId: string;
  name: string;
  totalActivities: number;
  activityBreakdown: ActivityBreakdown;
  tasksAssigned: number;
  tasksCompleted: number;
  tasksCreated: number;
  completionRate: number | null;
  contributionScore: number;
  isFreeRider: boolean;
  isInactive: boolean;
  rank?: number;
}

export interface GroupContributionSummary {
  groupId: string;
  groupName?: string;
  hasFreeRider: boolean;
  memberCount?: number;
  averageContributionScore?: number;
}

export interface DashboardOverviewMetrics {
  totalClasses: number;
  totalStudents: number;
  totalAssignments: number;
  hasAssignments: boolean;
  expectedSubmissions: number;
  actualSubmissions: number;
  expectedReviews: number;
  completedReviews: number;
  submissionRate: number;
  reviewCompletionRate: number;
  averageScore: number;
}

export interface AnalyticsFilterParams {
  classId?: string;
}

export type RiskSeverity = 'HIGH' | 'MEDIUM' | 'LOW';

export type RiskType =
  | 'DEAD_GROUP'
  | 'LOW_ACTIVITY'
  | 'LOW_CONTRIBUTION'
  | 'UNBALANCED_CONTRIBUTION'
  | 'INCOMPLETE_TASKS'
  | 'REVIEW_INACTIVITY_HIGH'
  | 'REVIEW_INACTIVITY_MEDIUM'
  | 'REVIEW_INACTIVITY';

export type RiskStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'DISMISSED';

export interface CollaborationRiskItem {
  id: string;
  groupId?: string;
  groupName?: string;
  userId?: string;
  userName?: string;
  entityType: 'GROUP' | 'USER';
  riskType: RiskType;
  severity: RiskSeverity;
  score: number;
  message: string;
  status?: RiskStatus;
  createdAt?: string;
}
