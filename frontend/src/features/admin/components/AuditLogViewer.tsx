import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { adminMessages } from '@/constants/messages/admin';
import type { AuditLogItem } from '../types/admin.types';

interface AuditLogViewerProps {
  logs: AuditLogItem[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  isLoading: boolean;
  selectedActionType: string;
  onActionTypeFilterChange: (actionType: string) => void;
  onPageChange: (newPage: number) => void;
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
  logs,
  total,
  page,
  limit,
  hasNext,
  isLoading,
  selectedActionType,
  onActionTypeFilterChange,
  onPageChange,
}) => {
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const totalPages = Math.ceil(total / limit) || 1;

  const toggleExpand = (logId: string) => {
    setExpandedLogId((prev) => (prev === logId ? null : logId));
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden space-y-4 p-5">
      {/* Header Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2 border-b border-gray-100">
        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <span>📋</span> {adminMessages.header.auditLogsTitle}
        </h3>

        {/* Action Type Filter */}
        <div className="w-full sm:w-72">
          <select
            value={selectedActionType}
            onChange={(e) => onActionTypeFilterChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{adminMessages.auditLogs.filterAllActions}</option>
            <option value="ADMIN_UPDATE_ROLE">ADMIN_UPDATE_ROLE</option>
            <option value="ADMIN_UPDATE_STATUS">ADMIN_UPDATE_STATUS</option>
            <option value="SUBMISSION_CREATED">SUBMISSION_CREATED</option>
            <option value="REVIEW_SUBMITTED">REVIEW_SUBMITTED</option>
            <option value="EDIT_SUMMARY">EDIT_SUMMARY</option>
            <option value="APPROVE_SUMMARY">APPROVE_SUMMARY</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Content */}
      {isLoading ? (
        <div className="space-y-3 py-4" aria-busy="true">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : logs.length === 0 ? (
        <div className="py-8">
          <EmptyState
            type="no_data"
            title={adminMessages.auditLogs.emptyTitle}
            description={adminMessages.auditLogs.emptyDesc}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            const formattedTime = log.createdAt
              ? new Date(log.createdAt).toLocaleString('vi-VN')
              : '—';

            return (
              <div
                key={log.id}
                className="border border-gray-200 rounded-lg p-4 bg-white hover:border-gray-300 transition-all space-y-2"
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Action Type Badge */}
                    <span className="px-2.5 py-0.5 font-extrabold bg-blue-100 text-blue-800 rounded border border-blue-200">
                      ⚡ {log.actionType}
                    </span>

                    {/* User Info */}
                    <span className="font-bold text-gray-900">
                      👤 {log.userName || 'Hệ thống'} ({log.userEmail})
                    </span>
                  </div>

                  {/* Timestamp */}
                  <span className="text-gray-500 font-mono">🕒 {formattedTime}</span>
                </div>

                {/* Content Summary */}
                <div className="text-xs text-gray-800 font-medium leading-relaxed">
                  {log.contentSummary || 'Không có tóm tắt nội dung.'}
                </div>

                {/* Target ID & Metadata Expand Button */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-gray-500 font-mono">
                    Target ID: {log.targetId || 'N/A'}
                  </span>

                  {log.metadata && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpand(log.id)}
                      className="text-xs text-blue-600 hover:text-blue-800 p-1 h-auto"
                    >
                      {isExpanded ? '▲ Ẩn Metadata' : '▼ Xem Metadata JSON (PII Masked)'}
                    </Button>
                  )}
                </div>

                {/* Metadata JSON Box */}
                {isExpanded && log.metadata && (
                  <div className="mt-2 p-3 bg-gray-900 text-green-400 font-mono text-[11px] rounded-md overflow-x-auto shadow-inner">
                    <div className="text-gray-400 text-[10px] pb-1 border-b border-gray-800 mb-1">
                      {adminMessages.auditLogs.metadataTitle}
                    </div>
                    <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
        <span>
          Trang <strong>{page}</strong> / {totalPages} (Tổng {total} nhật ký vết)
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1 || isLoading}
            onClick={() => onPageChange(page - 1)}
            className="text-xs"
          >
            Trang trước
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!hasNext || page >= totalPages || isLoading}
            onClick={() => onPageChange(page + 1)}
            className="text-xs"
          >
            Trang sau
          </Button>
        </div>
      </div>
    </div>
  );
};
