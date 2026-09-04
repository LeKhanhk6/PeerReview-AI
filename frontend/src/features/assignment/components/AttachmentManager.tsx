import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { assignmentMessages } from '@/constants/messages/assignment';
import type { AssignmentAttachment } from '../types/assignment.types';
import { assignmentApi } from '../api/assignment.api';
import { toast } from 'sonner';
import { Paperclip, X } from 'lucide-react';


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
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim() || !fileUrl.trim()) return;

    const newAttachment: AssignmentAttachment = {
      id: `att-${Date.now()}`,
      file_name: fileName.trim(),
      file_url: fileUrl.trim(),
      status: 'success',
      progress: 100,
    };

    const updated = [...attachments, newAttachment];
    onChange(updated);
    setFileName('');
    setFileUrl('');
    setIsAddingLink(false);
  };

  const processUpload = async (file: File, tempId: string, currentAttachments: AssignmentAttachment[]) => {
      try {
          const result = await assignmentApi.uploadAttachment(file);
          // Find the temp attachment in the current list and replace it
          onChange(currentAttachments.map(item => 
              item.id === tempId ? {
                  ...item,
                  file_url: result.file_url,
                  file_type: result.file_type,
                  file_size: result.file_size,
                  status: 'success',
                  progress: 100
              } : item
          ));
      } catch (err: any) {
          console.error(err);
          toast.error('Lỗi khi tải lên file đính kèm: ' + (err.message || ''));
          onChange(currentAttachments.map(item => 
              item.id === tempId ? { ...item, status: 'error' } : item
          ));
      } finally {
          setIsUploading(false);
      }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    const tempId = `att-${Date.now()}`;
    const newAttachment: AssignmentAttachment = {
      id: tempId,
      file_name: file.name,
      file_url: '',
      file_type: file.type,
      file_size: file.size,
      status: 'uploading',
      progress: 50, // Fake progress for UI since axios onUploadProgress is not hooked up
    };

    const updated = [...attachments, newAttachment];
    onChange(updated);
    setIsUploading(true);
    
    processUpload(file, tempId, updated);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label className="block text-sm font-medium text-gray-700">
          {assignmentMessages.form.attachmentsLabel}
        </label>
        <div className="flex gap-2">
          {!isAddingLink && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                disabled={disabled || isUploading}
                accept=".pdf,.doc,.docx,.zip,.rar,.txt,.jpg,.png"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isUploading}
              >
                + Tải tệp lên
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddingLink(true)}
                disabled={disabled || isUploading}
              >
                + Thêm liên kết URL
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Add Attachment Link Form */}
      {isAddingLink && (
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
              onClick={() => setIsAddingLink(false)}
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
                {item.status === 'success' || !item.status ? (
                  <a
                    href={item.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-blue-600 hover:underline truncate flex items-center gap-1.5"
                  >
                    <Paperclip className="w-4 h-4 shrink-0" /> {item.file_name}
                  </a>
                ) : (
                  <span className="font-medium text-gray-600 truncate flex items-center gap-1.5"><Paperclip className="w-4 h-4 shrink-0" /> {item.file_name}</span>
                )}
                
                {item.file_url && <span className="text-xs text-gray-400 truncate block">{item.file_url}</span>}

                {/* Progress bar */}
                {item.status === 'uploading' && (
                  <div className="mt-1.5 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-1.5 transition-all duration-200 animate-pulse"
                      style={{ width: `${item.progress || 50}%` }}
                    />
                  </div>
                )}
                {item.status === 'error' && (
                  <span className="text-xs text-red-500 block mt-1">Lỗi tải lên</span>
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

                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  className="text-xs text-red-600 hover:text-red-800 p-1"
                  aria-label={`${assignmentMessages.attachment.removeBtn} ${item.file_name}`}
                  disabled={disabled || item.status === 'uploading'}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
