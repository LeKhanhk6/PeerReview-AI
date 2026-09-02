import React from 'react';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { submissionMessages } from '@/constants/messages/submission';
import { useSubmissionFeedback } from '../hooks/useSubmission';

interface SubmissionFeedbackPanelProps {
  assignmentId: string;
}

export const SubmissionFeedbackPanel: React.FC<SubmissionFeedbackPanelProps> = ({
  assignmentId,
}) => {
  const { data: feedback, isLoading, isError, error, refetch } = useSubmissionFeedback(assignmentId);

  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (isError) {
    const is404 = (error as any)?.response?.status === 404 || (error as any)?.status === 404;
    if (is404) {
      return (
        <EmptyState
          type="no_data"
          title={submissionMessages.feedback.emptyTitle}
          description={submissionMessages.feedback.emptyDesc}
        />
      );
    }

    return (
      <EmptyState
        type="error"
        title="Không thể tải phản hồi bài nộp"
        description={submissionMessages.error.fetchFailed}
        actionLabel="Thử lại"
        onAction={() => refetch()}
      />
    );
  }

  if (!feedback || (feedback.reviews.length === 0 && !feedback.teacher_feedback)) {
    return (
      <EmptyState
        type="no_data"
        title={submissionMessages.feedback.emptyTitle}
        description={submissionMessages.feedback.emptyDesc}
      />
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div>
          <h2 className="text-base font-bold text-gray-900">
            💬 {submissionMessages.feedback.title}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Tổng hợp kết quả đánh giá từ Giáo viên và Bài chấm chéo
          </p>
        </div>

        {feedback.average_score !== undefined && (
          <div className="text-right">
            <span className="text-xs text-gray-500 font-semibold uppercase block">
              {submissionMessages.feedback.scoreTitle}
            </span>
            <span className="text-2xl font-black text-purple-600 font-mono">
              {feedback.average_score} <span className="text-xs font-normal text-gray-500">/ 10</span>
            </span>
          </div>
        )}
      </div>

      {/* Teacher Feedback Section */}
      {feedback.teacher_feedback && (
        <div className="bg-purple-50/60 border border-purple-200 p-4 rounded-xl space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>👨‍🏫</span>
              <span>{submissionMessages.feedback.teacherFeedbackTitle}</span>
            </h3>

            {feedback.teacher_score !== undefined && (
              <span className="text-sm font-black text-purple-700 bg-white px-2 py-0.5 rounded border border-purple-200 font-mono">
                {feedback.teacher_score} / 10
              </span>
            )}
          </div>

          <p className="text-sm text-purple-950 font-medium leading-relaxed">
            {feedback.teacher_feedback}
          </p>
        </div>
      )}

      {/* Peer Reviews List */}
      {feedback.reviews.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
            <span>👥</span>
            <span>{submissionMessages.feedback.peerReviewsTitle}</span>
          </h3>

          <div className="space-y-3">
            {feedback.reviews.map((rev, index) => {
              const dateStr = rev.submitted_at ? new Date(rev.submitted_at).toLocaleDateString('vi-VN') : 'vừa xong';

              return (
                <div key={rev.id || index} className="bg-gray-50 border border-gray-200 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-800">
                      🎭 {rev.reviewer_name || `Sinh viên ẩn danh #${index + 1}`}
                    </span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono">
                      {rev.score} / 10
                    </span>
                  </div>

                  <p className="text-sm text-gray-800 leading-relaxed">
                    {rev.comments || 'Không có nhận xét chi tiết.'}
                  </p>

                  <div className="text-right text-[11px] text-gray-400 font-mono">
                    Đã chấm ngày {dateStr}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
