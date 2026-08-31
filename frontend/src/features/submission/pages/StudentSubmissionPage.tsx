import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
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

  const { data: assignmentData } = useAssignmentDetail(targetAssignmentId);
  const assignment = (assignmentData as any)?.data || assignmentData || {};

  const [urgencyStatus, setUrgencyStatus] = useState<'OPEN' | 'URGENT' | 'EXPIRED'>('OPEN');

  const assignmentTitle = assignment?.title || 'Bài Tập Giữa Kỳ - Thiết Kế Kiến Trúc Hệ Thống REST API';
  const deadlineStr = assignment?.deadline || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

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
              onClick={() => navigate('/student/classes')}
              className="text-xs bg-white text-gray-700 hover:bg-gray-50"
            >
              ← Quay lại danh sách lớp
            </Button>
            {assignment?.class_name && (
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                📌 Lớp {assignment.class_name} {assignment.course_code ? `(${assignment.course_code})` : ''}
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-2">
            📥 {submissionMessages.title}
          </h1>
          <p className="text-sm font-semibold text-blue-800 mt-1">{assignmentTitle}</p>
        </div>
      </div>

      {/* Deadline Countdown Header Card */}
      <DeadlineCountdown
        deadline={deadlineStr}
        onStatusChange={(status) => setUrgencyStatus(status)}
      />

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
