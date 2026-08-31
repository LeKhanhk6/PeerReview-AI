import React from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { reviewMessages } from '@/constants/messages/review';
import { useReviews } from '@/features/review/hooks/useReviews';
import { ReviewCard } from '@/features/review/components/ReviewCard';
import { Skeleton } from '@/components/ui/Skeleton';

export const ReviewInboxScreen: React.FC = () => {
  const { assignmentId = '' } = useParams<{ assignmentId: string }>();
  const [searchParams] = useSearchParams();
  const { data, isLoading, isError, error, refetch, setFilter } = useReviews(assignmentId);

  const currentStatusFilter = searchParams.get('status') || 'ALL';

  const handleFilterChange = (status: string) => {
    setFilter('status', status === 'ALL' ? null : status);
  };

  const reviewItems = data?.data || [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Back Navigation */}
      <div>
        <Link
          to={assignmentId ? `/student/assignments/${assignmentId}/submit` : '/student/dashboard'}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-md px-2 py-1"
        >
          <span aria-hidden="true">←</span>
          <span>{reviewMessages.inbox.backToAssignment}</span>
        </Link>
      </div>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <span>📝</span>
            <span>{reviewMessages.inbox.title}</span>
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {reviewMessages.inbox.subtitle}
          </p>
        </div>

        {/* Status Filter Buttons */}
        <div
          className="inline-flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200"
          role="group"
          aria-label="Lọc theo trạng thái chấm"
        >
          <button
            type="button"
            onClick={() => handleFilterChange('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentStatusFilter === 'ALL'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {reviewMessages.inbox.statusAll}
          </button>
          <button
            type="button"
            onClick={() => handleFilterChange('PENDING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentStatusFilter === 'PENDING'
                ? 'bg-white text-amber-800 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {reviewMessages.inbox.statusPending}
          </button>
          <button
            type="button"
            onClick={() => handleFilterChange('COMPLETED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentStatusFilter === 'COMPLETED'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {reviewMessages.inbox.statusCompleted}
          </button>
        </div>
      </div>

      {/* Double-Blind Anonymous Security Notice */}
      <div
        className="bg-indigo-50/80 border border-indigo-100 rounded-xl p-4 text-xs font-medium text-indigo-900 flex items-start gap-3 shadow-xs"
        role="note"
      >
        <span className="text-base leading-none">🛡️</span>
        <span>{reviewMessages.inbox.anonymousNotice}</span>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" aria-busy="true" role="status">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div
          className="bg-red-50 border border-red-200 rounded-xl p-6 text-center space-y-4"
          role="alert"
        >
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center text-xl font-bold">
            ⚠️
          </div>
          <div>
            <h3 className="text-base font-bold text-red-900">{reviewMessages.inbox.errorTitle}</h3>
            <p className="text-xs text-red-700 mt-1 max-w-md mx-auto">
              {error?.message || reviewMessages.inbox.errorDescription}
            </p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {reviewMessages.inbox.retryButton}
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && reviewItems.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 text-gray-400 mx-auto flex items-center justify-center text-2xl font-bold">
            📭
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-gray-900">{reviewMessages.inbox.emptyTitle}</h3>
            <p className="text-xs text-gray-500 mt-1">
              {reviewMessages.inbox.emptyDescription}
            </p>
          </div>
        </div>
      )}

      {/* List of Review Cards */}
      {!isLoading && !isError && reviewItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviewItems.map((item) => (
            <ReviewCard
              key={item.id}
              item={item}
              assignmentId={assignmentId}
              assignmentDeadline={(item as any).assignmentDeadline}
            />
          ))}
        </div>
      )}
    </div>
  );
};
