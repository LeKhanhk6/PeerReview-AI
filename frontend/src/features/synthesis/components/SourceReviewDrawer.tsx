import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { synthesisMessages } from '@/constants/messages/synthesis';
import { useSourceReviews } from '../hooks/useSynthesis';
import type { SummaryItem } from '../types/synthesis.types';
import { X, Lock } from 'lucide-react';

interface SourceReviewDrawerProps {
  submissionId: string;
  item: SummaryItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SourceReviewDrawer: React.FC<SourceReviewDrawerProps> = ({
  submissionId,
  item,
  isOpen,
  onClose,
}) => {
  const [page, setPage] = useState(1);
  const triggerRef = useRef<HTMLElement | null>(null);

  const { data: sourceReviewsData, isLoading } = useSourceReviews(
    submissionId,
    page,
    10
  );

  // Store trigger element focus to restore when closing drawer (a11y)
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement;
      setPage(1);
    } else if (triggerRef.current) {
      triggerRef.current.focus();
      triggerRef.current = null;
    }
  }, [isOpen]);


  // Handle ESC key press to close drawer (a11y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const reviews = sourceReviewsData?.reviews || [];
  const total = sourceReviewsData?.total || 0;
  const totalPages = Math.ceil(total / 10) || 1;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-gray-900/50 backdrop-blur-sm flex justify-end"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-label={synthesisMessages.a11y.drawerRegionLabel}
    >
      <div
        className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between transform transition-transform duration-300 ease-in-out"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-gray-200 bg-gray-50 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-gray-900">{synthesisMessages.drawer.title}</h3>
            <p className="text-xs text-gray-600 mt-1">{synthesisMessages.drawer.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={synthesisMessages.drawer.closeDrawer}
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Topic Context Banner */}
        <div className="bg-blue-50 border-b border-blue-100 p-4 text-xs text-blue-900 font-medium">
          <strong>Cụm chủ đề đang chọn:</strong>
          <p className="mt-1 font-normal text-blue-950 line-clamp-2">{item.content}</p>
        </div>

        {/* Drawer Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {isLoading ? (
            <div className="space-y-3" aria-busy="true">
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-10 text-xs text-gray-500 font-medium">
              {synthesisMessages.drawer.noSourceReviews}
            </div>
          ) : (
            reviews.map((review, index) => (
              <div
                key={review.id}
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-2"
              >
                <div className="flex items-center justify-between text-xs border-b border-gray-100 pb-2">
                  {/* DOUBLE-BLIND SAFE: Anonymous Label Only */}
                  <span className="font-bold text-gray-800 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-gray-500" /> {synthesisMessages.drawer.anonymousReviewerLabel} #{(page - 1) * 10 + index + 1}
                  </span>
                  <span className="font-extrabold text-blue-600">
                    {synthesisMessages.drawer.scoreLabel} {
                      (() => {
                        const raw = Number(review.total_score || 0);
                        const val = raw > 10 ? raw / 10 : raw;
                        return (Math.round(val * 10) / 10).toFixed(1);
                      })()
                    }/10
                  </span>
                </div>

                <p className="text-xs text-gray-900 leading-relaxed font-medium">
                  "{review.overall_comment}"
                </p>

                <p className="text-[10px] text-gray-400 text-right">
                  {synthesisMessages.drawer.submittedAtLabel}{' '}
                  {new Date(review.submitted_at).toLocaleString('vi-VN')}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer & Pagination */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {synthesisMessages.drawer.paginationPage} {page} / {totalPages} (Tổng {total} bài)
          </span>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              className="text-xs"
            >
              {synthesisMessages.drawer.previousPage}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              className="text-xs"
            >
              {synthesisMessages.drawer.nextPage}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
