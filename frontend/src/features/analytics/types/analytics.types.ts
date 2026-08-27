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
