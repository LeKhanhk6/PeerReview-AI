import React from 'react';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { submissionMessages } from '@/constants/messages/submission';
import { useSubmissionHistory } from '../hooks/useSubmission';
import { toast } from 'sonner';
import { History, FileText, Download } from 'lucide-react';

interface SubmissionVersionHistoryProps {
  assignmentId: string;
}

export const SubmissionVersionHistory: React.FC<SubmissionVersionHistoryProps> = ({
  assignmentId,
}) => {
  const { data: versions = [], isLoading, isError, refetch } = useSubmissionHistory(assignmentId);

  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        type="error"
        title="Không thể tải lịch sử nộp bài"
        description={submissionMessages.error.fetchFailed}
        actionLabel="Thử lại"
        onAction={() => refetch()}
      />
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <History className="w-5 h-5 text-gray-700" /> {submissionMessages.history.title}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Danh sách tất cả các lần tải bài nộp được lưu vết tự động
          </p>
        </div>

        <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full font-mono">
          {versions.length} phiên bản
        </span>
      </div>

      {versions.length === 0 ? (
        <EmptyState
          type="no_data"
          title={submissionMessages.history.emptyTitle}
          description={submissionMessages.history.emptyDesc}
        />
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase">
                <th className="p-3">{submissionMessages.history.versionColumn}</th>
                <th className="p-3">{submissionMessages.history.fileNameColumn}</th>
                <th className="p-3">{submissionMessages.history.submittedAtColumn}</th>
                <th className="p-3 text-right">{submissionMessages.history.downloadColumn}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {versions.map((ver) => {
                const dateStr = new Date(ver.created_at).toLocaleString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                });

                let displayFileName = ver.file_name;
                if (!displayFileName && ver.file_url) {
                  try {
                    const urlObj = new URL(ver.file_url);
                    const downloadParam = urlObj.searchParams.get('download');
                    if (downloadParam) {
                      displayFileName = decodeURIComponent(downloadParam);
                    }
                  } catch (e) {
                    // Ignore
                  }
                }
                displayFileName = displayFileName || `Bản_Nộp_v${ver.version_number}.pdf`;

                return (
                  <tr
                    key={ver.id}
                    className={`hover:bg-gray-50/80 transition-colors ${
                      ver.is_current ? 'bg-blue-50/40 font-semibold' : ''
                    }`}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-gray-200 text-gray-800 rounded font-mono text-xs font-bold">
                          v{ver.version_number}
                        </span>

                        {ver.is_current && (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                            {submissionMessages.history.currentBadge}
                          </span>
                        )}

                        {ver.is_late && (
                          <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                            {submissionMessages.history.lateBadge}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-gray-900 truncate max-w-xs" title={displayFileName}>
                      <span className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-gray-500" /> {displayFileName}</span>
                    </td>
                    <td className="p-3 text-xs text-gray-500 font-mono">{dateStr}</td>
                    <td className="p-3 text-right">
                      <a
                        href={ver.file_url}
                        download={displayFileName}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          if (ver.file_url.includes('storage.googleapis.com/peer-review-bucket')) {
                            e.preventDefault();
                            toast.info('Tính năng Tải về đang ở chế độ mô phỏng. File thực tế không được lưu trên Cloud.');
                          }
                        }}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-white px-2.5 py-1 rounded border border-gray-200 shadow-sm transition-colors"
                      >
                        <Download className="w-4 h-4 mr-1" /> {submissionMessages.history.downloadColumn}
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
