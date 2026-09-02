import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, ArrowRight, Siren, FolderOpen, Sparkles, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useApiQuery } from '@/hooks/useApiQuery';
import {
  getTeacherClassesApi,
  getDashboardOverviewApi,
  getClassCollaborationRisksApi,
} from '../api/teacherDashboardApi';
import { analyticsMessages } from '@/constants/messages/analytics';
import { workspaceMessages } from '@/constants/messages/workspace';
import { formatPercentage, formatScore } from '@/utils/number.utils';
import { calculateDaysLeftStatus, formatDaysLeftLabel } from '@/utils/date.utils';
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
      <div className="flex-1 flex flex-col min-h-0 space-y-4">
        <div className="shrink-0 space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="shrink-0 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Skeleton className="h-full lg:col-span-2 rounded-2xl" />
          <Skeleton className="h-full rounded-2xl" />
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

  // Variant color mapping for deadline badges
  const getBadgeColorClass = (variant: string) => {
    switch (variant) {
      case 'rose':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'amber':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'emerald':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const hasSubmissionRate = (overview?.submissionRate || 0) > 0;
  const hasReviewRate = (overview?.reviewCompletionRate || 0) > 0;
  const hasAverageScore = (overview?.averageScore || 0) > 0;

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-4 md:space-y-5 overflow-y-auto lg:overflow-hidden">
      {/* 1. Top Header & Class Selector Dropdown (shrink-0) */}
      <div className="shrink-0 bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            {analyticsMessages.teacherDashboardTitle}, {user?.full_name || 'Giảng viên'} 👋
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            {analyticsMessages.teacherDashboardSubtitle}
          </p>
        </div>

        {/* Class Filter Selector */}
        <div className="flex items-center gap-2.5">
          <label htmlFor="class-select" className="text-xs font-semibold text-slate-700 whitespace-nowrap">
            {analyticsMessages.filter.selectClass}
          </label>
          <select
            id="class-select"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary shadow-xs"
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

      {/* 2. 5 Stat Cards Row (shrink-0) */}
      <div className="shrink-0 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="text-xs md:text-sm font-medium text-slate-500">{analyticsMessages.overview.totalClasses}</div>
          <div className="text-xl md:text-2xl font-bold text-slate-900 mt-1">{overview?.totalClasses || 0}</div>
        </div>

        <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="text-xs md:text-sm font-medium text-slate-500">{analyticsMessages.overview.totalStudents}</div>
          <div className="text-xl md:text-2xl font-bold text-slate-900 mt-1">{overview?.totalStudents || 0}</div>
        </div>

        <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="text-xs md:text-sm font-medium text-slate-500">{analyticsMessages.overview.submissionRate}</div>
          <div className={`text-xl md:text-2xl font-bold mt-1 ${hasSubmissionRate ? 'text-brand-primary' : 'text-slate-700'}`}>
            {formatPercentage(overview?.submissionRate)}
          </div>
        </div>

        <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="text-xs md:text-sm font-medium text-slate-500">{analyticsMessages.overview.reviewCompletionRate}</div>
          <div className={`text-xl md:text-2xl font-bold mt-1 ${hasReviewRate ? 'text-emerald-600' : 'text-slate-700'}`}>
            {formatPercentage(overview?.reviewCompletionRate)}
          </div>
        </div>

        <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="text-xs md:text-sm font-medium text-slate-500">{analyticsMessages.overview.averageScore}</div>
          <div className={`text-xl md:text-2xl font-bold mt-1 ${hasAverageScore ? 'text-amber-600' : 'text-slate-700'}`}>
            {formatScore(overview?.averageScore, 100)}
          </div>
        </div>
      </div>

      {/* 3. Bottom Row: Left = Active Assignments, Right = Early Warning Panel (flex-1 min-h-0) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5 items-stretch">
        {/* Left Column: Active Assignments Card */}
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full min-h-0 space-y-4">
          <div className="shrink-0 flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <h2 className="text-sm md:text-base font-bold text-slate-900">
              Bài tập & Đợt đánh giá chéo đang diễn ra
            </h2>
            <Link to="/teacher/assignments/new">
              <Button
                variant="default"
                size="sm"
                className="bg-brand-primary hover:bg-brand-hover text-white rounded-xl shadow-md px-3.5 py-2 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tạo bài tập mới</span>
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
            <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 pr-1">
              {assignments.map((assignment: any) => {
                const daysStatus = calculateDaysLeftStatus(assignment.deadline);
                const badgeText = formatDaysLeftLabel(daysStatus, workspaceMessages.deadline);

                return (
                  <div
                    key={assignment.id}
                    className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors rounded-xl px-2 -mx-2"
                  >
                    <div className="space-y-0.5">
                      <h3 className="text-xs md:text-sm font-bold text-slate-900">{assignment.title}</h3>
                      <p className="text-xs text-slate-500">
                        Hạn nộp: {new Date(assignment.deadline).toLocaleDateString('vi-VN')}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {/* Compact 1-line Badge Pill */}
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap shrink-0 border ${getBadgeColorClass(daysStatus.variant)}`}
                      >
                        {badgeText}
                      </span>

                      <Link to={`/teacher/assignments/${assignment.id}/submissions`}>
                        <Button variant="outline" size="sm" className="text-xs px-2.5 py-1 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1">
                          <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
                          <span>Theo dõi bài nộp</span>
                        </Button>
                      </Link>

                      <Link to={`/teacher/assignments/${assignment.id}/synthesis`}>
                        <Button variant="outline" size="sm" className="text-xs px-2.5 py-1 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>Xem tổng hợp AI</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Early Warning Risk Panel */}
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full min-h-0 space-y-4">
          <div className="shrink-0 flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <h2 className="text-sm md:text-base font-bold text-slate-900 flex items-center gap-2">
              <Siren className="w-4 h-4 text-rose-600" />
              <span>{analyticsMessages.earlyWarning.widgetTitle}</span>
            </h2>
            <Link
              to="/teacher/analytics"
              className="text-xs md:text-sm font-medium text-brand-primary hover:text-brand-hover inline-flex items-center gap-0.5 transition-colors"
            >
              <span>{analyticsMessages.earlyWarning.viewAllBtn}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isRisksLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
            </div>
          ) : topRisks.length === 0 ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/80 text-center space-y-1">
              <div className="text-emerald-700 font-bold text-xs">
                {analyticsMessages.empty.noRisksTitle}
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                {analyticsMessages.empty.noRisksDescription}
              </p>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
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
                    className={`p-3.5 rounded-xl cursor-pointer transition-all hover:shadow-sm ${
                      isHigh
                        ? 'bg-rose-50 border border-rose-100 hover:border-rose-200'
                        : 'bg-amber-50 border border-amber-100 hover:border-amber-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${
                          isHigh
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
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

                    <h4 className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                      <AlertTriangle className={`w-3.5 h-3.5 ${isHigh ? 'text-rose-600' : 'text-amber-600'}`} />
                      <span>{riskLabel}</span>
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
