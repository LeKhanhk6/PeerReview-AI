import React from 'react';
import { useAssignmentGroupAnalytics } from '@/features/analytics/hooks/useAnalytics';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { GroupRadarChart } from '@/features/analytics/components/GroupRadarChart';
import { AssignmentContributionTable } from '@/features/analytics/components/AssignmentContributionTable';
import { BarChart3 } from 'lucide-react';

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
  assignmentTitle?: string;
  availableAssignments?: Array<{ assignment_id?: string; id?: string; title: string }>;
  onSelectAssignment?: (id: string) => void;
}

export const StudentAnalyticsTab: React.FC<StudentAnalyticsTabProps> = ({
  assignmentId,
  groupId,
  currentUserId,
  groupMembers = [],
  assignmentTitle,
  availableAssignments = [],
  onSelectAssignment,
}) => {
  const { data: members = [], isLoading, isError, error, refetch } = useAssignmentGroupAnalytics(assignmentId, groupId);

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
      {/* Assignment Context Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 rounded-2xl text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-400/30 text-indigo-300 shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs uppercase tracking-wider font-bold text-indigo-300">Kết quả Đóng góp & Đánh giá</span>
            <h3 className="font-extrabold text-base text-white truncate" title={assignmentTitle}>
              {assignmentTitle ? `Bài tập: ${assignmentTitle}` : 'Bài tập nhóm'}
            </h3>
          </div>
        </div>

        {availableAssignments && availableAssignments.length > 1 && onSelectAssignment && (
          <div className="flex items-center gap-2 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700 shrink-0">
            <label htmlFor="analytics-assignment-select" className="text-xs font-semibold text-slate-300 whitespace-nowrap">
              Xem bài tập khác:
            </label>
            <select
              id="analytics-assignment-select"
              value={assignmentId}
              onChange={(e) => onSelectAssignment(e.target.value)}
              className="bg-slate-900 text-xs font-semibold text-white px-2.5 py-1 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {availableAssignments.map((asm) => {
                const id = asm.assignment_id || asm.id || '';
                return (
                  <option key={id} value={id}>
                    {asm.title}
                  </option>
                );
              })}
            </select>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      ) : isError && (error as any)?.response?.status === 403 ? (
        <EmptyState
          type="no_permission"
          title="Chờ giảng viên công bố kết quả đánh giá"
          description={(error as any)?.response?.data?.message || "Hiện tại thời gian chấm chéo chưa kết thúc hoặc giảng viên chưa công bố điểm đóng góp. Vui lòng quay lại sau."}
        />
      ) : isError ? (
        <EmptyState
          type="error"
          title="Không thể tải kết quả đánh giá"
          description="Đã xảy ra lỗi khi kết nối với máy chủ."
          actionLabel="Thử lại"
          onAction={() => refetch()}
        />
      ) : members.length === 0 ? (
        <EmptyState
          type="no_data"
          title="Chưa có dữ liệu đánh giá"
          description="Nhóm này chưa có dữ liệu đánh giá nội bộ."
        />
      ) : (
        <>
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-800">
            Giảng viên đã công bố kết quả đánh giá cho bài tập này. Dưới đây là phân tích mức độ đóng góp dựa trên số lượng công việc hoàn thành và phiếu chấm chéo.
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-white p-6 border border-gray-200 rounded-2xl shadow-sm">
            <div className="col-span-1 border-r border-gray-100 pr-4">
              <GroupRadarChart data={maskedMembers} />
            </div>
            <div className="col-span-2">
              <AssignmentContributionTable members={maskedMembers} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
