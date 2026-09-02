import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { adminMessages } from '@/constants/messages/admin';
import { ClipboardList, Zap, User, Clock, ChevronDown, ChevronUp, Copy, CheckCircle2 } from 'lucide-react';
import type { AuditLogItem } from '../types/admin.types';
import { cn } from '@/lib/utils';

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
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const totalPages = Math.ceil(total / limit) || 1;

  const toggleExpand = (logId: string) => {
    setExpandedLogId((prev) => (prev === logId ? null : logId));
  };

  const handleCopyJSON = (id: string, metadata: any) => {
    navigator.clipboard.writeText(JSON.stringify(metadata, null, 2));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('SUBMIT')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (action.includes('DELETE') || action.includes('REMOVE')) return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 md:p-6 space-y-4">
      {/* Header Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 shrink-0">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-brand-primary" /> {adminMessages.header.auditLogsTitle}
        </h3>

        {/* Action Type Filter */}
        <div className="w-full sm:w-72">
          <select
            value={selectedActionType}
            onChange={(e) => onActionTypeFilterChange(e.target.value)}
            className="w-full h-10 px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary"
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
        <div className="py-8 shrink-0">
          <EmptyState
            type="no_data"
            title={adminMessages.auditLogs.emptyTitle}
            description={adminMessages.auditLogs.emptyDesc}
          />
        </div>
      ) : (
        <div className="space-y-3 w-full">
          {logs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            const formattedTime = log.createdAt
              ? new Date(log.createdAt).toLocaleString('vi-VN')
              : '—';

            return (
              <div
                key={log.id}
                className="border border-slate-200 rounded-lg p-4 bg-white hover:border-slate-300 hover:bg-slate-50 transition-all space-y-2"
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Action Type Badge */}
                    <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 font-extrabold rounded border", getActionColor(log.actionType))}>
                      <Zap className="w-3 h-3" /> {log.actionType}
                    </span>

                    {/* User Info */}
                    <span className="font-bold text-gray-900 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-gray-500" /> {log.userName || 'Hệ thống'} {log.userEmail ? `(${log.userEmail})` : ''}
                    </span>
                  </div>

                  {/* Timestamp */}
                  <span className="text-gray-500 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formattedTime}
                  </span>
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
                      className="text-xs text-brand-primary hover:text-brand-hover p-1 h-auto flex items-center gap-1"
                    >
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {isExpanded ? 'Ẩn Metadata' : 'Xem Metadata JSON (PII Masked)'}
                    </Button>
                  )}
                </div>

                {/* Metadata JSON Box */}
                {isExpanded && log.metadata && (
                  <div className="mt-2 relative p-3 bg-gray-900 text-green-400 font-mono text-[11px] rounded-md overflow-x-auto shadow-inner group">
                    <div className="flex justify-between items-center text-gray-400 text-[10px] pb-1 border-b border-gray-800 mb-1">
                      <span>{adminMessages.auditLogs.metadataTitle}</span>
                      <button 
                        onClick={() => handleCopyJSON(log.id, log.metadata)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-white flex items-center gap-1"
                      >
                        {copiedId === log.id ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedId === log.id ? 'Copied' : 'Copy JSON'}
                      </button>
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
      <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2 text-xs text-slate-500 shrink-0">
        <span>
          {totalPages > 1 ? (
            <>Trang <strong>{page}</strong> / {totalPages} (Tổng {total} nhật ký vết)</>
          ) : (
            <>Tổng {total} nhật ký vết</>
          )}
        </span>
        {totalPages > 1 && (
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
        )}
      </div>
    </div>
  );
};
