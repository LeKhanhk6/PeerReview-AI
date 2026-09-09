import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
import { Crown, User, Rocket } from 'lucide-react';

import { useApiQuery } from '@/hooks/useApiQuery';
import { getStudentDashboardAssignmentsApi } from '@/features/student-dashboard/api/studentDashboardApi';
import { InternalEvaluationForm } from '../components/InternalEvaluationForm';
import { StudentAnalyticsTab } from '../components/StudentAnalyticsTab';

type WorkspaceTab = 'kanban' | 'discussions' | 'timeline' | 'files' | 'evaluation' | 'analytics';

export const StudentGroupWorkspacePage: React.FC = () => {
  const { groupId } = useParams<{ groupId?: string }>();
  const [searchParams] = useSearchParams();
  const paramAssignmentId = useParams<{ assignmentId?: string }>().assignmentId;
  const queryAssignmentId = searchParams.get('assignmentId');
  const assignmentId = paramAssignmentId || queryAssignmentId || '';
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('kanban');

  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');

  // Fallback: lookup dashboard assignments to resolve assignmentId from groupId
  const { data: dashboardData } = useApiQuery(
    ['student-dashboard-assignments'],
    getStudentDashboardAssignmentsApi,
    { enabled: true } // Always fetch to be safe
  );

  const assignmentsList = Array.isArray(dashboardData) ? dashboardData : (dashboardData as any)?.rows || [];
  
  // If we have groupId but no assignmentId, try to find it
  let resolvedAssignmentId = assignmentId;
  if (!resolvedAssignmentId && groupId && assignmentsList.length > 0) {
    const matched = assignmentsList.find((a: any) => String(a.group_id) === String(groupId));
    if (matched) {
      resolvedAssignmentId = matched.assignment_id;
    }
  }

  const matchedAssignment = assignmentsList.find((a: any) => String(a.assignment_id) === String(resolvedAssignmentId) || String(a.group_id) === String(groupId));
  const resolvedGroupId = groupId || matchedAssignment?.group_id || (resolvedAssignmentId && resolvedAssignmentId.startsWith('group') ? resolvedAssignmentId : '');

  const isValidGroup = Boolean(resolvedGroupId && resolvedGroupId !== 'null' && resolvedGroupId !== 'undefined');

  const { data: groupData, isError: isGroupError } = useQuery({
    queryKey: ['group', 'detail', resolvedGroupId],
    queryFn: () => groupsApi.getGroupDetail(resolvedGroupId),
    enabled: isValidGroup,
  });

  // Group assignments filter (deduplicated by assignment_id)
  const groupAssignments = assignmentsList.filter((a: any) => 
    String(a.group_id) === String(resolvedGroupId) || 
    (groupData && String(a.class_id) === String((groupData as any)?.data?.class_id || (groupData as any)?.class_id))
  );

  const availableAssignmentsMap = new Map<string, any>();
  groupAssignments.forEach((a: any) => {
    const id = a.assignment_id || a.id;
    if (id && !availableAssignmentsMap.has(id)) {
      availableAssignmentsMap.set(id, a);
    }
  });
  const availableGroupAssignments = Array.from(availableAssignmentsMap.values());

  const activeAssignmentId = selectedAssignmentId || matchedAssignment?.assignment_id || resolvedAssignmentId || (availableGroupAssignments.length > 0 ? availableGroupAssignments[0].assignment_id : '');
  const activeAssignment = assignmentsList.find((a: any) => String(a.assignment_id) === String(activeAssignmentId)) || matchedAssignment;

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

  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  const handleBack = () => {
    if (isTeacher) {
      // Typically the teacher comes from the Class Detail page
      navigate(-1);
    } else {
      navigate('/student/dashboard');
    }
  };

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
              onClick={handleBack}
              className="text-xs bg-white text-slate-700 border-slate-200 hover:bg-slate-50 rounded-lg px-2.5 py-1"
            >
              ← Quay lại
            </Button>
            {isTeacher ? (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Giáo viên
              </span>
            ) : (
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 flex items-center gap-1.5">
                {isLeader ? <><Crown className="w-3.5 h-3.5" /> Trưởng nhóm</> : <><User className="w-3.5 h-3.5" /> Thành viên</>}
              </span>
            )}
          </div>

          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight mt-2 flex items-center gap-2">
            <Rocket className="w-6 h-6 text-slate-700" /> {workspaceMessages.title} - {groupName}
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

        {!isTeacher && (
          <button
            type="button"
            onClick={() => setActiveTab('evaluation')}
            className={`pb-2.5 text-xs md:text-sm font-bold border-b-2 transition-colors whitespace-nowrap px-1 ${
              activeTab === 'evaluation'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {workspaceMessages.tabs.evaluation}
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`pb-2.5 text-xs md:text-sm font-bold border-b-2 transition-colors whitespace-nowrap px-1 ${
            activeTab === 'analytics'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          {workspaceMessages.tabs.analytics}
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

        {!isTeacher && activeTab === 'evaluation' && (
          <div className="p-4 md:p-6 max-w-4xl mx-auto w-full h-full overflow-y-auto">
            <InternalEvaluationForm 
              assignmentId={activeAssignmentId}
              groupId={resolvedGroupId}
              groupMembers={members}
              currentUserId={user?.id || ''}
              dueDate={activeAssignment?.deadline || new Date().toISOString()}
              reviewDeadline={activeAssignment?.review_deadline} 
              assignmentTitle={activeAssignment?.title}
              availableAssignments={availableGroupAssignments}
              onSelectAssignment={(id) => setSelectedAssignmentId(id)}
            />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="w-full h-full overflow-y-auto">
            <StudentAnalyticsTab
              assignmentId={activeAssignmentId}
              groupId={resolvedGroupId}
              currentUserId={user?.id || ''}
              groupMembers={members}
              assignmentTitle={activeAssignment?.title}
              availableAssignments={availableGroupAssignments}
              onSelectAssignment={(id) => setSelectedAssignmentId(id)}
            />
          </div>
        )}
      </div>
    </div>
  );
};
