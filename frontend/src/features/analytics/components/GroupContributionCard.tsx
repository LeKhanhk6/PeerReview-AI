import React from 'react';
import { Siren } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { analyticsMessages } from '@/constants/messages/analytics';
import type { GroupContributionSummary } from '../types/analytics.types';

interface GroupContributionCardProps {
  group: GroupContributionSummary;
  onSelectGroup: (groupId: string) => void;
}

export const GroupContributionCard: React.FC<GroupContributionCardProps> = ({
  group,
  onSelectGroup,
}) => {
  const displayTitle = group.groupName || analyticsMessages.groupCard.title.replace('{groupId}', group.groupId);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-bold text-gray-900 line-clamp-1">{displayTitle}</h3>
          {group.hasFreeRider ? (
            <span
              role="status"
              className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300 animate-pulse whitespace-nowrap"
            >
              <span aria-hidden="true" className="text-rose-600 mr-1"><Siren className="w-4 h-4 inline" /></span> {analyticsMessages.groupCard.freeRiderWarning}
            </span>
          ) : (
            <span
              role="status"
              className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-300 whitespace-nowrap"
            >
              <span aria-hidden="true">✓</span> {analyticsMessages.groupCard.normalStatus}
            </span>
          )}
        </div>

        {group.memberCount !== undefined && (
          <p className="text-xs text-gray-500">
            👥 {analyticsMessages.groupCard.memberCount.replace('{count}', String(group.memberCount))}
          </p>
        )}
      </div>

      <div className="pt-2 border-t border-gray-100 flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onSelectGroup(group.groupId)}
          aria-label={`${analyticsMessages.groupCard.viewDetailBtn} ${displayTitle}`}
        >
          🔍 {analyticsMessages.groupCard.viewDetailBtn}
        </Button>
      </div>
    </div>
  );
};
