import React from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { analyticsMessages } from '@/constants/messages/analytics';
import { useAssignmentGroupAnalytics, usePublishGroupAnalytics } from '../hooks/useAnalytics';
import { useQuery } from '@tanstack/react-query';
import { GroupRadarChart } from './GroupRadarChart';
import { AssignmentContributionTable } from './AssignmentContributionTable';
import { ExportCsvButton } from './ExportCsvButton';

interface GroupContributionDetailModalProps {
  groupId: string | null;
  classId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const GroupContributionDetailModal: React.FC<GroupContributionDetailModalProps> = ({
  groupId,
  classId,
  isOpen,
  onClose,
}) => {
  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments', classId],
    queryFn: async () => {
      if (!classId) return [];
      const res = await (await fetch(`http://localhost:5000/api/classes/${classId}/assignments`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })).json();
      return res.data || res || [];
    },
    enabled: Boolean(classId) && isOpen
  });

  const assignmentId = assignments.length > 0 ? assignments[0].id : null;

  const { data: members = [], isLoading, isError, refetch } = useAssignmentGroupAnalytics(assignmentId, groupId || '', isOpen && Boolean(assignmentId));
  const { mutate: publish, isPending: isPublishing } = usePublishGroupAnalytics();

  const title = "Kết quả Đánh giá Nội bộ (Peer Review)";
  const isPublished = members.length > 0 && members[0].isPublished;

  const handlePublish = () => {
    if (window.confirm("Publish lại sẽ thay thế kết quả đã công bố của tất cả sinh viên. Bạn có chắc chắn?")) {
      publish({ assignmentId, groupId: groupId! }, {
        onSuccess: () => alert("Công bố thành công!"),
        onError: (err: any) => alert(`Lỗi: ${err.response?.data?.message || err.message}`)
      });
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      title={title}
      description="Kết quả đánh giá từ công cụ AI Mentor và phiếu chấm nội bộ."
      className="max-w-5xl"
    >
      <div className="space-y-6">
        {/* Modal Actions */}
        {!isLoading && !isError && members.length > 0 && (
          <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
             <div>
               <span className="text-sm font-medium text-gray-700 mr-2">Trạng thái:</span>
               {isPublished ? (
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-md">Đã công bố</span>
               ) : (
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-md">Chưa công bố (Bản nháp)</span>
               )}
             </div>
             <div className="flex gap-2">
                <ExportCsvButton data={members} filename={`dong_gop_nhom_${groupId}.csv`} />
                <button 
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-sm disabled:opacity-50"
                >
                  {isPublishing ? 'Đang xử lý...' : (isPublished ? 'Publish Lại' : 'Publish Analytics')}
                </button>
             </div>
          </div>
        )}

        {/* Content Body */}
        {isLoading ? (
          <div className="space-y-3 py-4" aria-busy="true">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-80 w-full" />
          </div>
        ) : isError ? (
          <EmptyState
            type="error"
            title="Không thể tải chi tiết đánh giá"
            description={analyticsMessages.error.fetchFailed}
            actionLabel="Thử lại"
            onAction={() => refetch()}
          />
        ) : members.length === 0 ? (
          <EmptyState
            type="no_data"
            title={analyticsMessages.empty.noDataTitle}
            description="Nhóm này chưa có dữ liệu đánh giá nội bộ."
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="col-span-1 border-r border-gray-100 pr-4">
                <GroupRadarChart data={members.map((m: any, idx: number) => ({
                    ...m,
                    color: ['#4f46e5', '#ec4899', '#06b6d4', '#eab308', '#22c55e'][idx % 5]
                }))} />
             </div>
             <div className="col-span-2">
                <AssignmentContributionTable members={members} />
             </div>
          </div>
        )}
      </div>
    </Dialog>
  );
};
