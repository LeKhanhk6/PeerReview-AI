import React from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { analyticsMessages } from '@/constants/messages/analytics';
import { useGroupContribution } from '../hooks/useAnalytics';
import { MemberContributionTable } from './MemberContributionTable';
import { ExportCsvButton } from './ExportCsvButton';

interface GroupContributionDetailModalProps {
  groupId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const GroupContributionDetailModal: React.FC<GroupContributionDetailModalProps> = ({
  groupId,
  isOpen,
  onClose,
}) => {
  // Only query when modal is open and groupId is valid
  const { data: members = [], isLoading, isError, refetch } = useGroupContribution(groupId || '', isOpen);

  const title = analyticsMessages.modal.title.replace('{groupId}', groupId || '');

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      title={title}
      description={analyticsMessages.modal.subtitle}
      className="max-w-4xl"
    >
      <div className="space-y-4">
        {/* Modal Actions */}
        {!isLoading && !isError && members.length > 0 && (
          <div className="flex justify-end">
            <ExportCsvButton data={members} filename={`dong_gop_nhom_${groupId}.csv`} />
          </div>
        )}

        {/* Content Body */}
        {isLoading ? (
          <div className="space-y-3 py-4" aria-busy="true">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : isError ? (
          <EmptyState
            type="error"
            title="Không thể tải chi tiết đóng góp nhóm"
            description={analyticsMessages.error.fetchFailed}
            actionLabel="Thử lại"
            onAction={() => refetch()}
          />
        ) : members.length === 0 ? (
          <EmptyState
            type="no_data"
            title={analyticsMessages.empty.noDataTitle}
            description={analyticsMessages.empty.noDataDescription}
          />
        ) : (
          <MemberContributionTable members={members} />
        )}
      </div>
    </Dialog>
  );
};
