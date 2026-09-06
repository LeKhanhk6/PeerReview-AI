import React from 'react';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { submissionMessages } from '@/constants/messages/submission';
import { useSubmissionFeedback } from '../hooks/useSubmission';
import { MessageSquare, User, Users, UserCircle2 } from 'lucide-react';

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

  const hasReviews = (feedback?.reviews?.length ?? 0) > 0;
  const hasSummary = Boolean(feedback?.summary);
  const hasTeacherFeedback = Boolean(feedback?.teacher_feedback);

  if (!feedback || (!hasReviews && !hasTeacherFeedback && !hasSummary)) {
    return (
      <EmptyState
        type="no_data"
        title={submissionMessages.feedback.emptyTitle}
        description={submissionMessages.feedback.emptyDesc}
      />
    );
  }

  const rawScore = feedback.average_score ?? feedback.score;
  const averageScore = rawScore !== undefined && rawScore !== null
    ? (rawScore > 10 ? Number((rawScore / 10).toFixed(1)) : Number(rawScore.toFixed(1)))
    : undefined;
  const teacherScore = feedback.teacher_score !== undefined && feedback.teacher_score !== null
    ? (feedback.teacher_score > 10 ? Number((feedback.teacher_score / 10).toFixed(1)) : Number(feedback.teacher_score.toFixed(1)))
    : undefined;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-gray-700" /> {submissionMessages.feedback.title}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Tổng hợp kết quả đánh giá từ Giáo viên và Bài chấm chéo
          </p>
        </div>

        {averageScore !== undefined && averageScore !== null && (
          <div className="text-right">
            <span className="text-xs text-gray-500 font-semibold uppercase block">
              {submissionMessages.feedback.scoreTitle}
            </span>
            <span className="text-2xl font-black text-purple-600 font-mono">
              {averageScore} <span className="text-xs font-normal text-gray-500">/ 10</span>
            </span>
          </div>
        )}
      </div>

      {/* Teacher Feedback Section */}
      {hasTeacherFeedback && (
        <div className="bg-purple-50/60 border border-purple-200 p-4 rounded-xl space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4" />
              <span>{submissionMessages.feedback.teacherFeedbackTitle}</span>
            </h3>

            {teacherScore !== undefined && (
              <span className="text-sm font-black text-purple-700 bg-white px-2 py-0.5 rounded border border-purple-200 font-mono">
                {teacherScore} / 10
              </span>
            )}
          </div>

          <p className="text-sm text-purple-950 font-medium leading-relaxed">
            {feedback.teacher_feedback}
          </p>
        </div>
      )}

      {/* AI Summary Section */}
      {hasSummary && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5 pt-2">
            <MessageSquare className="w-4 h-4" />
            <span>Tổng hợp đánh giá (AI Synthesis)</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-3">
            {(feedback.summary?.strengths?.length ?? 0) > 0 && (
              <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-lg">
                <h4 className="font-bold text-emerald-800 mb-2">Điểm mạnh</h4>
                <ul className="list-disc pl-4 space-y-1 text-emerald-900 text-xs">
                  {feedback.summary?.strengths?.map((item: string, i: number) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            )}
            {(feedback.summary?.weaknesses?.length ?? 0) > 0 && (
              <div className="bg-red-50/50 border border-red-100 p-3 rounded-lg">
                <h4 className="font-bold text-red-800 mb-2">Điểm yếu cần cải thiện</h4>
                <ul className="list-disc pl-4 space-y-1 text-red-900 text-xs">
                  {feedback.summary?.weaknesses?.map((item: string, i: number) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            )}
          </div>
          {(feedback.summary?.suggestions?.length ?? 0) > 0 && (
            <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-lg mt-3 text-sm">
              <h4 className="font-bold text-blue-800 mb-2">Góp ý phát triển</h4>
              <ul className="list-disc pl-4 space-y-1 text-blue-900 text-xs">
                {feedback.summary?.suggestions?.map((item: string, i: number) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Peer Reviews List */}
      {hasReviews && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            <span>{submissionMessages.feedback.peerReviewsTitle}</span>
          </h3>

          <div className="space-y-3">
            {feedback.reviews?.map((rev: any, index: number) => {
              const dateStr = rev.submitted_at ? new Date(rev.submitted_at).toLocaleDateString('vi-VN') : 'vừa xong';
              const revScore = rev.score !== undefined && rev.score !== null
                ? (rev.score > 10 ? Number((rev.score / 10).toFixed(1)) : Number(Number(rev.score).toFixed(1)))
                : null;

              return (
                <div key={rev.id || index} className="bg-gray-50 border border-gray-200 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-800 flex items-center gap-1.5">
                      <UserCircle2 className="w-4 h-4 text-gray-500" /> {rev.reviewer_name || `Sinh viên ẩn danh #${index + 1}`}
                    </span>
                    {revScore !== null && (
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono">
                        {revScore} / 10
                      </span>
                    )}
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
