import React from 'react';
import { Button } from '@/components/ui/Button';
import { synthesisMessages } from '@/constants/messages/synthesis';
import type { AssignmentSynthesisResponse } from '../types/synthesis.types';

interface SynthesisStatusCardProps {
  synthesis?: AssignmentSynthesisResponse;
  isLoading: boolean;
  isError: boolean;
  onRefresh: () => void;
}

export const SynthesisStatusCard: React.FC<SynthesisStatusCardProps> = ({
  synthesis,
  isLoading,
  isError,
  onRefresh,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-3" aria-busy="true">
        <div className="flex items-center justify-between">
          <div className="h-5 bg-gray-200 rounded w-1/3 animate-pulse" />
          <div className="h-8 bg-gray-200 rounded w-28 animate-pulse" />
        </div>
        <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
        <div className="h-2 bg-gray-200 rounded w-full animate-pulse" />
        <p className="text-xs text-blue-600 font-medium animate-pulse">
          ⏳ {synthesisMessages.status.processing}
        </p>
      </div>
    );
  }

  if (isError || !synthesis) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-800 text-sm space-y-2">
        <h3 className="font-bold">{synthesisMessages.errors.fetchSynthesisError}</h3>
        <p>Không thể tải dữ liệu phân tích AI toàn bài tập. Vui lòng thử lại sau.</p>
        <Button variant="outline" size="sm" onClick={onRefresh} className="mt-2">
          {synthesisMessages.header.refreshSynthesis}
        </Button>
      </div>
    );
  }

  if (synthesis.reason === 'NOT_ENOUGH_REVIEWS') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-amber-900 text-sm space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚠️</span>
          <h3 className="font-bold">{synthesisMessages.status.notEnoughReviews}</h3>
        </div>
        <p className="text-xs text-amber-700">
          Hiện tại bài tập chỉ có {synthesis.totalReviews} bài phản biện. Cần tối thiểu 5 bài phản biện để AI tổng hợp thông số chính xác.
        </p>
      </div>
    );
  }

  const confidencePct = Math.round((synthesis.confidence || 0) * 100);
  const isLowConfidence = confidencePct < 60;

  return (
    <div
      className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4"
      aria-label={synthesisMessages.a11y.overviewRegionLabel}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span>📊</span> Tổng Quan AI Review Synthesis
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Phân tích từ <strong className="text-gray-900">{synthesis.reviewsUsed}</strong> / {synthesis.totalReviews} bài phản biện trong toàn bài tập
          </p>
        </div>

        <Button variant="secondary" size="sm" onClick={onRefresh} disabled={isLoading}>
          🔄 {synthesisMessages.header.refreshSynthesis}
        </Button>
      </div>

      {/* Summary Brief */}
      {synthesis.summary && (
        <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3.5 text-sm text-blue-950 leading-relaxed font-medium">
          💡 {synthesis.summary}
        </div>
      )}

      {/* Confidence Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-gray-600">{synthesisMessages.status.confidenceLabel}</span>
          <span className={isLowConfidence ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold'}>
            {confidencePct}%
          </span>
        </div>

        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              isLowConfidence ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${confidencePct}%` }}
          />
        </div>
      </div>

      {/* Human-in-the-loop Low Confidence Warning */}
      {isLowConfidence && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-xs text-amber-800 font-medium">
          {synthesisMessages.status.confidenceLowWarning}
        </div>
      )}
    </div>
  );
};
