import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { submissionMessages } from '@/constants/messages/submission';
import { DeadlineCountdown } from '../components/DeadlineCountdown';
import { SubmissionUploadForm } from '../components/SubmissionUploadForm';
import { SubmissionVersionHistory } from '../components/SubmissionVersionHistory';
import { SubmissionFeedbackPanel } from '../components/SubmissionFeedbackPanel';
import { useAssignmentDetail } from '@/features/assignment/hooks/useAssignments';

export const StudentSubmissionPage: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const targetAssignmentId = assignmentId || '';
  const navigate = useNavigate();

  const { data: assignmentData, isLoading, isError, refetch } = useAssignmentDetail(targetAssignmentId);
  const assignment = (assignmentData as any)?.data || assignmentData;

  const [urgencyStatus, setUrgencyStatus] = useState<'OPEN' | 'URGENT' | 'EXPIRED'>('OPEN');

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto p-4">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (isError || !assignment) {
    return (
      <div className="max-w-5xl mx-auto p-4">
        <EmptyState
          type="error"
          title="Không thể tải thông tin bài tập"
          description="Vui lòng kiểm tra lại liên kết hoặc kết nối mạng."
          actionLabel="Thử lại"
          onAction={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 border border-gray-200 rounded-xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate('/student/dashboard')}
              className="text-xs bg-white text-gray-700 hover:bg-gray-50"
            >
              ← Quay lại Trang chủ
            </Button>

            {assignment.class_name && (
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                📌 Lớp {assignment.class_name} {assignment.course_code ? `(${assignment.course_code})` : ''}
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-2">
            📥 {submissionMessages.title}
          </h1>
          <p className="text-sm font-semibold text-blue-800 mt-1">{assignment.title}</p>
        </div>
      </div>

      {/* Deadline Countdown Header Card */}
      {assignment.deadline && (
        <DeadlineCountdown
          deadline={assignment.deadline}
          onStatusChange={(status) => setUrgencyStatus(status)}
        />
      )}

      {/* Assignment Detail & Requirements Card */}
      {(assignment.description || assignment.requirements || assignment.rubric) && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
            <span>📋</span>
            <span>Mô tả & Yêu cầu bài tập</span>
          </h2>

          {assignment.description && (
            <div className="text-sm text-gray-700 leading-relaxed">
              <span className="font-semibold text-gray-900 block mb-1">Mô tả:</span>
              <p className="whitespace-pre-line bg-gray-50 p-3 rounded-lg border border-gray-100">{assignment.description}</p>
            </div>
          )}

          {assignment.requirements && (
            <div className="text-sm text-gray-700 leading-relaxed">
              <span className="font-semibold text-gray-900 block mb-1">Yêu cầu chi tiết:</span>
              <p className="whitespace-pre-line bg-amber-50/50 p-3 rounded-lg border border-amber-100 text-amber-950 font-mono text-xs">{assignment.requirements}</p>
            </div>
          )}

          {assignment.rubric?.criteria?.length > 0 && (
            <div className="pt-2">
              <span className="font-semibold text-gray-900 text-xs uppercase block mb-2">Tiêu chí chấm điểm (Rubric):</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {assignment.rubric.criteria.map((c: any) => (
                  <div key={c.id} className="p-2.5 bg-blue-50/50 border border-blue-100 rounded-lg text-xs">
                    <div className="flex justify-between font-bold text-blue-900">
                      <span>{c.name}</span>
                      <span>Trọng số: {c.weight}%</span>
                    </div>
                    {c.description && <p className="text-gray-600 mt-1 text-[11px]">{c.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload Form & Version History Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SubmissionUploadForm
          assignmentId={targetAssignmentId}
          isExpired={urgencyStatus === 'EXPIRED'}
        />

        <SubmissionVersionHistory assignmentId={targetAssignmentId} />
      </div>

      {/* Feedback Panel */}
      <SubmissionFeedbackPanel assignmentId={targetAssignmentId} />
    </div>
  );
};
