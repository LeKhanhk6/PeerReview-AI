import React from 'react';
import { useAssignmentGroupAnalytics } from '@/features/analytics/hooks/useAnalytics';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { GroupRadarChart } from '@/features/analytics/components/GroupRadarChart';
import { AssignmentContributionTable } from '@/features/analytics/components/AssignmentContributionTable';

interface Member {
  id: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

interface StudentAnalyticsTabProps {
  assignmentId: string;
  groupId: string;
  currentUserId: string;
  groupMembers?: Member[];
}

export const StudentAnalyticsTab: React.FC<StudentAnalyticsTabProps> = ({ assignmentId, groupId, currentUserId, groupMembers = [] }) => {
  const { data: members = [], isLoading, isError, error, refetch } = useAssignmentGroupAnalytics(assignmentId, groupId);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto w-full space-y-4">
         <Skeleton className="h-10 w-full" />
         <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  // 403 error means not published yet
  if (isError && (error as any)?.response?.status === 403) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto w-full">
        <EmptyState
          type="no_permission"
          title="Chờ giảng viên công bố kết quả đánh giá"
          description={(error as any)?.response?.data?.message || "Hiện tại thời gian chấm chéo chưa kết thúc hoặc giảng viên chưa công bố điểm đóng góp. Vui lòng quay lại sau."}
        />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto w-full">
        <EmptyState
          type="error"
          title="Không thể tải kết quả đánh giá"
          description="Đã xảy ra lỗi khi kết nối với máy chủ."
          actionLabel="Thử lại"
          onAction={() => refetch()}
        />
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto w-full">
        <EmptyState
          type="no_data"
          title="Chưa có dữ liệu đánh giá"
          description="Nhóm này chưa có dữ liệu đánh giá nội bộ."
        />
      </div>
    );
  }

  // Chỉ lấy radar data của chính sinh viên đó để vẽ, hoặc vẽ cả nhóm để so sánh (đề bài: "SV xem radar sau publish")
  // Tôi sẽ truyền toàn bộ members vào để có cái nhìn tổng quan, nhưng highlight current user và ẩn danh những người khác
  const getDisplayName = (user: Member | undefined) => {
    if (!user) return undefined;
    if (user.full_name) return user.full_name;
    if (user.first_name || user.last_name) return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    if (user.email) return user.email.split('@')[0];
    return undefined;
  };

  const maskedMembers = members.map((m: any, index: number) => {
    const matchedMember = groupMembers.find(g => g.id === m.userId);
    const displayName = getDisplayName(matchedMember) || m.name || `Thành viên ${index + 1}`;
    return {
      ...m,
      name: m.userId === currentUserId ? displayName + ' (Bạn)' : displayName,
      color: m.userId === currentUserId ? '#4f46e5' : '#94a3b8'
    };
  });

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto w-full space-y-6">
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-800">
        Giảng viên đã công bố kết quả đánh giá. Dưới đây là phân tích mức độ đóng góp dựa trên số lượng công việc hoàn thành và phiếu chấm chéo.
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-white p-6 border border-gray-200 rounded-2xl shadow-sm">
         <div className="col-span-1 border-r border-gray-100 pr-4">
            <GroupRadarChart data={maskedMembers} />
         </div>
         <div className="col-span-2">
            <AssignmentContributionTable members={maskedMembers} />
         </div>
      </div>
    </div>
  );
};
