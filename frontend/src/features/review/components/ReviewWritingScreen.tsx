import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { reviewMessages } from '@/constants/messages/review';
import { useReviewDetail } from '../hooks/useReviewDetail';
import { useSubmitReview } from '../hooks/useSubmitReview';
import { useReviewDraft } from '../hooks/useReviewDraft';
import { SubmissionViewerPanel } from './SubmissionViewerPanel';
import { RubricScoringForm } from './RubricScoringForm';
import { Skeleton } from '@/components/ui/Skeleton';
import type { SubmitReviewPayload } from '../types/review.types';
import { Edit3, CheckCircle, Ban, AlertTriangle } from 'lucide-react';

export const ReviewWritingScreen: React.FC = () => {
  const { assignmentId = '', reviewAssignmentId = '' } = useParams<{
    assignmentId: string;
    reviewAssignmentId: string;
  }>();

  const navigate = useNavigate();

  const { data, isLoading, isError, error, refetch } = useReviewDetail(reviewAssignmentId);
  const submitMutation = useSubmitReview(reviewAssignmentId);

  const detail = data;
  const reviewAssignment = detail?.reviewAssignment;
  const submission = detail?.submission;
  const assignment = detail?.assignment;
  const rubric = detail?.rubric;
  const existingReview = detail?.review;

  const isCompleted = reviewAssignment?.status === 'COMPLETED';
  const isPastDeadline = Boolean(reviewAssignment?.isPastDeadline);
  const isReadOnly = isCompleted || isPastDeadline || reviewAssignment?.userRole !== 'LEADER';

  const criteriaList = rubric?.criteria || [];

  const {
    overallComment,
    scores,
    comments,
    lastSavedAt,
    isSaving,
    saveDraft,
    clearDraft,
  } = useReviewDraft(reviewAssignmentId, criteriaList);

  const handleSubmitReview = async (payload: SubmitReviewPayload) => {
    try {
      await submitMutation.mutateAsync(payload);
      clearDraft();
      toast.success(reviewMessages.writing.submitSuccessToast);
      navigate(`/student/assignments/${assignmentId}/reviews`);
    } catch (err: any) {
      toast.error(err?.message || 'Không thể nộp bài phản biện. Vui lòng thử lại.');
    }
  };

  return (
    <div className="h-full w-full min-w-0 overflow-y-auto space-y-6 max-w-7xl mx-auto pb-12 pr-1 pt-4">
      {/* Back Navigation */}
      <div>
        <Link
          to={`/student/assignments/${assignmentId}/reviews`}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand-primary transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary rounded-md px-2 py-1"
        >
          <span aria-hidden="true">←</span>
          <span>{reviewMessages.writing.backToInbox}</span>
        </Link>
      </div>

      {/* Screen Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="space-y-1.5">
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Edit3 className="w-6 h-6 text-slate-700" />
            <span>{reviewMessages.writing.pageTitle}</span>
          </h1>
          <p className="text-xs md:text-sm font-bold text-brand-primary mt-0.5">
            {assignment?.title || 'Bài tập phản biện'}
          </p>
        </div>

        {/* Read Only Banners */}
        {isCompleted && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 text-xs font-bold text-emerald-800 flex items-center gap-2 shadow-2xs">
            <CheckCircle className="w-4 h-4" />
            <span>{reviewMessages.writing.readOnlyBannerCompleted}</span>
          </div>
        )}
        {isPastDeadline && !isCompleted && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-xs font-bold text-red-800 flex items-center gap-2 shadow-2xs">
            <Ban className="w-4 h-4" />
            <span>{reviewMessages.writing.readOnlyBannerExpired}</span>
          </div>
        )}
        {!isCompleted && !isPastDeadline && reviewAssignment?.userRole === 'MEMBER' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 text-xs font-bold text-blue-800 flex items-center gap-2 shadow-2xs">
            <AlertTriangle className="w-4 h-4" />
            <span>ℹ️ Bạn đang xem ở chế độ Thành viên. Chỉ Nhóm trưởng mới có quyền điền điểm và Nộp bài. Hãy thảo luận với nhóm của bạn!</span>
          </div>
        )}
        {!isCompleted && !isPastDeadline && reviewAssignment?.userRole === 'LEADER' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-xs font-bold text-amber-800 flex items-center gap-2 shadow-2xs">
            <AlertTriangle className="w-4 h-4" />
            <span>⚠️ Bạn là Nhóm trưởng. Hãy thảo luận để thống nhất điểm với các thành viên khác trước khi nộp. Nhóm chỉ được nộp 1 lần duy nhất!</span>
          </div>
        )}
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" aria-busy="true" role="status">
          <Skeleton className="h-[600px] rounded-2xl" />
          <Skeleton className="h-[600px] rounded-2xl" />
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div
          className="bg-red-50 border border-red-200 rounded-xl p-8 text-center space-y-4 max-w-xl mx-auto"
          role="alert"
        >
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-red-900">{reviewMessages.writing.errorDetailTitle}</h3>
            <p className="text-xs text-red-700 mt-1">
              {error?.message || reviewMessages.writing.errorDetailDescription}
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

      {/* Split-Screen Main Content (DOM order: Left Submission Panel -> Right Scoring Form) */}
      {!isLoading && !isError && detail && submission && assignment && rubric && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[650px]">
          {/* Panel 1 (DOM Order 1): Submission Viewer */}
          <div className="h-full">
            <SubmissionViewerPanel submission={submission} assignment={assignment} />
          </div>

          {/* Panel 2 (DOM Order 2): Rubric Scoring Form */}
          <div className="h-full">
            <RubricScoringForm
              rubric={rubric}
              existingReview={existingReview}
              isReadOnly={isReadOnly}
              draftComment={overallComment}
              draftScores={scores}
              draftComments={comments}
              lastSavedAt={lastSavedAt}
              isSavingDraft={isSaving}
              onDraftChange={saveDraft}
              onSubmitReview={handleSubmitReview}
              isSubmitting={submitMutation.isPending}
            />
          </div>
        </div>
      )}
    </div>
  );
};
