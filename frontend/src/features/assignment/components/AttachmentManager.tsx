import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { assignmentMessages } from '@/constants/messages/assignment';
import type { AssignmentAttachment } from '../types/assignment.types';

interface AttachmentManagerProps {
  attachments: AssignmentAttachment[];
  onChange: (updatedAttachments: AssignmentAttachment[]) => void;
  disabled?: boolean;
}

export const AttachmentManager: React.FC<AttachmentManagerProps> = ({
  attachments,
  onChange,
  disabled = false,
}) => {
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim() || !fileUrl.trim()) return;

    const newAttachment: AssignmentAttachment = {
      id: `att-${Date.now()}`,
      file_name: fileName.trim(),
      file_url: fileUrl.trim(),
      status: 'uploading',
      progress: 0,
    };

    const updated = [...attachments, newAttachment];
    onChange(updated);
    setFileName('');
    setFileUrl('');
    setIsAdding(false);

    // Simulate progress bar upload
    simulateUpload(newAttachment.id, updated);
  };

  const simulateUpload = (id: string, currentList: AssignmentAttachment[]) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 25;
      if (progress >= 100) {
        clearInterval(interval);
        const finishedList = currentList.map((item) =>
          item.id === id ? { ...item, status: 'success' as const, progress: 100 } : item
        );
        onChange(finishedList);
      } else {
        const progressList = currentList.map((item) =>
          item.id === id ? { ...item, progress } : item
        );
        onChange(progressList);
      }
    }, 200);
  };

  const handleRetry = (id: string) => {
    const retriedList = attachments.map((item) =>
      item.id === id ? { ...item, status: 'uploading' as const, progress: 0 } : item
    );
    onChange(retriedList);
    simulateUpload(id, retriedList);
  };

  const handleCancel = (id: string) => {
    const filtered = attachments.filter((item) => item.id !== id);
    onChange(filtered);
  };

  const handleRemove = (id: string) => {
    const filtered = attachments.filter((item) => item.id !== id);
    onChange(filtered);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {assignmentMessages.form.attachmentsLabel}
        </label>
        {!isAdding && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
            disabled={disabled}
          >
            + {assignmentMessages.attachment.addAttachment}
          </Button>
        )}
      </div>

      <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
        💡 {assignmentMessages.attachment.uploadNotice}
      </p>

      {/* Add Attachment Form */}
      {isAdding && (
        <form onSubmit={handleAddLink} className="p-3 border border-gray-200 rounded-md bg-gray-50 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label htmlFor="att-file-name" className="block text-xs font-medium text-gray-600 mb-1">
                Tên tài liệu
              </label>
              <input
                id="att-file-name"
                type="text"
                placeholder={assignmentMessages.attachment.fileNamePlaceholder}
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm bg-white"
                required
              />
            </div>
            <div>
              <label htmlFor="att-file-url" className="block text-xs font-medium text-gray-600 mb-1">
                Đường dẫn (URL)
              </label>
              <input
                id="att-file-url"
                type="url"
                placeholder={assignmentMessages.attachment.fileUrlPlaceholder}
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm bg-white"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAdding(false)}
            >
              {assignmentMessages.form.cancelBtn}
            </Button>
            <Button type="submit" size="sm">
              Thêm
            </Button>
          </div>
        </form>
      )}

      {/* Attachment Items List */}
      {attachments.length > 0 && (
        <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md bg-white">
          {attachments.map((item) => (
            <li key={item.id} className="p-3 flex items-center justify-between gap-3 text-sm">
              <div className="flex-1 min-w-0">
                <a
                  href={item.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-blue-600 hover:underline truncate block"
                >
                  📎 {item.file_name}
                </a>
                <span className="text-xs text-gray-400 truncate block">{item.file_url}</span>

                {/* Progress bar */}
                {item.status === 'uploading' && (
                  <div className="mt-1.5 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-1.5 transition-all duration-200"
                      style={{ width: `${item.progress || 0}%` }}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {item.status === 'uploading' && (
                  <button
                    type="button"
                    onClick={() => handleCancel(item.id)}
                    className="text-xs text-gray-500 hover:text-red-600 px-2 py-1 border rounded"
                    aria-label={`${assignmentMessages.attachment.cancelBtn} ${item.file_name}`}
                  >
                    {assignmentMessages.attachment.cancelBtn}
                  </button>
                )}

                {item.status === 'error' && (
                  <button
                    type="button"
                    onClick={() => handleRetry(item.id)}
                    className="text-xs text-blue-600 hover:underline"
                    aria-label={`${assignmentMessages.attachment.retryBtn} ${item.file_name}`}
                  >
                    {assignmentMessages.attachment.retryBtn}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  className="text-xs text-red-600 hover:text-red-800 p-1"
                  aria-label={`${assignmentMessages.attachment.removeBtn} ${item.file_name}`}
                  disabled={disabled}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
