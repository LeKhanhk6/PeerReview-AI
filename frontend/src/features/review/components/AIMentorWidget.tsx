import React, { useState } from 'react';
import { Sparkles, Lightbulb, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { reviewMessages } from '@/constants/messages/review';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { AIMentorAnalysis } from '../types/review.types';

interface AIMentorWidgetProps {
  analysis: AIMentorAnalysis | null;
  isLoading: boolean;
  isError: boolean;
  isCircuitBreakerActive: boolean;
  currentCommentLength: number;
  onApplySuggestedRewrite: (suggestedText: string) => void;
  onManualTrigger: () => void;
}

export const AIMentorWidget: React.FC<AIMentorWidgetProps> = ({
  analysis,
  isLoading,
  isError,
  isCircuitBreakerActive,
  currentCommentLength,
  onApplySuggestedRewrite,
  onManualTrigger,
}) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);

  const getCategoryBadge = (categoryStr: string) => {
    if (categoryStr.includes('Tiêu cực') || categoryStr.includes('1.')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 text-red-800 border border-red-200">
          {reviewMessages.aiMentor.catToxic}
        </span>
      );
    }
    if (categoryStr.includes('Qua loa') || categoryStr.includes('2.')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
          {reviewMessages.aiMentor.catVague}
        </span>
      );
    }
    if (categoryStr.includes('Khen chung') || categoryStr.includes('3.')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
          {reviewMessages.aiMentor.catGeneric}
        </span>
      );
    }
    if (categoryStr.includes('Góp ý chi tiết') || categoryStr.includes('4.')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          {reviewMessages.aiMentor.catConstructive}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-gray-100 text-gray-800 border border-gray-200">
        {reviewMessages.aiMentor.catUnknown}
      </span>
    );
  };

  const handleConfirmApply = () => {
    if (analysis?.suggested_rewrite) {
      onApplySuggestedRewrite(analysis.suggested_rewrite);
      toast.success(reviewMessages.aiMentor.applySuccessToast);
    }
    setIsConfirmOpen(false);
  };

  return (
    <div
      className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 space-y-3 transition-all"
      aria-label={reviewMessages.aiMentor.widgetTitle}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between gap-2 border-b border-indigo-100 pb-2">
        <h3 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
          <span>{reviewMessages.aiMentor.widgetTitle}</span>
        </h3>

        {/* Loading Spinner Indicator */}
        {isLoading && (
          <span className="text-xs font-semibold text-indigo-600 flex items-center gap-1 animate-pulse">
            <span className="inline-block w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
            <span>{reviewMessages.aiMentor.analyzing}</span>
          </span>
        )}
      </div>

      {/* Minimum Characters Notice */}
      {currentCommentLength < 15 && !isLoading && !analysis && (
        <p className="text-xs text-indigo-700 font-medium flex items-center gap-1.5">
          <Lightbulb className="w-4 h-4" /> {reviewMessages.aiMentor.minCharsNotice}
        </p>
      )}

      {/* Circuit Breaker Notice */}
      {isCircuitBreakerActive && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2 text-xs text-amber-900">
          <p className="font-semibold">{reviewMessages.aiMentor.circuitBreakerNotice}</p>
        </div>
      )}

      {/* Fallback Non-Blocking Error Notice */}
      {isError && !isCircuitBreakerActive && (
        <div className="bg-gray-100 border border-gray-200 rounded-lg p-3 text-xs text-gray-700 flex items-start gap-2">
          <Lightbulb className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{reviewMessages.aiMentor.fallbackUnavailable}</span>
        </div>
      )}

      {/* Dynamic NLP Results (aria-live region for screen readers) */}
      <div aria-live="polite" aria-atomic="true" className="space-y-3">
        {analysis && !isLoading && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-semibold text-gray-600">Đánh giá văn phong:</span>
              <div>{getCategoryBadge(analysis.category)}</div>
            </div>

            {/* Guidance Message */}
            {analysis.guidance_message && (
              <div className="bg-white border border-indigo-100 rounded-lg p-3 text-xs text-gray-800 space-y-1">
                <span className="font-bold text-indigo-900 flex items-center gap-1.5"><MessageSquare className="w-4 h-4" /> Lời khuyên hướng dẫn:</span>
                <p className="leading-relaxed">{analysis.guidance_message}</p>
              </div>
            )}

            {/* Suggested Rewrite with Safety Confirmation */}
            {analysis.suggested_rewrite && (
              <div className="bg-white border border-emerald-100 rounded-lg p-3 text-xs text-emerald-900 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-emerald-900 flex items-center gap-1"><Sparkles className="w-4 h-4" /> Câu gợi ý tham khảo:</span>
                  <button
                    type="button"
                    onClick={() => setIsConfirmOpen(true)}
                    className="px-2.5 py-1 bg-emerald-600 text-white rounded-md font-semibold text-[11px] hover:bg-emerald-700 transition-colors shadow-2xs"
                    aria-label={`${reviewMessages.aiMentor.applySuggestedText}: ${analysis.suggested_rewrite}`}
                  >
                    {reviewMessages.aiMentor.applySuggestedText}
                  </button>
                </div>
                <p className="italic bg-emerald-50/50 p-2 rounded border border-emerald-100 font-mono text-[11px]">
                  "{analysis.suggested_rewrite}"
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Persistent Manual Action Bar */}
      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={onManualTrigger}
          disabled={isLoading || currentCommentLength < 15}
          className="px-3 py-1.5 bg-indigo-600 text-white rounded-md font-semibold text-xs hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {analysis ? 'Phân tích lại' : 'Nhờ AI nhận xét'}
        </button>
      </div>

      {/* Reused ConfirmDialog for Option (a) Safety Confirmation */}
      <ConfirmDialog
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmApply}
        title={reviewMessages.aiMentor.confirmApplyTitle}
        description={reviewMessages.aiMentor.confirmApplyDescription}
      />
    </div>
  );
};
