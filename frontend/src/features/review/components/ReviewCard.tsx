import React from 'react';
import { Link } from 'react-router-dom';
import { reviewMessages } from '@/constants/messages/review';
import { DeadlineCountdown } from '@/features/submission/components/DeadlineCountdown';
import type { ReviewAssignmentItem } from '../types/review.types';

interface ReviewCardProps {
  item: ReviewAssignmentItem;
  assignmentDeadline?: string;
  assignmentId: string;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  item,
  assignmentDeadline,
  assignmentId,
}) => {
  const isCompleted = item.status === 'COMPLETED';

  const isPastDeadline = Boolean(
    assignmentDeadline && new Date(assignmentDeadline).getTime() < Date.now()
  );

  const formattedSubmittedDate = item.submission?.submittedAt
    ? new Date(item.submission.submittedAt).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'N/A';

  const formattedAssignedDate = item.assignedAt
    ? new Date(item.assignedAt).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : 'N/A';

  const getStatusBadge = () => {
    if (isCompleted) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <span aria-hidden="true">✓</span>
          <span>{reviewMessages.card.statusCompletedBadge}</span>
        </span>
      );
    }

    if (isPastDeadline) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
          <span aria-hidden="true">⛔</span>
          <span>{reviewMessages.card.statusExpiredBadge}</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
        <span aria-hidden="true">⏳</span>
        <span>{reviewMessages.card.statusPendingBadge}</span>
      </span>
    );
  };

  return (
    <div
      className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all space-y-5"
      role="article"
      aria-label={`${reviewMessages.card.ariaCardLabel} ${item.submission?.publicId || ''}`}
    >
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-soft-bg border border-brand-primary/20 flex items-center justify-center text-brand-primary font-mono font-bold text-sm">
            🔒
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span>{item.submission?.title || `${reviewMessages.card.anonymousTitle} #${item.id}`}</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {reviewMessages.card.assignedAt} {formattedAssignedDate}
            </p>
          </div>
        </div>

        <div>{getStatusBadge()}</div>
      </div>

      {/* Submission details */}
      <div className="bg-gray-50 rounded-lg p-4 text-xs space-y-1.5 text-gray-600">
        <div className="flex items-center justify-between">
          <span className="font-medium">{reviewMessages.card.submittedAt}</span>
          <span className="font-semibold text-gray-900">{formattedSubmittedDate}</span>
        </div>
      </div>

      {/* Reusable Countdown Timer if pending & deadline exists */}
      {!isCompleted && assignmentDeadline && (
        <div>
          <DeadlineCountdown deadline={assignmentDeadline} />
        </div>
      )}

      {/* Action Button */}
      <div className="pt-2 flex justify-end">
        {isCompleted ? (
          <Link
            to={assignmentId ? `/student/assignments/${assignmentId}/reviews/${item.id}` : `/student/reviews/${item.id}`}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-bold text-brand-primary bg-brand-soft-bg hover:bg-brand-primary/10 border border-brand-primary/20 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
          >
            <span>{reviewMessages.card.actionView}</span>
            <span className="ml-1.5" aria-hidden="true">→</span>
          </Link>
        ) : isPastDeadline ? (
          <button
            disabled
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed"
          >
            <span>{reviewMessages.card.actionExpired}</span>
          </button>
        ) : (
          <Link
            to={assignmentId ? `/student/assignments/${assignmentId}/reviews/${item.id}` : `/student/reviews/${item.id}`}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-primary hover:bg-brand-primary/90 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
          >
            <span>{reviewMessages.card.actionStart}</span>
            <span className="ml-1.5" aria-hidden="true">→</span>
          </Link>
        )}
      </div>
    </div>
  );
};
