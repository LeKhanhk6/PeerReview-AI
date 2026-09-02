import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useApiQuery } from '@/hooks/useApiQuery';
import {
  getTeacherClassesApi,
  getDashboardOverviewApi,
  getClassCollaborationRisksApi,
} from '../api/teacherDashboardApi';
import { analyticsMessages } from '@/constants/messages/analytics';
import { formatPercentage, formatScore } from '@/utils/number.utils';
import { calculateDaysLeftStatus } from '@/utils/date.utils';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/axios';

export const TeacherDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  // 1. Fetch Teacher Classes
  const { data: rawClasses = [] } = useApiQuery(
    ['teacher-classes'],
    getTeacherClassesApi
  );

  const classes = Array.isArray(rawClasses)
    ? rawClasses
    : (rawClasses as any)?.classes || (rawClasses as any)?.rows || [];

  // Default to first class if available and no class selected
  useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  // 2. Fetch Overview Metrics
  const {
    data: overview,
    isLoading: isOverviewLoading,
    isError: isOverviewError,
  } = useApiQuery(
    ['teacher-dashboard-overview', selectedClassId],
    () => getDashboardOverviewApi(selectedClassId || undefined)
  );

  // 3. Fetch Early Warning Collaboration Risks
  const {
    data: rawRisks = [],
    isLoading: isRisksLoading,
  } = useApiQuery(
    ['teacher-dashboard-risks', selectedClassId],
    () => getClassCollaborationRisksApi(selectedClassId),
    { enabled: Boolean(selectedClassId) }
  );

  const risks = Array.isArray(rawRisks) ? rawRisks : [];

  // 4. Fetch Teacher Assignments for selected class or all classes
  const { data: assignmentsData } = useApiQuery(
    ['teacher-assignments-list', selectedClassId],
    async () => {
      const params = selectedClassId ? { classId: selectedClassId } : {};
      const res = (await api.get('/assignments', { params })) as any;
      return res.data || res.rows || res || [];
    }
  );

  const assignments = Array.isArray(assignmentsData)
    ? assignmentsData
    : assignmentsData?.rows || [];

  // Sort risks: HIGH severity first -> MEDIUM -> score DESC
  const sortedRisks = [...risks].sort((a, b) => {
    if (a.severity !== b.severity) {
      return a.severity === 'HIGH' ? -1 : 1;
    }
    return (b.score || 0) - (a.score || 0);
  });

  const topRisks = sortedRisks.slice(0, 5);

  if (isOverviewLoading) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-80 lg:col-span-2 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isOverviewError) {
    return (
      <EmptyState
        type="error"
        title="Không thể tải dữ liệu Tổng quan Giảng viên"
        description={analyticsMessages.error.fetchFailed}
        actionLabel="Thử lại"
        onAction={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Top Header & Class Selector Dropdown */}
      <div className="bg-white p-4 md:p-5 rounded-xl shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            {analyticsMessages.teacherDashboardTitle}, {user?.full_name || 'Giảng viên'} 👋
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            {analyticsMessages.teacherDashboardSubtitle}
          </p>
        </div>

        {/* Class Filter Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="class-select" className="text-xs font-semibold text-slate-700 whitespace-nowrap">
            {analyticsMessages.filter.selectClass}
          </label>
          <select
            id="class-select"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
          >
            <option value="">{analyticsMessages.filter.allClasses}</option>
            {classes.map((cls: any) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 5 Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">{analyticsMessages.overview.totalClasses}</div>
          <div className="text-xl font-bold text-slate-900 mt-0.5">{overview?.totalClasses || 0}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">{analyticsMessages.overview.totalStudents}</div>
          <div className="text-xl font-bold text-slate-900 mt-0.5">{overview?.totalStudents || 0}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">{analyticsMessages.overview.submissionRate}</div>
          <div className="text-xl font-bold text-blue-600 mt-0.5">
            {formatPercentage(overview?.submissionRate)}
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">{analyticsMessages.overview.reviewCompletionRate}</div>
          <div className="text-xl font-bold text-purple-600 mt-0.5">
            {formatPercentage(overview?.reviewCompletionRate)}
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">{analyticsMessages.overview.averageScore}</div>
          <div className="text-xl font-bold text-emerald-600 mt-0.5">
            {formatScore(overview?.averageScore, 100)}
          </div>
        </div>
      </div>

      {/* Main Content: Left = Active Assignments, Right = Early Warning Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5 items-start">
        {/* Left Column: Active Assignments & Classes Overview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm md:text-base font-bold text-slate-900">
                Bài tập & Đợt đánh giá chéo đang diễn ra
              </h2>
              <Link to="/teacher/assignments/new">
                <Button variant="default" size="sm" className="text-xs px-3 py-1.5">
                  + Tạo bài tập mới
                </Button>
              </Link>
            </div>

            {assignments.length === 0 ? (
              <EmptyState
                type="no_data"
                title="Chưa có bài tập nào"
                description="Lớp học này hiện chưa tạo bài tập hoặc đợt chấm chéo nào."
              />
            ) : (
              <div className="space-y-2.5">
                {assignments.map((assignment: any) => {
                  const daysStatus = calculateDaysLeftStatus(assignment.deadline);
                  return (
                    <div
                      key={assignment.id}
                      className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <h3 className="text-xs md:text-sm font-bold text-slate-900">{assignment.title}</h3>
                        <p className="text-xs text-slate-500">
                          Hạn nộp: {new Date(assignment.deadline).toLocaleDateString('vi-VN')}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${daysStatus.badgeClasses}`}>
                          {daysStatus.label}
                        </span>

                        <Link to={`/teacher/assignments/${assignment.id}/submissions`}>
                          <Button variant="outline" size="sm" className="text-xs px-2.5 py-1">
                            📂 Theo dõi bài nộp
                          </Button>
                        </Link>

                        <Link to={`/teacher/assignments/${assignment.id}/synthesis`}>
                          <Button variant="outline" size="sm" className="text-xs px-2.5 py-1">
                            Xem tổng hợp AI
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Early Warning Panel */}
        <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm md:text-base font-bold text-slate-900 flex items-center gap-1.5">
              <span>🚨</span> {analyticsMessages.earlyWarning.widgetTitle}
            </h2>
            <Link to="/teacher/analytics">
              <span className="text-xs font-medium text-blue-600 hover:text-blue-500">
                {analyticsMessages.earlyWarning.viewAllBtn} →
              </span>
            </Link>
          </div>

          {isRisksLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 rounded-lg" />
              <Skeleton className="h-16 rounded-lg" />
            </div>
          ) : topRisks.length === 0 ? (
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-center space-y-1">
              <div className="text-emerald-700 font-bold text-xs">
                {analyticsMessages.empty.noRisksTitle}
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                {analyticsMessages.empty.noRisksDescription}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {topRisks.map((risk) => {
                const isHigh = risk.severity === 'HIGH';
                const riskLabel =
                  analyticsMessages.riskTypes[risk.riskType] || risk.riskType;

                return (
                  <div
                    key={risk.id}
                    onClick={() => {
                      if (selectedClassId) {
                        navigate(`/teacher/classes/${selectedClassId}`);
                      } else {
                        navigate('/teacher/analytics');
                      }
                    }}
                    className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-2xs ${
                      isHigh
                        ? 'bg-rose-50/60 border-rose-200 hover:border-rose-300'
                        : 'bg-amber-50/60 border-amber-200 hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isHigh
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {isHigh
                          ? analyticsMessages.severities.HIGH.label
                          : analyticsMessages.severities.MEDIUM.label}
                      </span>

                      <span className="text-[11px] font-semibold text-slate-700">
                        {risk.groupName}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 mb-0.5">
                      {riskLabel}
                    </h4>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {risk.message}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
