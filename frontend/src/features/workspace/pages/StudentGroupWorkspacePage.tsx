import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { workspaceMessages } from '@/constants/messages/workspace';
import { TaskBoard } from '../components/TaskBoard';
import { DiscussionFeed } from '../components/DiscussionFeed';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { GroupFileManager } from '../components/GroupFileManager';
import { groupsApi } from '@/features/groups/api/groups.api';
import { useGroupTasks } from '../hooks/useWorkspace';
import { useAuthStore } from '@/features/auth/store/authStore';

import { useApiQuery } from '@/hooks/useApiQuery';
import { getStudentDashboardAssignmentsApi } from '@/features/student-dashboard/api/studentDashboardApi';

type WorkspaceTab = 'kanban' | 'discussions' | 'timeline' | 'files';

export const StudentGroupWorkspacePage: React.FC = () => {
  const { assignmentId, groupId } = useParams<{ assignmentId?: string; groupId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('kanban');

  // Fallback: If URL has assignmentId instead of groupId, lookup actual group_id from student dashboard assignments
  const { data: dashboardData } = useApiQuery(
    ['student-dashboard-assignments'],
    getStudentDashboardAssignmentsApi,
    { enabled: !groupId && Boolean(assignmentId) }
  );

  const assignmentsList = Array.isArray(dashboardData) ? dashboardData : (dashboardData as any)?.rows || [];
  const matchedAssignment = assignmentsList.find((a: any) => String(a.assignment_id) === String(assignmentId));
  const resolvedGroupId = groupId || matchedAssignment?.group_id || (assignmentId && assignmentId.startsWith('group') ? assignmentId : '');

  const isValidGroup = Boolean(resolvedGroupId && resolvedGroupId !== 'null' && resolvedGroupId !== 'undefined');

  const { data: groupData, isError: isGroupError } = useQuery({
    queryKey: ['group', 'detail', resolvedGroupId],
    queryFn: () => groupsApi.getGroupDetail(resolvedGroupId),
    enabled: isValidGroup,
  });

  const { data: tasksResult } = useGroupTasks(resolvedGroupId);
  const hasGroup = tasksResult?.hasGroup !== false && !isGroupError;

  if (!isValidGroup || !hasGroup) {
    return (
      <div className="max-w-3xl mx-auto py-8 p-3 space-y-4">
        <EmptyState
          type="no_permission"
          title="Bạn chưa tham gia nhóm nào trong lớp học này"
          description="Không gian làm việc nhóm (Kanban, Chat thảo luận, Chia sẻ file, Lịch sử hoạt động) chỉ dành cho sinh viên đã thuộc về một nhóm."
          actionLabel="← Quay lại Trang chủ để Chọn nhóm"
          onAction={() => navigate('/student/dashboard')}
        />
      </div>
    );
  }

  const group = (groupData as any)?.data || groupData || {};
  const groupName = group?.name || 'Nhóm làm việc';
  const isLeader = group?.leader_id === user?.id;
  const userRole = isLeader ? 'LEADER' : 'MEMBER';
  const members = group?.members || [];

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full space-y-4 md:space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 md:p-5 border border-slate-200 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate('/student/dashboard')}
              className="text-xs bg-white text-slate-700 border-slate-200 hover:bg-slate-50 rounded-lg px-2.5 py-1"
            >
              ← Quay lại Trang chủ
            </Button>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              {isLeader ? '👑 Trưởng nhóm' : '👤 Thành viên'}
            </span>
          </div>

          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight mt-2">
            🚀 {workspaceMessages.title} - {groupName}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">{workspaceMessages.subtitle}</p>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex border-b border-slate-200 space-x-4 md:space-x-6 overflow-x-auto bg-white px-3 pt-2.5 rounded-t-xl border border-slate-200 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab('kanban')}
          className={`pb-2.5 text-xs md:text-sm font-bold border-b-2 transition-colors whitespace-nowrap px-1 ${
            activeTab === 'kanban'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          {workspaceMessages.tabs.kanban}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('discussions')}
          className={`pb-2.5 text-xs md:text-sm font-bold border-b-2 transition-colors whitespace-nowrap px-1 ${
            activeTab === 'discussions'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          {workspaceMessages.tabs.discussions}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('timeline')}
          className={`pb-2.5 text-xs md:text-sm font-bold border-b-2 transition-colors whitespace-nowrap px-1 ${
            activeTab === 'timeline'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          {workspaceMessages.tabs.timeline}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('files')}
          className={`pb-2.5 text-xs md:text-sm font-bold border-b-2 transition-colors whitespace-nowrap px-1 ${
            activeTab === 'files'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          {workspaceMessages.tabs.files}
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex flex-col flex-1 min-h-0">
        {activeTab === 'kanban' && (
          <TaskBoard
            groupId={resolvedGroupId}
            userRole={userRole}
            currentUserId={user?.id || ''}
            members={members}
          />
        )}

        {activeTab === 'discussions' && <DiscussionFeed groupId={resolvedGroupId} />}

        {activeTab === 'timeline' && <ActivityTimeline groupId={resolvedGroupId} />}

        {activeTab === 'files' && <GroupFileManager groupId={resolvedGroupId} />}
      </div>
    </div>
  );
};
