import React from 'react';
import { toast } from 'sonner';
import { reviewMessages } from '@/constants/messages/review';
import type { MaskedSubmission, AssignmentDetailInfo } from '../types/review.types';
import { Lock, ShieldCheck, FileText, Pin, Paperclip } from 'lucide-react';

interface SubmissionViewerPanelProps {
  submission: MaskedSubmission;
  assignment: AssignmentDetailInfo;
}

export const SubmissionViewerPanel: React.FC<SubmissionViewerPanelProps> = ({
  submission,
  assignment,
}) => {
  const formattedSubmittedDate = submission.submittedAt
    ? new Date(submission.submittedAt).toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : 'N/A';

  const handleSimulatedDownload = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (submission.fileUrl?.includes('storage.googleapis.com/peer-review-bucket')) {
      e.preventDefault();
      toast.info('Tính năng xem/tải file bài nộp đang ở chế độ mô phỏng.');
    }
  };

  return (
    <div
      className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6 h-full overflow-y-auto"
      role="region"
      aria-label={reviewMessages.writing.submissionPanelTitle}
    >
      {/* Anonymous Header */}
      <div className="border-b border-gray-100 pb-4 space-y-1">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-gray-700" aria-hidden="true" />
          <h2 className="text-lg font-extrabold text-gray-900">
            {submission.title || reviewMessages.card.anonymousTitle}
          </h2>
        </div>
        <p className="text-xs text-gray-500">
          {reviewMessages.card.submittedAt} <span className="font-semibold text-gray-700">{formattedSubmittedDate}</span>
        </p>
      </div>

      {/* Double Blind Anonymous Security Banner */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-xs text-indigo-900 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>{reviewMessages.inbox.anonymousNotice}</span>
      </div>

      {/* Submission Files & Preview Action */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <FileText className="w-4 h-4" /> {reviewMessages.writing.submissionPanelTitle}
        </h3>

        {submission.fileUrl ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-base">
                PDF
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {submission.publicId ? `Submission_${submission.publicId}.pdf` : 'File_Nop_Bai.pdf'}
                </p>
                <p className="text-xs text-gray-500">Proxy File Download</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200">
              {submission.fileUrl?.match(/\.(pdf|jpg|jpeg|png|gif|webp)(\?|$)/i) && (
                <a
                  href={submission.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleSimulatedDownload}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50 transition-colors shadow-2xs"
                >
                  <span>↗</span>
                  <span>{reviewMessages.writing.openInNewTab}</span>
                </a>
              )}
              <a
                href={`${submission.fileUrl}?download=Submission_${submission.publicId || 'Anonymous'}.${submission.fileUrl.split('.').pop()?.split('?')[0] || 'pdf'}`}
                download={`Submission_${submission.publicId || 'Anonymous'}.${submission.fileUrl.split('.').pop()?.split('?')[0] || 'pdf'}`}
                onClick={handleSimulatedDownload}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-2xs"
              >
                <span>⬇</span>
                <span>{reviewMessages.writing.downloadSubmissionFile}</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-6 text-center text-xs text-gray-500">
            {reviewMessages.writing.noSubmissionFile}
          </div>
        )}
      </div>

      {/* Assignment Description & Reference Attachments */}
      <div className="space-y-3 border-t border-gray-100 pt-5">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <Pin className="w-4 h-4" /> {assignment.title || 'Mô tả bài tập'}
        </h3>
        {assignment.description && (
          <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 p-3.5 rounded-lg border border-gray-200 whitespace-pre-line">
            {assignment.description}
          </p>
        )}

        {/* Teacher Attachments */}
        {assignment.attachments && assignment.attachments.length > 0 && (
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-semibold text-gray-700">
              {reviewMessages.writing.assignmentAttachmentsTitle}
            </h4>
            <div className="space-y-1.5">
              {assignment.attachments.map((att) => (
                <a
                  key={att.id}
                  href={att.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 bg-white border border-gray-200 rounded-lg text-xs hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group"
                >
                  <span className="font-medium text-gray-800 group-hover:text-indigo-700 truncate flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5" /> {att.fileName}
                  </span>
                  <span className="text-indigo-600 font-semibold text-[11px]">Tải về →</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
