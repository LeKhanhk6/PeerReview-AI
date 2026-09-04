import React, { useState } from 'react';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { workspaceMessages } from '@/constants/messages/workspace';
import { toast } from 'sonner';
import { useGroupFiles, useCreateGroupFile } from '../hooks/useWorkspace';

interface GroupFileManagerProps {
  groupId: string;
}

export const GroupFileManager: React.FC<GroupFileManagerProps> = ({ groupId }) => {
  const { data: rawFiles, isLoading, isError, refetch } = useGroupFiles(groupId);
  const files: any[] = Array.isArray(rawFiles) ? rawFiles : (rawFiles as any)?.data || [];
  const createFile = useCreateGroupFile(groupId);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Simulated upload (Pattern 02.3 AttachmentManager)
  // TODO: Connect with multipart FormData backend storage endpoint in future phase
  const handleSimulatedFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(20);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 35;
      });
    }, 200);

    setTimeout(async () => {
      clearInterval(interval);
      setUploadProgress(100);

      try {
        await createFile.mutateAsync({
          file_name: selectedFile.name,
          file_url: URL.createObjectURL(selectedFile),
        });
        toast.success(workspaceMessages.files.uploadSuccess);
      } catch (err: any) {
        toast.error(err.message || 'Không thể tải file lên.');
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
        e.target.value = '';
      }
    }, 1000);
  };

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
        title="Không thể tải danh sách tài liệu"
        description={workspaceMessages.error.fetchFailed}
        actionLabel="Thử lại"
        onAction={() => refetch()}
      />
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4 flex flex-col flex-1 min-h-0">
      {/* Header & Upload Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4 shrink-0">
        <div>
          <h2 className="text-base font-bold text-gray-900">
            📁 {workspaceMessages.files.title}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Tải lên và chia sẻ tài liệu nhóm học phần</p>
        </div>

        <div>
          <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg cursor-pointer transition-colors shadow-sm">
            <span>{workspaceMessages.files.uploadBtn}</span>
            <input
              type="file"
              onChange={handleSimulatedFileUpload}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Simulated Upload Progress Bar */}
      {isUploading && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
          <div className="flex justify-between text-xs font-semibold text-blue-900">
            <span>Đang tải file lên...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={uploadProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Tiến trình tải file"
            className="w-full bg-blue-200 h-2 rounded-full overflow-hidden"
          >
            <div
              className="bg-blue-600 h-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Files Table List */}
      {files.length === 0 ? (
        <EmptyState
          type="no_data"
          title={workspaceMessages.files.emptyTitle}
          description={workspaceMessages.files.emptyDesc}
        />
      ) : (
        <div className="overflow-auto border border-gray-200 rounded-lg flex-1 min-h-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase">
                <th className="p-3">{workspaceMessages.files.fileName}</th>
                <th className="p-3">{workspaceMessages.files.uploadedBy}</th>
                <th className="p-3">{workspaceMessages.files.createdAt}</th>
                <th className="p-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {files.map((file) => {
                const dateStr = new Date(file.created_at).toLocaleDateString('vi-VN');

                return (
                  <tr key={file.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="p-3 font-semibold text-gray-900 flex items-center gap-2">
                      <span aria-hidden="true">📄</span>
                      <span className="truncate max-w-xs">{file.file_name}</span>
                    </td>
                    <td className="p-3 text-xs text-gray-600">
                      👤 {file.uploader_name || 'Thành viên'}
                    </td>
                    <td className="p-3 text-xs text-gray-500 font-mono">{dateStr}</td>
                    <td className="p-3 text-right">
                      <a
                        href={file.file_url}
                        download={file.file_name}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded border border-blue-200 transition-colors"
                      >
                        📥 {workspaceMessages.files.downloadBtn}
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
