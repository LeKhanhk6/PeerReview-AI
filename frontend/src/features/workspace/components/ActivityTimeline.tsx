import React from 'react';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { workspaceMessages } from '@/constants/messages/workspace';
import { useGroupActivities } from '../hooks/useWorkspace';
import { Plus, RefreshCw, Trash2, MessageSquare, Folder, Zap, History } from 'lucide-react';

interface ActivityTimelineProps {
  groupId: string;
}

const ACTION_ICONS: Record<string, { icon: React.ReactNode; badgeColor: string }> = {
  TASK_CREATE: { icon: <Plus className="w-4 h-4" />, badgeColor: 'bg-blue-100 text-blue-800' },
  TASK_UPDATE: { icon: <RefreshCw className="w-4 h-4" />, badgeColor: 'bg-amber-100 text-amber-800' },
  TASK_DELETE: { icon: <Trash2 className="w-4 h-4" />, badgeColor: 'bg-red-100 text-red-800' },
  COMMENT_ADD: { icon: <MessageSquare className="w-4 h-4" />, badgeColor: 'bg-purple-100 text-purple-800' },
  SUBMISSION_UPLOAD: { icon: <Folder className="w-4 h-4" />, badgeColor: 'bg-emerald-100 text-emerald-800' },
  DEFAULT: { icon: <Zap className="w-4 h-4" />, badgeColor: 'bg-gray-100 text-gray-800' },
};

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ groupId }) => {
  const { data: rawActivities, isLoading, isError, refetch } = useGroupActivities(groupId);
  const activities: any[] = Array.isArray(rawActivities) ? rawActivities : (rawActivities as any)?.data || [];

  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        type="error"
        title="Không thể tải nhật ký hoạt động"
        description={workspaceMessages.error.fetchFailed}
        actionLabel="Thử lại"
        onAction={() => refetch()}
      />
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4 flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between border-b border-gray-200 pb-3 shrink-0">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <History className="w-5 h-5 text-gray-700" /> {workspaceMessages.timeline.title}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">{workspaceMessages.autoRefreshInfo}</p>
        </div>

        <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full font-mono">
          {activities.length} hoạt động
        </span>
      </div>

      {activities.length === 0 ? (
        <EmptyState
          type="no_data"
          title={workspaceMessages.timeline.emptyTitle}
          description={workspaceMessages.timeline.emptyDesc}
        />
      ) : (
        <div className="flex-1 overflow-y-auto pr-2 pl-2 md:pl-4">
          <div className="relative border-l-2 border-gray-200 space-y-6 py-2">
            {activities.map((act) => {
              const iconConfig = ACTION_ICONS[act.action_type] || ACTION_ICONS.DEFAULT;
              const dateStr = new Date(act.created_at).toLocaleString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              });

              return (
                <div key={act.id} className="relative pl-6">
                  {/* Timeline Dot Icon */}
                  <div
                    className={`absolute -left-[15px] top-0.5 w-7 h-7 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-xs ${iconConfig.badgeColor}`}
                  >
                    {iconConfig.icon}
                  </div>

                  {/* Timeline Item Content */}
                  <div className="bg-gray-50 border border-gray-200 p-3.5 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-gray-900">
                        {act.user_name || 'Người dùng'}
                        <span className={`font-normal ml-1.5 ${act.user_role === 'TEACHER' || act.user_role === 'ADMIN' ? 'text-emerald-600' : 'text-gray-500'}`}>
                          ({act.user_role === 'TEACHER' ? 'Giáo viên' : act.user_role === 'ADMIN' ? 'Quản trị viên' : 'Thành viên'})
                        </span>
                      </span>
                      <span className="text-gray-400 font-mono">{dateStr}</span>
                    </div>

                    <p className="text-sm font-medium text-gray-800">
                      {act.content_summary || `Đã thực hiện thao tác: ${act.action_type}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
