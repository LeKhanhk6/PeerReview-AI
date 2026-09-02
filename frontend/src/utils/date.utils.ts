/**
 * Date and Deadline Utility Functions for PeerReview-AI
 */

export type DaysLeftVariant = 'emerald' | 'amber' | 'rose' | 'slate';

export type DaysLeftKey =
  | 'unspecified'
  | 'expiredToday'
  | 'expiredDaysAgo'
  | 'dueToday'
  | 'daysLeft';

export interface DaysLeftStatus {
  daysLeft: number;
  daysAgo: number;
  key: DaysLeftKey;
  variant: DaysLeftVariant;
  isExpired: boolean;
  status: 'NEUTRAL' | 'WARNING' | 'URGENT_OR_OVERDUE';
  isOverdue: boolean;
  label: string;
  badgeClasses: string;
}

/**
 * Single Source of Truth for deadline countdown calculation and status mapping.
 * - > 3 days: NEUTRAL (emerald/slate)
 * - <= 3 days & > 1 day: WARNING (amber)
 * - <= 1 day or overdue: URGENT_OR_OVERDUE (rose)
 */
export const calculateDaysLeftStatus = (
  deadlineInput: string | Date | null | undefined
): DaysLeftStatus => {
  if (!deadlineInput) {
    return {
      daysLeft: 0,
      daysAgo: 0,
      key: 'unspecified',
      variant: 'slate',
      isExpired: false,
      status: 'NEUTRAL',
      isOverdue: false,
      label: 'Không xác định',
      badgeClasses: 'bg-slate-100 text-slate-700 border-slate-200',
    };
  }

  const deadline = new Date(deadlineInput);
  if (isNaN(deadline.getTime())) {
    return {
      daysLeft: 0,
      daysAgo: 0,
      key: 'unspecified',
      variant: 'slate',
      isExpired: false,
      status: 'NEUTRAL',
      isOverdue: false,
      label: 'Không xác định',
      badgeClasses: 'bg-slate-100 text-slate-700 border-slate-200',
    };
  }

  const now = new Date();
  const diffTime = deadline.getTime() - now.getTime();
  const isSameDay = deadline.toDateString() === now.toDateString();

  if (diffTime < 0) {
    if (isSameDay) {
      return {
        daysLeft: 0,
        daysAgo: 0,
        key: 'expiredToday',
        variant: 'rose',
        isExpired: true,
        status: 'URGENT_OR_OVERDUE',
        isOverdue: true,
        label: 'Quá hạn nộp bài',
        badgeClasses: 'bg-rose-50 text-rose-700 border-rose-200',
      };
    }

    const diffDays = Math.ceil(Math.abs(diffTime) / (1000 * 60 * 60 * 24));
    return {
      daysLeft: -diffDays,
      daysAgo: diffDays,
      key: 'expiredDaysAgo',
      variant: 'rose',
      isExpired: true,
      status: 'URGENT_OR_OVERDUE',
      isOverdue: true,
      label: `Đã quá hạn ${diffDays} ngày`,
      badgeClasses: 'bg-rose-50 text-rose-700 border-rose-200',
    };
  }

  if (isSameDay) {
    return {
      daysLeft: 0,
      daysAgo: 0,
      key: 'dueToday',
      variant: 'amber',
      isExpired: false,
      status: 'URGENT_OR_OVERDUE',
      isOverdue: false,
      label: 'Hạn nộp hôm nay',
      badgeClasses: 'bg-amber-50 text-amber-700 border-amber-200',
    };
  }

  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 3) {
    return {
      daysLeft: diffDays,
      daysAgo: 0,
      key: 'daysLeft',
      variant: 'amber',
      isExpired: false,
      status: 'WARNING',
      isOverdue: false,
      label: `Còn ${diffDays} ngày`,
      badgeClasses: 'bg-amber-50 text-amber-700 border-amber-200',
    };
  }

  return {
    daysLeft: diffDays,
    daysAgo: 0,
    key: 'daysLeft',
    variant: 'emerald',
    isExpired: false,
    status: 'NEUTRAL',
    isOverdue: false,
    label: `Còn ${diffDays} ngày`,
    badgeClasses: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
};

/**
 * Formats structured DaysLeftStatus into localized message string using workspaceMessages.deadline dict.
 */
export function formatDaysLeftLabel(
  status: DaysLeftStatus,
  deadlineDict?: {
    unspecified: string;
    expiredToday: string;
    expiredDaysAgo: string;
    dueToday: string;
    daysLeft: string;
  }
): string {
  if (!deadlineDict) return status.label || 'Không xác định';
  switch (status.key) {
    case 'unspecified':
      return deadlineDict.unspecified;
    case 'expiredToday':
      return deadlineDict.expiredToday;
    case 'expiredDaysAgo':
      return deadlineDict.expiredDaysAgo.replace('{days}', String(status.daysAgo));
    case 'dueToday':
      return deadlineDict.dueToday;
    case 'daysLeft':
      return deadlineDict.daysLeft.replace('{days}', String(status.daysLeft));
    default:
      return status.label || deadlineDict.unspecified;
  }
}

/**
 * Formats date into Vietnamese display string (dd/mm/yyyy)
 */
export function formatDateVN(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
