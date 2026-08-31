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

type WorkspaceTab = 'kanban' | 'discussions' | 'timeline' | 'files';


export const StudentGroupWorkspacePage: React.FC = () => {
  const { assignmentId, groupId } = useParams<{ assignmentId?: string; groupId?: string }>();
  const targetGroupId = groupId || assignmentId || '';
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('kanban');

  const isValidGroup = Boolean(targetGroupId && targetGroupId !== 'null' && targetGroupId !== 'undefined');

  const { data: groupData, isError: isGroupError } = useQuery({
    queryKey: ['group', 'detail', targetGroupId],
    queryFn: () => groupsApi.getGroupDetail(targetGroupId),
    enabled: isValidGroup,
  });

  const { data: tasksResult } = useGroupTasks(targetGroupId);
  const hasGroup = tasksResult?.hasGroup !== false && !isGroupError;

  if (!isValidGroup || !hasGroup) {
    return (
      <div className="max-w-4xl mx-auto py-12 p-4 space-y-4">
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 border border-gray-200 rounded-xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate('/student/dashboard')}
              className="text-xs bg-white text-gray-700 hover:bg-gray-50"
            >
              ← Quay lại Trang chủ
            </Button>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              {isLeader ? '👑 Trưởng nhóm' : '👤 Thành viên'}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-2">
            🚀 {workspaceMessages.title} - {groupName}
          </h1>
          <p className="text-sm text-gray-600 mt-1">{workspaceMessages.subtitle}</p>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex border-b border-gray-200 space-x-6 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('kanban')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'kanban'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {workspaceMessages.tabs.kanban}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('discussions')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'discussions'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {workspaceMessages.tabs.discussions}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('timeline')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'timeline'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {workspaceMessages.tabs.timeline}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('files')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'files'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {workspaceMessages.tabs.files}
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'kanban' && (
          <TaskBoard
            groupId={targetGroupId}
            userRole={userRole}
            currentUserId={user?.id || ''}
            members={members}
          />
        )}

        {activeTab === 'discussions' && <DiscussionFeed groupId={targetGroupId} />}

        {activeTab === 'timeline' && <ActivityTimeline groupId={targetGroupId} />}

        {activeTab === 'files' && <GroupFileManager groupId={targetGroupId} />}
      </div>
    </div>
  );
};
