/**
 * Date and Deadline Utility Functions for PeerReview-AI
 */

export interface DaysLeftStatus {
  daysLeft: number;
  status: 'NEUTRAL' | 'WARNING' | 'URGENT_OR_OVERDUE';
  isOverdue: boolean;
  label: string;
  badgeClasses: string;
}

/**
 * Single Source of Truth for deadline countdown calculation and status mapping.
 * - > 3 days: NEUTRAL (slate)
 * - <= 3 days & > 1 day: WARNING (amber)
 * - <= 1 day or overdue: URGENT_OR_OVERDUE (rose)
 */
export const calculateDaysLeftStatus = (deadlineInput: string | Date): DaysLeftStatus => {
  const deadline = new Date(deadlineInput);
  const now = new Date();

  const diffTime = deadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isOverdue = diffTime < 0;

  if (isOverdue) {
    return {
      daysLeft: 0,
      status: 'URGENT_OR_OVERDUE',
      isOverdue: true,
      label: 'Quá hạn nộp bài',
      badgeClasses: 'bg-rose-50 text-rose-700 border-rose-200',
    };
  }

  if (diffDays <= 1) {
    return {
      daysLeft: diffDays,
      status: 'URGENT_OR_OVERDUE',
      isOverdue: false,
      label: diffDays === 0 ? 'Hạn nộp hôm nay' : 'Còn 1 ngày',
      badgeClasses: 'bg-rose-50 text-rose-700 border-rose-200',
    };
  }

  if (diffDays <= 3) {
    return {
      daysLeft: diffDays,
      status: 'WARNING',
      isOverdue: false,
      label: `Còn ${diffDays} ngày`,
      badgeClasses: 'bg-amber-50 text-amber-700 border-amber-200',
    };
  }

  return {
    daysLeft: diffDays,
    status: 'NEUTRAL',
    isOverdue: false,
    label: `Còn ${diffDays} ngày`,
    badgeClasses: 'bg-slate-100 text-slate-700 border-slate-200',
  };
};
