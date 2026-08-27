/**
 * Source of truth: backend/src/services/analytics.service.js — cập nhật song song nếu backend thay đổi.
 */
import type { ContributionCategory, GroupMemberContribution } from '../types/analytics.types';

export const CONTRIBUTION_THRESHOLDS = {
  HIGH_SCORE: 0.75,       // >= 75%
  NORMAL_SCORE: 0.35,     // 35% - 74%
  LOW_SCORE: 0.10,        // 10% - 34%
  FREE_RIDER_SCORE: 0.10, // < 10%
} as const;

export const getMemberCategory = (member: GroupMemberContribution): ContributionCategory => {
  if (member.isInactive || (member.totalActivities === 0 && member.tasksAssigned === 0 && member.tasksCreated === 0)) {
    return 'INACTIVE';
  }
  if (member.isFreeRider || member.contributionScore < CONTRIBUTION_THRESHOLDS.FREE_RIDER_SCORE) {
    return 'FREE_RIDER';
  }
  if (member.contributionScore >= CONTRIBUTION_THRESHOLDS.HIGH_SCORE) {
    return 'HIGH';
  }
  if (member.contributionScore >= CONTRIBUTION_THRESHOLDS.NORMAL_SCORE) {
    return 'NORMAL';
  }
  return 'LOW';
};
