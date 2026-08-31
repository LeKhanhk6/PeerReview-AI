import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useApiQuery } from '@/hooks/useApiQuery';
import {
  getStudentDashboardAssignmentsApi,
  getGroupTasksApi,
} from '../api/studentDashboardApi';
import { studentDashboardMessages } from '@/constants/messages/studentDashboard';
import { calculateDaysLeftStatus } from '@/utils/date.utils';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { JoinGroupModal } from '@/features/groups/components/JoinGroupModal';

// Sub-component for individual Group Workspace Task Progress (Handles Multiple Groups 1:1 per assignment)
const AssignmentGroupWorkspaceWidget: React.FC<{ groupId?: string; currentUserId: string }> = ({
  groupId,
  currentUserId,
}) => {
  if (!groupId) return null;

  const { data: tasksResult, isLoading } = useApiQuery(
    ['group-tasks', groupId],
    () => getGroupTasksApi(groupId),
    { enabled: Boolean(groupId) }
  );

  if (isLoading) {
    return (
      <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-full" />
      </div>
    );
  }

  const tasksList = Array.isArray(tasksResult)
    ? tasksResult
    : (tasksResult as any)?.data || [];
  const totalTasks = tasksList.length;
  const doneTasks = tasksList.filter((t: any) => t.status === 'DONE').length;
  const progressPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const myTasks = tasksList.filter((t: any) => t.assignee_id === currentUserId);

  return (
    <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
          {studentDashboardMessages.groupWorkspaceProgressLabel}
        </span>
        <span className="text-xs font-bold text-blue-600">{progressPct}%</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Personal Tasks List */}
      <div className="pt-2 border-t border-slate-200/60">
        <div className="text-xs font-medium text-slate-700 mb-1">
          {studentDashboardMessages.myTasksHeader} ({myTasks.length})
        </div>
        {myTasks.length === 0 ? (
          <p className="text-xs text-slate-500 italic">
            {studentDashboardMessages.noTasksAssigned}
          </p>
        ) : (
          <ul className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
            {myTasks.map((task: any) => (
              <li
                key={task.id}
                className="flex items-center justify-between text-xs p-1.5 rounded bg-white border border-slate-100"
              >
                <span className="truncate max-w-[200px] text-slate-800 font-medium">
                  {task.title}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                    task.status === 'DONE'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : task.status === 'IN_PROGRESS'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {task.status === 'DONE'
                    ? studentDashboardMessages.taskStatusDone
                    : task.status === 'IN_PROGRESS'
                    ? studentDashboardMessages.taskStatusInProgress
                    : studentDashboardMessages.taskStatusTodo}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export const StudentDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [filterMode, setFilterMode] = useState<'ALL' | 'URGENT' | 'NEEDS_REVIEW'>('ALL');
  
  // Join Group Modal state
  const [joinClassTarget, setJoinClassTarget] = useState<{ classId: string; className: string } | null>(null);

  const {
    data: dashboardData,
    isLoading,
    isError,
    refetch,
  } = useApiQuery(
    ['student-dashboard-assignments'],
    getStudentDashboardAssignmentsApi
  );

  const assignments = Array.isArray(dashboardData)
    ? dashboardData
    : dashboardData?.rows || [];

  // Filter calculations
  const urgentCount = assignments.filter((a) => (a.days_left ?? 999) <= 3).length;
  const pendingReviewCount = assignments.filter((a) => a.review?.status === 'UNDER_REVIEW').length;
  const grouplessCount = assignments.filter((a) => !a.group_id || a.group_id === 'null' || a.group_id === 'undefined').length;

  const filteredAssignments = assignments.filter((item) => {
    if (filterMode === 'URGENT') return (item.days_left ?? 999) <= 3;
    if (filterMode === 'NEEDS_REVIEW') return item.review?.status === 'UNDER_REVIEW';
    return true;
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <EmptyState
          type="error"
          title="Không thể tải dữ liệu Dashboard"
          description="Đã xảy ra lỗi khi kết nối với máy chủ. Vui lòng kiểm tra lại kết nối mạng."
          actionLabel="Thử lại"
          onAction={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-slate-50/50 min-h-screen">
      {/* Top Welcome Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {studentDashboardMessages.welcomeHeader} {user?.full_name || 'Sinh viên'} 👋
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {studentDashboardMessages.subtitle}
          </p>
        </div>
      </div>

      {/* Global Alert Banner if Student has Groupless Classes (Giao diện A Alert) */}
      {grouplessCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🟡</span>
            <div>
              <h3 className="text-sm font-bold text-amber-900">
                Bạn có {grouplessCount} môn học chưa thuộc nhóm nào
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                Vui lòng tham gia nhóm để mở khóa tính năng Nộp bài tập và sử dụng Không gian làm việc nhóm (Workspace).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3 Quick Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-blue-50 text-blue-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{assignments.length}</div>
            <div className="text-xs font-medium text-slate-500">{studentDashboardMessages.statsClasses}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-amber-50 text-amber-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{urgentCount}</div>
            <div className="text-xs font-medium text-slate-500">{studentDashboardMessages.statsAssignments}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-purple-50 text-purple-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{pendingReviewCount}</div>
            <div className="text-xs font-medium text-slate-500">{studentDashboardMessages.statsReviews}</div>
          </div>
        </div>
      </div>

      {/* Main Section Header & Filter Tabs */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-900">
            {studentDashboardMessages.activeAssignmentsHeader}
          </h2>

          <div className="inline-flex p-1 bg-slate-200/60 rounded-xl text-xs font-medium">
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterMode === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {studentDashboardMessages.filterAll} ({assignments.length})
            </button>
            <button
              onClick={() => setFilterMode('URGENT')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterMode === 'URGENT'
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {studentDashboardMessages.filterUrgent} ({urgentCount})
            </button>
            <button
              onClick={() => setFilterMode('NEEDS_REVIEW')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterMode === 'NEEDS_REVIEW'
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {studentDashboardMessages.filterNeedsReview} ({pendingReviewCount})
            </button>
          </div>
        </div>

        {/* Active Assignments Grid */}
        {filteredAssignments.length === 0 ? (
          <EmptyState
            type="no_data"
            title={studentDashboardMessages.emptyAssignmentsTitle}
            description={studentDashboardMessages.emptyAssignmentsDesc}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredAssignments.map((assignment) => {
              const daysStatus = calculateDaysLeftStatus(assignment.deadline);
              const subStatus = assignment.submission?.status || 'NOT_STARTED';
              const revStatus = assignment.review?.status || 'NOT_REVIEWED';
              const hasGroup = Boolean(assignment.group_id && assignment.group_id !== 'null' && assignment.group_id !== 'undefined');

              return (
                <div
                  key={assignment.assignment_id}
                  className={`p-6 rounded-2xl border shadow-sm flex flex-col justify-between space-y-4 transition-colors ${
                    hasGroup
                      ? 'bg-white border-slate-100 hover:border-slate-300'
                      : 'bg-amber-50/20 border-amber-200/80 hover:border-amber-300'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header with Title and Days Left Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 line-clamp-1">
                          {assignment.title}
                        </h3>
                        <p className="text-xs font-medium text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <span>Nhóm:</span>
                          {hasGroup ? (
                            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {assignment.group_name}
                            </span>
                          ) : (
                            <span className="text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                              🟡 Chưa có nhóm
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Single Source of Truth Days Left Badge */}
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${daysStatus.badgeClasses}`}>
                        {daysStatus.label}
                      </span>
                    </div>

                    {/* Giao diện A Groupless Card Callout */}
                    {!hasGroup && (
                      <div className="p-3 bg-amber-100/60 border border-amber-200 rounded-xl flex items-center justify-between gap-3">
                        <span className="text-xs text-amber-900 font-medium">
                          ⚠️ Bạn chưa thuộc nhóm nào. Cần tham gia nhóm để nộp bài.
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => setJoinClassTarget({ classId: assignment.class_id || '', className: assignment.title })}
                          className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0"
                        >
                          🚀 Tham gia nhóm
                        </Button>
                      </div>
                    )}

                    {/* Status Badges Row */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {/* Submission Status Badge */}
                      <span className="text-xs text-slate-500 font-medium">Bài nộp:</span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${
                          subStatus === 'SUBMITTED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : subStatus === 'LATE'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : subStatus === 'IN_PROGRESS'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {subStatus === 'SUBMITTED'
                          ? studentDashboardMessages.submissionStatusSubmitted
                          : subStatus === 'LATE'
                          ? studentDashboardMessages.submissionStatusLate
                          : subStatus === 'IN_PROGRESS'
                          ? studentDashboardMessages.submissionStatusInProgress
                          : studentDashboardMessages.submissionStatusNotStarted}
                      </span>

                      {/* Review Status Badge */}
                      <span className="text-xs text-slate-500 font-medium ml-2">Chấm chéo:</span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${
                          revStatus === 'REVIEWED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : revStatus === 'UNDER_REVIEW'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {revStatus === 'REVIEWED'
                          ? studentDashboardMessages.reviewStatusReviewed
                          : revStatus === 'UNDER_REVIEW'
                          ? studentDashboardMessages.reviewStatusUnderReview
                          : studentDashboardMessages.reviewStatusNotReviewed}
                      </span>
                    </div>

                    {/* Group Workspace Progress Widget (1:1 per Group ID) */}
                    {hasGroup && (
                      <AssignmentGroupWorkspaceWidget
                        groupId={assignment.group_id}
                        currentUserId={user?.id || ''}
                      />
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    {hasGroup ? (
                      <Link to={`/student/assignments/${assignment.assignment_id}/workspace`}>
                        <Button variant="outline" size="sm">
                          {studentDashboardMessages.actionWorkspace}
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setJoinClassTarget({ classId: assignment.class_id || '', className: assignment.title })}
                        className="text-amber-800 border-amber-300 hover:bg-amber-50"
                      >
                        🚀 Tham gia nhóm
                      </Button>
                    )}

                    <div className="flex items-center gap-2">
                      {revStatus === 'UNDER_REVIEW' && (
                        <Link to="/student/reviews">
                          <Button variant="secondary" size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">
                            {studentDashboardMessages.actionReview}
                          </Button>
                        </Link>
                      )}

                      {/* Submit Button: ACTIVE if hasGroup, DISABLED with tooltip if Groupless */}
                      {hasGroup ? (
                        <Link to={`/student/assignments/${assignment.assignment_id}/submit`}>
                          <Button variant="default" size="sm">
                            {subStatus === 'SUBMITTED' || subStatus === 'LATE'
                              ? studentDashboardMessages.actionEditSubmission
                              : studentDashboardMessages.actionSubmit}
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          disabled
                          title="Cần tham gia nhóm trước khi nộp bài"
                          className="opacity-50 cursor-not-allowed"
                        >
                          🔒 Nộp Bài (Cần Nhóm)
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Join Group Modal Dialog */}
      <JoinGroupModal
        open={Boolean(joinClassTarget)}
        onClose={() => setJoinClassTarget(null)}
        classId={joinClassTarget?.classId}
        className={joinClassTarget?.className}
        onSuccess={() => refetch()}
      />
    </div>
  );
};
