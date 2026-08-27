import React from 'react';
import { Button } from '@/components/ui/Button';
import { analyticsMessages } from '@/constants/messages/analytics';
import type { CollaborationRiskItem, RiskStatus } from '../types/analytics.types';

interface EarlyWarningCardProps {
  risk: CollaborationRiskItem;
  onUpdateStatus: (riskId: string, status: RiskStatus) => void;
  onViewGroup?: (groupId: string) => void;
}

const SEVERITY_STYLES = {
  HIGH: 'bg-red-50 border-red-200 text-red-900',
  MEDIUM: 'bg-amber-50 border-amber-200 text-amber-900',
  LOW: 'bg-blue-50 border-blue-200 text-blue-900',
};

const SEVERITY_BADGE_STYLES = {
  HIGH: 'bg-red-100 text-red-800 border-red-300 font-bold',
  MEDIUM: 'bg-amber-100 text-amber-800 border-amber-300 font-semibold',
  LOW: 'bg-blue-100 text-blue-800 border-blue-300 font-medium',
};

export const EarlyWarningCard: React.FC<EarlyWarningCardProps> = ({
  risk,
  onUpdateStatus,
  onViewGroup,
}) => {
  const severityConfig = analyticsMessages.severities[risk.severity] || analyticsMessages.severities.MEDIUM;
  const cardStyle = SEVERITY_STYLES[risk.severity] || SEVERITY_STYLES.MEDIUM;
  const badgeStyle = SEVERITY_BADGE_STYLES[risk.severity] || SEVERITY_BADGE_STYLES.MEDIUM;
  const currentStatus = risk.status || 'ACTIVE';

  const groupDisplay = risk.groupName || (risk.groupId ? `Nhóm #${risk.groupId}` : 'Chưa phân nhóm');

  return (
    <div
      className={`p-4 border rounded-xl shadow-sm transition-all space-y-3 ${cardStyle} ${
        currentStatus === 'DISMISSED' ? 'opacity-50 grayscale' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              role="status"
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs border ${badgeStyle}`}
            >
              <span aria-hidden="true">{severityConfig.emoji}</span>
              <span>{severityConfig.label}</span>
            </span>

            <span className="text-xs font-bold text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-200">
              👥 {groupDisplay}
            </span>

            {risk.riskType && (
              <span className="text-xs font-semibold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                🏷️ {risk.riskType}
              </span>
            )}

            {risk.userName && (
              <span className="text-xs font-semibold text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-200">
                👤 {risk.userName}
              </span>
            )}
          </div>
        </div>

        {/* Status Tag */}
        {currentStatus === 'ACKNOWLEDGED' && (
          <span role="status" className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
            ✓ {analyticsMessages.earlyWarning.acknowledgedStatus}
          </span>
        )}
        {currentStatus === 'DISMISSED' && (
          <span role="status" className="text-xs font-semibold text-gray-600 bg-gray-200 px-2.5 py-0.5 rounded-full border border-gray-300">
            ✕ {analyticsMessages.earlyWarning.dismissedStatus}
          </span>
        )}
      </div>

      <p className="text-sm font-medium leading-relaxed font-sans">
        {risk.message || (risk as any).description || 'Cảnh báo rủi ro trong nhóm'}
      </p>

      {/* Action Buttons & Deep Link */}
      <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between flex-wrap gap-2">
        <div>
          {risk.groupId && onViewGroup && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onViewGroup(risk.groupId!)}
              className="bg-white hover:bg-gray-50 text-xs"
              aria-label={`${analyticsMessages.earlyWarning.actionViewGroup} ${groupDisplay}`}
            >
              🔍 {analyticsMessages.earlyWarning.actionViewGroup}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {currentStatus !== 'ACKNOWLEDGED' && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onUpdateStatus(risk.id, 'ACKNOWLEDGED')}
              className="bg-white hover:bg-emerald-50 hover:text-emerald-800 text-xs"
              aria-label={`Tiếp nhận cảnh báo ${groupDisplay}`}
            >
              ✓ {analyticsMessages.earlyWarning.actionAcknowledge}
            </Button>
          )}

          {currentStatus !== 'DISMISSED' && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onUpdateStatus(risk.id, 'DISMISSED')}
              className="text-gray-500 hover:text-red-700 text-xs"
              aria-label={`Bỏ qua cảnh báo ${groupDisplay}`}
            >
              ✕ {analyticsMessages.earlyWarning.actionDismiss}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
