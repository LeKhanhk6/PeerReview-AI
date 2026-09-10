import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { submissionMessages } from '@/constants/messages/submission';
import { toast } from 'sonner';
import { useSubmitAssignment } from '../hooks/useSubmission';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { Upload, AlertTriangle, FileText, Link as LinkIcon, X, GitBranch } from 'lucide-react';

interface SubmissionUploadFormProps {
  assignmentId: string;
  isExpired?: boolean;
}

export const SubmissionUploadForm: React.FC<SubmissionUploadFormProps> = ({
  assignmentId,
  isExpired = false,
}) => {
  const isOnline = useOnlineStatus();
  const submitAssignment = useSubmitAssignment(assignmentId);

  const [submitMode, setSubmitMode] = useState<'FILE' | 'LINK'>('FILE');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [formError, setFormError] = useState('');

  // beforeunload warning while uploading
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isUploading) {
        e.preventDefault();
        e.returnValue = submissionMessages.form.isUploadingWarning;
        return submissionMessages.form.isUploadingWarning;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isUploading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setHasError(false);
      setFormError('');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (submitMode === 'FILE' && !selectedFile) {
      setFormError('Vui lòng chọn tệp bài nộp (.pdf, .docx, .zip, .rar).');
      return;
    }

    if (submitMode === 'LINK') {
      const trimmedUrl = urlInput.trim();
      if (!trimmedUrl) {
        setFormError('Vui lòng nhập đường dẫn liên kết (GitHub, Google Drive, Figma,...).');
        return;
      }
      if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
        setFormError('Đường dẫn hợp lệ phải bắt đầu bằng http:// hoặc https://');
        return;
      }
    }

    if (!isOnline) {
      toast.error(submissionMessages.error.offlineSubmitError);
      return;
    }

    setIsUploading(true);
    setHasError(false);
    const formData = new FormData();

    if (submitMode === 'FILE' && selectedFile) {
      formData.append('file', selectedFile);
    } else if (submitMode === 'LINK') {
      formData.append('file_url', urlInput.trim());
    }

    if (isExpired) {
      formData.append('is_late', 'true');
    }

    try {
      await submitAssignment.mutateAsync(formData);

      toast.success(
        submitMode === 'LINK'
          ? 'Đã đính kèm liên kết GitHub / URL thành công!'
          : submissionMessages.form.uploadSuccess
      );
      setSelectedFile(null);
      setUrlInput('');
    } catch (err: any) {
      setHasError(true);
      const errMsg = err?.message || err?.response?.data?.message || err?.code || '';
      if (errMsg.includes('MUST_JOIN_GROUP') || err?.status === 409) {
        setFormError('Bạn chưa thuộc về nhóm nào trong lớp học này. Vui lòng tham gia nhóm trước khi nộp bài.');
        toast.error('Bạn cần tham gia một nhóm trong lớp học trước khi nộp bài.');
      } else {
        toast.error(errMsg || submissionMessages.error.submitFailed);
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
      {/* Form Title Header */}
      <div className="border-b border-gray-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Upload className="w-5 h-5 text-gray-700" />
            <span>{submissionMessages.form.title}</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Tải lên tệp tài liệu hoặc đính kèm đường dẫn GitHub / Slide báo cáo
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => {
              setSubmitMode('FILE');
              setFormError('');
            }}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              submitMode === 'FILE'
                ? 'bg-white text-blue-700 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Tải Tệp Nộp
          </button>
          <button
            type="button"
            onClick={() => {
              setSubmitMode('LINK');
              setFormError('');
            }}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              submitMode === 'LINK'
                ? 'bg-white text-blue-700 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5 text-slate-900" /> Link GitHub / URL
          </button>
        </div>
      </div>

      {/* Offline Banner Warning */}
      {!isOnline && (
        <div role="alert" className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs font-semibold text-amber-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" aria-hidden="true" />
          <span>{submissionMessages.offline.bannerMessage}</span>
        </div>
      )}

      {/* Form Inputs */}
      <form onSubmit={handleFormSubmit} className="space-y-4">
        {formError && (
          <div role="alert" className="p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-md flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {formError}
          </div>
        )}

        {submitMode === 'FILE' ? (
          <div>
            <label htmlFor="submission-file-input" className="block text-xs font-semibold text-gray-700 mb-1">
              {submissionMessages.form.selectFileLabel} (.pdf, .docx, .zip, .rar) *
            </label>
            <input
              id="submission-file-input"
              type="file"
              onChange={handleFileChange}
              disabled={isUploading || !isOnline}
              accept=".pdf,.docx,.doc,.zip,.rar"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />

            {selectedFile && (
              <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs flex items-center justify-between">
                <span className="font-semibold text-gray-800 truncate flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-gray-500" /> {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="text-gray-400 hover:text-red-600 ml-2"
                  aria-label="Bỏ chọn tệp"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <label htmlFor="submission-url-input" className="block text-xs font-semibold text-gray-700">
              Đường dẫn Liên kết GitHub Repository / Google Drive / Figma *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <LinkIcon className="w-4 h-4" />
              </div>
              <input
                id="submission-url-input"
                type="url"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  setFormError('');
                }}
                placeholder="https://github.com/tentaikhoan/ten-repo-do-an"
                disabled={isUploading || !isOnline}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs text-gray-800"
              />
            </div>
            <p className="text-[11px] text-gray-500">
              Đính kèm link kho chứa GitHub, slide báo cáo (Google Drive / Canva) hoặc sản phẩm chạy thử nghiệm.
            </p>

            {/* Quick Demo Fill Buttons */}
            <div className="pt-1 flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Gợi ý mẫu:</span>
              <button
                type="button"
                onClick={() => setUrlInput('https://github.com/peerreview-ai/se301-web-project')}
                className="text-[11px] font-mono text-blue-600 hover:underline bg-blue-50 px-2 py-0.5 rounded border border-blue-200"
              >
                GitHub Demo Link
              </button>
            </div>
          </div>
        )}

        {/* Upload Progress Bar */}
        {isUploading && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
            <div className="flex justify-between text-xs font-semibold text-blue-900">
              <span>{submissionMessages.form.uploadProgress}</span>
              <span>{uploadProgress}%</span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={uploadProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Tiến trình tải bài nộp"
              className="w-full bg-blue-200 h-2 rounded-full overflow-hidden"
            >
              <div
                className="bg-blue-600 h-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Submit Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            type="submit"
            disabled={
              isUploading ||
              !isOnline ||
              (submitMode === 'FILE' && !selectedFile) ||
              (submitMode === 'LINK' && !urlInput.trim())
            }
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-5 py-2.5 rounded-lg shadow-sm"
          >
            {isUploading ? 'Đang nộp...' : submissionMessages.form.submitBtn}
          </Button>

          {hasError && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleFormSubmit}
              disabled={isUploading || !isOnline}
              className="text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
            >
              {submissionMessages.form.retryBtn}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

