import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { synthesisMessages } from '@/constants/messages/synthesis';
import {
  useAssignmentSynthesis,
  useSubmissionSummary,
  useUpdateSummaryItemMutation,
  useApproveSummaryMutation,
} from '../hooks/useSynthesis';
import { SynthesisStatusCard } from '../components/SynthesisStatusCard';
import { AssignmentSynthesisOverview } from '../components/AssignmentSynthesisOverview';
import { SummaryItemCard } from '../components/SummaryItemCard';
import { SourceReviewDrawer } from '../components/SourceReviewDrawer';
import { TeacherValidationHeader } from '../components/TeacherValidationHeader';
import type { SummaryItem } from '../types/synthesis.types';

export const TeacherReviewSynthesisPage: React.FC = () => {
  const { assignmentId = '' } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Selected Submission ID synced with URL searchParams
  const selectedSubmissionId = searchParams.get('submissionId') || 'sub-001';

  const handleSubmissionChange = (submissionId: string) => {
    const params = new URLSearchParams(searchParams);
    if (submissionId) {
      params.set('submissionId', submissionId);
    } else {
      params.delete('submissionId');
    }
    setSearchParams(params);
  };


  // Selected item for Source Review Drawer
  const [activeDrawerItem, setActiveDrawerItem] = useState<SummaryItem | null>(null);

  // Queries & Mutations
  const {
    data: synthesisData,
    isLoading: isLoadingSynthesis,
    isError: isErrorSynthesis,
    error: synthesisError,
    refetch: refetchSynthesis,
  } = useAssignmentSynthesis(assignmentId);

  const {
    data: summaryResponse,
    isLoading: isLoadingSummary,
    isError: isErrorSummary,
    error: summaryError,
  } = useSubmissionSummary(selectedSubmissionId);

  const updateItemMutation = useUpdateSummaryItemMutation(selectedSubmissionId);
  const approveMutation = useApproveSummaryMutation(selectedSubmissionId);

  // Check 403 Forbidden error on assignment level
  const isForbidden =
    (synthesisError as any)?.status === 403 || (synthesisError as any)?.code === 'FORBIDDEN';

  if (isForbidden) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <EmptyState
          type="forbidden"
          title={synthesisMessages.errors.forbidden403Title}
          description={synthesisMessages.errors.forbidden403Desc}
          actionLabel={synthesisMessages.errors.backToClasses}
          onAction={() => navigate('/teacher/assignments')}
        />
      </div>
    );
  }

  const summaryHeader = summaryResponse?.summary;
  const items = summaryResponse?.items || [];
  const isApproved = summaryHeader?.status === 'APPROVED';

  const handleSaveItem = async (
    itemId: string,
    content: string,
    note: string,
    updatedAt: string
  ) => {
    await updateItemMutation.mutateAsync({
      itemId,
      payload: { content, note, updatedAt },
    });
  };

  const handleApproveSummary = async () => {
    await approveMutation.mutateAsync();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header & Navigation */}
      <div className="bg-white p-5 border border-gray-200 rounded-xl shadow-sm space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigate('/teacher/assignments')}
              className="text-xs text-gray-500 hover:text-gray-900 mb-1 -ml-2"
            >
              ← {synthesisMessages.header.backToAssignments}
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {synthesisMessages.header.title}
            </h1>
            <p className="text-sm text-gray-600">{synthesisMessages.header.subtitle}</p>
          </div>
        </div>
      </div>

      {/* 1. Assignment-Wide Synthesis Overview */}
      <div className="space-y-4">
        <SynthesisStatusCard
          synthesis={synthesisData}
          isLoading={isLoadingSynthesis}
          isError={isErrorSynthesis}
          onRefresh={() => refetchSynthesis()}
        />

        <AssignmentSynthesisOverview synthesis={synthesisData} />
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-6" />

      {/* 2. Submission-Level Detailed Summary & Human-in-the-loop Editing */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span>📑</span> Chi Tiết Tổng Hợp Theo Bài Nộp
          </h2>

          {/* Submission Selector Dropdown */}
          <div className="w-full md:w-80">
            <select
              value={selectedSubmissionId}
              onChange={(e) => handleSubmissionChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >

              <option value="sub-001">Bài nộp Nhóm 1 (Mã: sub-001)</option>
              <option value="sub-002">Bài nộp Nhóm 2 (Mã: sub-002)</option>
              <option value="sub-003">Bài nộp Nhóm 3 (Mã: sub-003)</option>
              <option value="not-found-submission-id">Bài nộp chưa tổng hợp (Test 404)</option>
            </select>
          </div>
        </div>

        {/* Validation Control Header */}
        {summaryHeader && (
          <TeacherValidationHeader
            status={summaryHeader.status}
            updatedBy={summaryHeader.updatedBy}
            updatedAt={summaryHeader.updatedAt}
            isApproving={approveMutation.isPending}
            onApprove={handleApproveSummary}
          />
        )}

        {/* Summary Items List */}
        {isLoadingSummary ? (
          <div className="space-y-4" aria-busy="true">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : isErrorSummary ? (
          <EmptyState
            type="no_data"
            title="Chưa tạo bản tổng hợp cho bài nộp này"
            description={
              (summaryError as any)?.message || synthesisMessages.errors.fetchSummaryError
            }
          />
        ) : items.length === 0 ? (
          <EmptyState
            type="no_data"
            title="Chưa có cụm chủ đề nào"
            description="Bản tổng hợp hiện chưa có cụm nhận xét nào từ AI."
          />
        ) : (
          <div
            className="space-y-4"
            aria-label={synthesisMessages.a11y.summaryListRegionLabel}
          >
            {items.map((item) => (
              <SummaryItemCard
                key={item.id}
                item={item}
                isApproved={Boolean(isApproved)}
                isUpdating={updateItemMutation.isPending}
                onSaveItem={handleSaveItem}
                onOpenSourceReviews={(selectedItem) => setActiveDrawerItem(selectedItem)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Traceability Source Review Side Drawer */}
      <SourceReviewDrawer
        submissionId={selectedSubmissionId}
        item={activeDrawerItem}
        isOpen={Boolean(activeDrawerItem)}
        onClose={() => setActiveDrawerItem(null)}
      />
    </div>
  );
};
