import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useApiQuery } from '@/hooks/useApiQuery';
import {
  getStudentDashboardAssignmentsApi,
  getGroupTasksApi,
} from '../api/studentDashboardApi';
import { studentDashboardMessages } from '@/constants/messages/studentDashboard';
import { workspaceMessages } from '@/constants/messages/workspace';
import { calculateDaysLeftStatus, formatDaysLeftLabel } from '@/utils/date.utils';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { JoinGroupModal } from '@/features/groups/components/JoinGroupModal';
import { AlertCircle, Rocket, AlertTriangle, Lock } from 'lucide-react';

// Sub-component for individual Group Workspace Task Progress
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
      <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-2 w-full" />
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
    <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
          {studentDashboardMessages.groupWorkspaceProgressLabel}
        </span>
        <span className="text-xs font-bold text-brand-primary">{progressPct}%</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-brand-primary h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Personal Tasks List */}
      <div className="pt-1.5 border-t border-slate-200/60">
        <div className="text-[11px] font-semibold text-slate-700 mb-1">
          {studentDashboardMessages.myTasksHeader} ({myTasks.length})
        </div>
        {myTasks.length === 0 ? (
          <p className="text-[11px] text-slate-500 italic">
            {studentDashboardMessages.noTasksAssigned}
          </p>
        ) : (
          <ul className="space-y-1 max-h-24 overflow-y-auto pr-1">
            {myTasks.map((task: any) => (
              <li
                key={task.id}
                className="flex items-center justify-between text-xs p-1.5 rounded bg-white border border-slate-100"
              >
                <span className="truncate max-w-[180px] text-slate-800 font-medium">
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
  const classesCount = new Set(assignments.map(a => a.class_id).filter(Boolean)).size;
  const pendingSubmissionCount = assignments.filter((a) => a.submission?.status === 'NOT_STARTED' || a.submission?.status === 'IN_PROGRESS' || !a.submission).length;
  
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
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-5 w-40" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        type="error"
        title="Không thể tải dữ liệu Dashboard"
        description="Đã xảy ra lỗi khi kết nối với máy chủ. Vui lòng kiểm tra lại kết nối mạng."
        actionLabel="Thử lại"
        onAction={() => refetch()}
      />
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col bg-slate-50">
      <div className="shrink-0 space-y-4 md:space-y-5 pb-4 md:pb-5">
        {/* Top Welcome Header */}
      <div className="bg-white p-4 md:p-5 rounded-xl shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            {studentDashboardMessages.welcomeHeader} {user?.full_name || 'Sinh viên'}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            {studentDashboardMessages.subtitle}
          </p>
        </div>
      </div>

      {/* Global Alert Banner if Student has Groupless Classes */}
      {grouplessCount > 0 && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
            <div>
              <h3 className="text-xs md:text-sm font-bold text-amber-900">
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className={`p-2.5 rounded-lg ${classesCount > 0 ? 'bg-brand-soft-bg text-brand-primary' : 'bg-slate-50 text-slate-500'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-900">{classesCount}</div>
            <div className="text-xs font-medium text-slate-500">{studentDashboardMessages.statsClasses}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className={`p-2.5 rounded-lg ${pendingSubmissionCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-900">{pendingSubmissionCount}</div>
            <div className="text-xs font-medium text-slate-500">{studentDashboardMessages.statsAssignments}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className={`p-2.5 rounded-lg ${pendingReviewCount > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-900">{pendingReviewCount}</div>
            <div className="text-xs font-medium text-slate-500">{studentDashboardMessages.statsReviews}</div>
          </div>
        </div>
      </div>

      </div>

      {/* Main Section Header & Filter Tabs */}
      <div className="flex-1 min-h-0 flex flex-col space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <h2 className="text-sm md:text-base font-bold text-slate-900">
            {studentDashboardMessages.activeAssignmentsHeader}
          </h2>

          <div className="inline-flex p-1 bg-slate-200/60 rounded-lg text-xs font-medium self-start sm:self-auto">
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterMode === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {studentDashboardMessages.filterAll} ({assignments.length})
            </button>
            <button
              onClick={() => setFilterMode('URGENT')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterMode === 'URGENT'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {studentDashboardMessages.filterUrgent} ({urgentCount})
            </button>
            <button
              onClick={() => setFilterMode('NEEDS_REVIEW')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterMode === 'NEEDS_REVIEW'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {studentDashboardMessages.filterNeedsReview} ({pendingReviewCount})
            </button>
          </div>
        </div>

        {/* Active Assignments Grid */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 pb-4">
          {filteredAssignments.length === 0 ? (
            <EmptyState
            type="no_data"
            title={studentDashboardMessages.emptyAssignmentsTitle}
            description={studentDashboardMessages.emptyAssignmentsDesc}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
            {filteredAssignments.map((assignment) => {
              const daysStatus = calculateDaysLeftStatus(assignment.deadline);
              const badgeText = formatDaysLeftLabel(daysStatus, workspaceMessages.deadline);
              const subStatus = assignment.submission?.status || 'NOT_STARTED';
              const revStatus = assignment.review?.status || 'NOT_REVIEWED';
              const hasGroup = Boolean(assignment.group_id && assignment.group_id !== 'null' && assignment.group_id !== 'undefined');

              return (
                <div
                  key={assignment.assignment_id}
                  className={`p-4 md:p-5 rounded-xl border shadow-xs flex flex-col justify-between space-y-3 transition-colors ${
                    hasGroup
                      ? 'bg-white border-slate-200 hover:border-slate-300'
                      : 'bg-amber-50/20 border-amber-200/80 hover:border-amber-300'
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Header with Title and Days Left Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link to={`/student/assignments/${assignment.assignment_id}/submit`}>
                          <h3 className="text-sm md:text-base font-bold text-slate-900 line-clamp-1 hover:text-brand-primary transition-colors hover:underline">
                            {assignment.title}
                          </h3>
                        </Link>
                        <p className="text-xs font-medium text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <span>Nhóm:</span>
                          {hasGroup ? (
                            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                              {assignment.group_name}
                            </span>
                          ) : (
                            <span className="text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded border border-amber-300 text-[11px] flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Chưa có nhóm
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Single Source of Truth Days Left Badge */}
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${daysStatus.badgeClasses}`}>
                        {badgeText}
                      </span>
                    </div>

                    {/* Groupless Card Callout */}
                    {!hasGroup && (
                      <div className="p-2.5 bg-amber-100/60 border border-amber-200 rounded-lg flex items-center justify-between gap-2">
                        <span className="text-xs text-amber-900 font-medium flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4" /> Bạn chưa thuộc nhóm nào. Cần tham gia nhóm để nộp bài.
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => setJoinClassTarget({ classId: assignment.class_id || '', className: assignment.title })}
                          className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 px-2.5 py-1"
                        >
                          <Rocket className="w-3.5 h-3.5 mr-1 inline" /> Tham gia nhóm
                        </Button>
                      </div>
                    )}

                    {/* Status Badges Row */}
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      {/* Submission Status Badge */}
                      <span className="text-xs text-slate-500 font-medium">Bài nộp:</span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold border ${
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
                        className={`px-2 py-0.5 rounded text-xs font-semibold border ${
                          revStatus === 'REVIEWED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : revStatus === 'UNDER_REVIEW'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {revStatus === 'REVIEWED'
                          ? studentDashboardMessages.reviewStatusReviewed
                          : revStatus === 'UNDER_REVIEW'
                          ? studentDashboardMessages.reviewStatusUnderReview
                          : studentDashboardMessages.reviewStatusNotReviewed}
                      </span>
                    </div>

                    {/* Group Workspace Progress Widget */}
                    {hasGroup && (
                      <AssignmentGroupWorkspaceWidget
                        groupId={assignment.group_id}
                        currentUserId={user?.id || ''}
                      />
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    {hasGroup ? (
                      <Link to={`/student/groups/${assignment.group_id}/workspace?assignmentId=${assignment.assignment_id}`}>
                        <Button variant="outline" size="sm" className="text-xs px-3 py-1.5">
                          {studentDashboardMessages.actionWorkspace}
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setJoinClassTarget({ classId: assignment.class_id || '', className: assignment.title })}
                        className="text-xs px-3 py-1.5 text-amber-800 border-amber-300 hover:bg-amber-50"
                      >
                        <Rocket className="w-3.5 h-3.5 mr-1 inline" /> Tham gia nhóm
                      </Button>
                    )}

                    <div className="flex items-center gap-2">
                      {revStatus === 'UNDER_REVIEW' && (
                        <Link to={`/student/assignments/${assignment.assignment_id}/reviews`}>
                          <Button variant="secondary" size="sm" className="text-xs px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white border-0">
                            {studentDashboardMessages.actionReview}
                          </Button>
                        </Link>
                      )}

                      {/* Submit Button */}
                      {hasGroup ? (
                        <Link to={`/student/assignments/${assignment.assignment_id}/submit`}>
                          <Button variant="default" size="sm" className="text-xs px-3 py-1.5">
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
                          className="text-xs px-3 py-1.5 opacity-50 cursor-not-allowed"
                        >
                          <Lock className="w-3.5 h-3.5 mr-1 inline" /> Nộp Bài (Cần Nhóm)
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
