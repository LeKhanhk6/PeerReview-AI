import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { workspaceMessages } from '@/constants/messages/workspace';
import { TaskBoard } from '../components/TaskBoard';
import { DiscussionFeed } from '../components/DiscussionFeed';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { GroupFileManager } from '../components/GroupFileManager';

type WorkspaceTab = 'kanban' | 'discussions' | 'timeline' | 'files';

export const StudentGroupWorkspacePage: React.FC = () => {
  const { groupId = 'g-101' } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('kanban');

  // Simulated group info - in real app fetched from group API
  const groupName = `Nhóm ${groupId}`;
  const userRole = 'LEADER'; // Simulated role for current student
  const members = [
    { id: 'u-1', name: 'Nguyen Van A (Leader)' },
    { id: 'u-2', name: 'Tran Thi B' },
    { id: 'u-3', name: 'Le Van C' },
  ];

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
              onClick={() => navigate('/student/classes')}
              className="text-xs bg-white text-gray-700 hover:bg-gray-50"
            >
              ← Quay lại danh sách lớp
            </Button>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              {userRole === 'LEADER' ? '👑 Trưởng nhóm' : '👤 Thành viên'}
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
            groupId={groupId}
            userRole={userRole}
            currentUserId="u-1"
            members={members}
          />
        )}

        {activeTab === 'discussions' && <DiscussionFeed groupId={groupId} />}

        {activeTab === 'timeline' && <ActivityTimeline groupId={groupId} />}

        {activeTab === 'files' && <GroupFileManager groupId={groupId} />}
      </div>
    </div>
  );
};
