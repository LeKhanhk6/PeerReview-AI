import React, { useState } from 'react';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { Lightbulb, AlertTriangle } from 'lucide-react';

import { EmptyState } from '@/components/ui/EmptyState';
import { analyticsMessages } from '@/constants/messages/analytics';
import { toast } from 'sonner';
import { useClassCollaborationRisks } from '../hooks/useAnalytics';
import { EarlyWarningCard } from './EarlyWarningCard';
import type { CollaborationRiskItem, RiskStatus } from '../types/analytics.types';

interface EarlyWarningPanelProps {
  classId: string;
  onViewGroup?: (groupId: string) => void;
}

export const EarlyWarningPanel: React.FC<EarlyWarningPanelProps> = ({ classId, onViewGroup }) => {
  const { data: rawRisks = [], isLoading, isError, refetch } = useClassCollaborationRisks(classId);

  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE');

  // Local state for interactive status overrides, persisted to localStorage
  const [riskStatuses, setRiskStatuses] = useState<Record<string, RiskStatus>>(() => {
    try {
      const stored = localStorage.getItem('peerreview_risk_statuses');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  });

  const handleUpdateStatus = (riskId: string, status: RiskStatus) => {
    setRiskStatuses((prev) => {
      const updated = { ...prev, [riskId]: status };
      try {
        localStorage.setItem('peerreview_risk_statuses', JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
      return updated;
    });
    toast.success(analyticsMessages.earlyWarning.statusUpdatedToast);
  };

  const processedRisks: CollaborationRiskItem[] = rawRisks.map((r, index) => {
    const computedId = r.id || `risk-${r.groupId || 'g'}-${r.userId || 'u'}-${r.riskType || 'type'}-${index}`;
    return {
      ...r,
      id: computedId,
      message: r.message || (r as any).description || 'Cảnh báo rủi ro nhóm',
      status: riskStatuses[computedId] || r.status || 'ACTIVE',
    };
  });

  const filteredRisks = processedRisks.filter((risk) => {
    if (severityFilter && risk.severity !== severityFilter) return false;
    if (statusFilter && risk.status !== statusFilter) return false;
    return true;
  });

  if (!classId) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center text-amber-800 text-sm font-medium flex items-center justify-center gap-2">
        <Lightbulb className="w-5 h-5" /> Vui lòng chọn một Lớp học cụ thể để xem danh sách cảnh báo sớm rủi ro.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" aria-busy="true">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        type="error"
        title="Không thể tải dữ liệu cảnh báo rủi ro"
        description={analyticsMessages.error.riskFetchFailed}
        actionLabel="Thử lại"
        onAction={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header & Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 border border-gray-200 rounded-xl shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" /> {analyticsMessages.earlyWarning.title}
        </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {analyticsMessages.earlyWarning.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Severity Filter */}
          <div>
            <label htmlFor="filter-risk-severity" className="sr-only">
              {analyticsMessages.earlyWarning.filterSeverity}
            </label>
            <select
              id="filter-risk-severity"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{analyticsMessages.earlyWarning.allSeverities}</option>
              <option value="HIGH">{analyticsMessages.severities.HIGH.label}</option>
              <option value="MEDIUM">{analyticsMessages.severities.MEDIUM.label}</option>
              <option value="LOW">{analyticsMessages.severities.LOW.label}</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="filter-risk-status" className="sr-only">
              {analyticsMessages.earlyWarning.filterStatus}
            </label>
            <select
              id="filter-risk-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ACTIVE">{analyticsMessages.earlyWarning.activeStatus}</option>
              <option value="ACKNOWLEDGED">{analyticsMessages.earlyWarning.acknowledgedStatus}</option>
              <option value="DISMISSED">{analyticsMessages.earlyWarning.dismissedStatus}</option>
              <option value="">-- Tất cả trạng thái --</option>
            </select>
          </div>
        </div>
      </div>

      {/* Warnings List or Empty State */}
      {filteredRisks.length === 0 ? (
        <EmptyState
          type="no_data"
          title={analyticsMessages.empty.noRisksTitle}
          description={analyticsMessages.empty.noRisksDescription}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRisks.map((risk) => (
            <EarlyWarningCard
              key={risk.id}
              risk={risk}
              onUpdateStatus={handleUpdateStatus}
              onViewGroup={onViewGroup}
            />
          ))}
        </div>
      )}
    </div>
  );
};
