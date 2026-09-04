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
  useGenerateSubmissionSummaryMutation,
} from '../hooks/useSynthesis';
import { useTeacherSubmissionsMonitor } from '@/features/submission/hooks/useSubmission';
import { SynthesisStatusCard } from '../components/SynthesisStatusCard';
import { FileText, RefreshCw, Loader2 } from 'lucide-react';

import { AssignmentSynthesisOverview } from '../components/AssignmentSynthesisOverview';
import { SummaryItemCard } from '../components/SummaryItemCard';
import { SourceReviewDrawer } from '../components/SourceReviewDrawer';
import { TeacherValidationHeader } from '../components/TeacherValidationHeader';
import type { SummaryItem } from '../types/synthesis.types';

export const TeacherReviewSynthesisPage: React.FC = () => {
  const { assignmentId = '' } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Queries for real submissions monitor
  const { data: monitorData } = useTeacherSubmissionsMonitor(assignmentId, 'SUBMITTED');
  const submittedGroups = monitorData?.groups?.filter((g) => Boolean(g.submission)) || [];

  // Active Selected Submission ID synced with URL searchParams
  const defaultSubmissionId = submittedGroups[0]?.submission?.id ? String(submittedGroups[0].submission.id) : '';
  const selectedSubmissionId = searchParams.get('submissionId') || defaultSubmissionId;

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
  const generateMutation = useGenerateSubmissionSummaryMutation(selectedSubmissionId);

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

  const handleGenerateSummary = () => {
    if (generateMutation.isPending) return;
    
    // Nếu đã có dữ liệu, hiển thị confirm dialog trước khi tạo lại
    if (!isErrorSummary && items.length > 0) {
      if (!window.confirm(synthesisMessages.header.confirmRegenerateDesc)) {
        return;
      }
    }
    generateMutation.mutate();
  };

  return (
    <div className="h-full w-full min-w-0 overflow-y-auto space-y-6 max-w-7xl mx-auto pb-12 pr-1 pt-4">
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
            <FileText className="h-5 w-5 text-gray-700" /> Chi Tiết Tổng Hợp Theo Bài Nộp
          </h2>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Dynamic Submission Selector Dropdown */}
            <div className="w-full md:w-80">
              <select
                value={selectedSubmissionId}
                onChange={(e) => handleSubmissionChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Chọn bài nộp nhóm --</option>
                {submittedGroups.map((g) => (
                  <option key={g.groupId} value={String(g.submission?.id || g.groupId)}>
                    {g.groupName} - Bài nộp v{g.submission?.latestVersionNumber || 1}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Action Button: Generate / Regenerate */}
            {selectedSubmissionId && !isErrorSummary && items.length > 0 && !isApproved && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateSummary}
                disabled={generateMutation.isPending}
                className="whitespace-nowrap hidden md:flex"
              >
                {generateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {synthesisMessages.header.refreshSynthesis}
              </Button>
            )}
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
        {isLoadingSummary || generateMutation.isPending ? (
          <div className="space-y-4" aria-busy="true">
            {generateMutation.isPending && (
              <div className="text-center py-4 text-blue-600 flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="font-medium">{synthesisMessages.header.generateSummarySub}</span>
              </div>
            )}
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : isErrorSummary || !selectedSubmissionId ? (
          <EmptyState
            type="no_data"
            title="Chưa chọn bài nộp hoặc chưa tạo bản tổng hợp"
            description={
              (summaryError as any)?.message || synthesisMessages.errors.fetchSummaryError
            }
            actionLabel={selectedSubmissionId ? synthesisMessages.header.generateSummary : undefined}
            onAction={selectedSubmissionId ? handleGenerateSummary : undefined}
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
