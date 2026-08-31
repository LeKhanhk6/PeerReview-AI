import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { submissionMessages } from '@/constants/messages/submission';
import { toast } from 'sonner';
import { useSubmitAssignment } from '../hooks/useSubmission';
import { submitAssignmentSchema } from '../schemas/submission.schema';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

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

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
    if (!selectedFile) {
      setFormError('Vui lòng chọn tệp bài nộp.');
      return;
    }

    if (!isOnline) {
      toast.error(submissionMessages.error.offlineSubmitError);
      return;
    }

    setIsUploading(true);
    setHasError(false);
    setUploadProgress(15);

    // Simulated cloud storage upload (Firebase/S3/Google Cloud Storage)
    // TODO Phase 10: Connect with S3 Multipart Presigned Upload API
    const simulatedCloudUrl = `https://storage.googleapis.com/peer-review-bucket/${encodeURIComponent(
      selectedFile.name
    )}`;

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 85) {
          clearInterval(interval);
          return 85;
        }
        return prev + 25;
      });
    }, 200);

    setTimeout(async () => {
      clearInterval(interval);

      // Validate URL with Zod schema
      const validation = submitAssignmentSchema.safeParse({ file_url: simulatedCloudUrl });
      if (!validation.success) {
        setIsUploading(false);
        setHasError(true);
        setFormError(validation.error.issues[0]?.message || 'URL file không hợp lệ.');
        return;
      }

      setUploadProgress(100);

      try {
        await submitAssignment.mutateAsync({
          file_url: simulatedCloudUrl,
          file_name: selectedFile.name,
          is_late: isExpired,
        });

        toast.success(submissionMessages.form.uploadSuccess);
        setSelectedFile(null);
      } catch (err: any) {
        setHasError(true);
        const errMsg = err?.message || err?.response?.data?.message || err?.code || '';
        if (errMsg.includes('MUST_JOIN_GROUP') || err?.status === 409) {
          setFormError('⚠️ Bạn chưa thuộc về nhóm nào trong lớp học này. Vui lòng tham gia nhóm trước khi nộp bài.');
          toast.error('Bạn cần tham gia một nhóm trong lớp học trước khi nộp bài.');
        } else {
          toast.error(errMsg || submissionMessages.error.submitFailed);
        }
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    }, 1200);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
      <div className="border-b border-gray-200 pb-3">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <span>📤</span>
          <span>{submissionMessages.form.title}</span>
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Tải lên phiên bản bài nộp mới nhất của bạn (Chấp nhận định dạng .pdf, .docx, .zip)
        </p>
      </div>

      {/* Offline Banner Warning */}
      {!isOnline && (
        <div role="alert" className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs font-semibold text-amber-900 flex items-center gap-2">
          <span aria-hidden="true">⚠️</span>
          <span>{submissionMessages.offline.bannerMessage}</span>
        </div>
      )}

      {/* Form Inputs */}
      <form onSubmit={handleFormSubmit} className="space-y-4">
        {formError && (
          <div role="alert" className="p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-md">
            ⚠️ {formError}
          </div>
        )}

        <div>
          <label htmlFor="submission-file-input" className="block text-xs font-semibold text-gray-700 mb-1">
            {submissionMessages.form.selectFileLabel}
          </label>
          <input
            id="submission-file-input"
            type="file"
            onChange={handleFileChange}
            disabled={isUploading || !isOnline}
            accept=".pdf,.docx,.doc,.zip,.rar"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
          />
        </div>

        {selectedFile && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs flex items-center justify-between">
            <span className="font-semibold text-gray-800 truncate">
              📄 {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
            </span>
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              className="text-gray-400 hover:text-red-600 font-bold ml-2"
              aria-label="Bỏ chọn tệp"
            >
              ✕
            </button>
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
            disabled={isUploading || !selectedFile || !isOnline}
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
