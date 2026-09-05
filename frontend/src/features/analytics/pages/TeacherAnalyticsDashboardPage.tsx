import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { BarChart2, Lightbulb } from 'lucide-react';
import { analyticsMessages } from '@/constants/messages/analytics';
import { useClassesList } from '@/features/assignment/hooks/useAssignments';
import { useDashboardOverview, useClassContributions, useClassCollaborationRisks } from '../hooks/useAnalytics';
import { GroupContributionCard } from '../components/GroupContributionCard';
import { GroupContributionDetailModal } from '../components/GroupContributionDetailModal';
import { EarlyWarningPanel } from '../components/EarlyWarningPanel';

type AnalyticsTab = 'contribution' | 'earlyWarning';

export const TeacherAnalyticsDashboardPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedClassId = searchParams.get('classId') || '';
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('contribution');

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const { data: classes = [], isLoading: isLoadingClasses } = useClassesList();
  const { data: overviewMetrics, isLoading: isLoadingOverview, isError: isErrorOverview } =
    useDashboardOverview(selectedClassId || undefined);
  const { data: groupsContributions = [], isLoading: isLoadingGroups, isError: isErrorGroups } =
    useClassContributions(selectedClassId);
  const { data: risks = [] } = useClassCollaborationRisks(selectedClassId);

  let activeRisksCount = 0;
  try {
    const stored = localStorage.getItem('peerreview_risk_statuses');
    const riskStatuses = stored ? JSON.parse(stored) : {};
    
    activeRisksCount = risks.filter((r, index) => {
      const computedId = r.id || `risk-${r.groupId || 'g'}-${r.userId || 'u'}-${r.riskType || 'type'}-${index}`;
      const status = riskStatuses[computedId] || r.status || 'ACTIVE';
      return status === 'ACTIVE';
    }).length;
  } catch (e) {
    activeRisksCount = risks.filter((r) => r.status === 'ACTIVE' || !r.status).length;
  }

  const handleClassFilterChange = (classId: string) => {
    const params = new URLSearchParams(searchParams);
    if (classId) {
      params.set('classId', classId);
    } else {
      params.delete('classId');
    }
    setSearchParams(params);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 pr-1 pt-4">
      {/* Page Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 border border-slate-100 rounded-2xl shadow-sm shrink-0">
        <div className="space-y-1.5">
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-indigo-600" /> {analyticsMessages.title}
          </h1>
          <p className="text-xs md:text-sm text-slate-500">{analyticsMessages.subtitle}</p>
        </div>

        <div className="w-full md:w-72">
          <label htmlFor="filter-analytics-class" className="block text-xs font-bold text-slate-700 mb-1.5">
            {analyticsMessages.filter.selectClass}
          </label>
          <select
            id="filter-analytics-class"
            value={selectedClassId}
            onChange={(e) => handleClassFilterChange(e.target.value)}
            disabled={isLoadingClasses}
            className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
          >
            <option value="">{analyticsMessages.filter.allClasses}</option>
            {classes.map((cls: any) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} ({cls.course_code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 space-x-4">
        <button
          type="button"
          onClick={() => setActiveTab('contribution')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'contribution'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {analyticsMessages.tabs.contribution}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('earlyWarning')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'earlyWarning'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {analyticsMessages.tabs.earlyWarning}
          {activeRisksCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-black bg-red-500 text-white rounded-full">
              {activeRisksCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Contribution Dashboard */}
      {activeTab === 'contribution' && (
        <div className="space-y-6">
          {/* Overview Metrics Cards Grid */}
          {isLoadingOverview ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-busy="true">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : isErrorOverview ? (
            <EmptyState
              type="error"
              title="Không thể tải thống kê tổng quan"
              description={analyticsMessages.error.fetchFailed}
              actionLabel="Thử lại"
              onAction={() => window.location.reload()}
            />
          ) : (
            overviewMetrics && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Students */}
                <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm space-y-1">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {analyticsMessages.overview.totalStudents}
                  </span>
                  <p className="text-2xl font-black text-gray-900">{overviewMetrics.totalStudents}</p>
                  <p className="text-xs text-gray-400">Từ {overviewMetrics.totalClasses} lớp học</p>
                </div>

                {/* Submission Rate */}
                <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm space-y-1">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {analyticsMessages.overview.submissionRate}
                  </span>
                  <p className="text-2xl font-black text-brand-primary">{overviewMetrics.submissionRate}%</p>
                  <p className="text-xs text-gray-400">
                    {overviewMetrics.actualSubmissions} / {overviewMetrics.expectedSubmissions} bài nộp
                  </p>
                </div>

                {/* Review Completion Rate */}
                <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm space-y-1">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {analyticsMessages.overview.reviewCompletionRate}
                  </span>
                  <p className="text-2xl font-black text-emerald-600">
                    {overviewMetrics.reviewCompletionRate}%
                  </p>
                  <p className="text-xs text-gray-400">
                    {overviewMetrics.completedReviews} / {overviewMetrics.expectedReviews} bài chấm
                  </p>
                </div>

                {/* Average Score */}
                <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm space-y-1">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {analyticsMessages.overview.averageScore}
                  </span>
                  <p className="text-2xl font-black text-purple-600">
                    {overviewMetrics.averageScore} <span className="text-sm font-normal text-gray-500">/ 10</span>
                  </p>
                  <p className="text-xs text-gray-400">Điểm trung bình toàn lớp</p>
                </div>
              </div>
            )
          )}

          {/* Group Contribution Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                Danh Sách Đóng Góp Theo Nhóm
              </h2>
            </div>

            {!selectedClassId ? (
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 text-center text-indigo-700 text-sm font-medium flex items-center justify-center gap-2">
                <Lightbulb className="w-5 h-5" /> Vui lòng chọn một Lớp học cụ thể ở trên để xem chi tiết các nhóm học phần.
              </div>
            ) : isLoadingGroups ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" aria-busy="true">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : isErrorGroups ? (
              <EmptyState
                type="error"
                title="Không thể tải danh sách đóng góp nhóm"
                description={analyticsMessages.error.fetchFailed}
              />
            ) : groupsContributions.length === 0 ? (
              <EmptyState
                type="no_data"
                title={analyticsMessages.empty.noGroupsTitle}
                description={analyticsMessages.empty.noGroupsDescription}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupsContributions.map((group) => (
                  <GroupContributionCard
                    key={group.groupId}
                    group={group}
                    onSelectGroup={(groupId) => setSelectedGroupId(groupId)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Early Warning Panel */}
      {activeTab === 'earlyWarning' && (
        <EarlyWarningPanel
          classId={selectedClassId}
          onViewGroup={(groupId) => setSelectedGroupId(groupId)}
        />
      )}

      {/* Level 2 Detail Modal (Accessible from both Tabs) */}
      <GroupContributionDetailModal
        groupId={selectedGroupId}
        isOpen={Boolean(selectedGroupId)}
        onClose={() => setSelectedGroupId(null)}
      />
    </div>
  );
};
