import React from 'react';
import { Button } from '@/components/ui/Button';
import { analyticsMessages } from '@/constants/messages/analytics';
import { getMemberCategory } from '../constants/thresholds';
import type { GroupMemberContribution } from '../types/analytics.types';

interface ExportCsvButtonProps {
  data: GroupMemberContribution[];
  filename?: string;
  disabled?: boolean;
}

export const ExportCsvButton: React.FC<ExportCsvButtonProps> = ({
  data,
  filename = 'bao_cao_dong_gop.csv',
  disabled = false,
}) => {
  const handleExport = () => {
    if (!data || data.length === 0) return;

    const headers = [
      analyticsMessages.csv.headers.name,
      analyticsMessages.csv.headers.category,
      analyticsMessages.csv.headers.contributionScore,
      analyticsMessages.csv.headers.totalActivities,
      analyticsMessages.csv.headers.tasksAssigned,
      analyticsMessages.csv.headers.tasksCompleted,
      analyticsMessages.csv.headers.tasksCreated,
      analyticsMessages.csv.headers.isFreeRider,
    ];

    const rows = data.map((m) => {
      const categoryKey = getMemberCategory(m);
      const categoryLabel = analyticsMessages.categories[categoryKey]?.label || categoryKey;
      const scorePct = `${Math.round(m.contributionScore * 100)}%`;
      const freeRiderLabel = m.isFreeRider ? 'CÓ' : 'Không';

      return [
        m.name,
        categoryLabel,
        scorePct,
        m.totalActivities,
        m.tasksAssigned,
        m.tasksCompleted,
        m.tasksCreated,
        freeRiderLabel,
      ];
    });

    const escapeCell = (val: any) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvContent =
      '\uFEFF' + // UTF-8 BOM for Microsoft Excel
      [headers.map(escapeCell).join(','), ...rows.map((r) => r.map(escapeCell).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={disabled || !data || data.length === 0}
      aria-label={analyticsMessages.csv.exportBtn}
    >
      📥 {analyticsMessages.csv.exportBtn}
    </Button>
  );
};
