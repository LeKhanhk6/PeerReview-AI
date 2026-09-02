import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminMessages } from '@/constants/messages/admin';
import { useAuditLogs } from '../hooks/useAdmin';
import { AuditLogViewer } from '../components/AuditLogViewer';

export const AdminAuditLogsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const actionType = searchParams.get('action_type') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const { data, isLoading } = useAuditLogs({
    action_type: actionType || undefined,
    page,
    limit: 15,
  });

  const logs = data?.logs || [];
  const total = data?.total || 0;
  const hasNext = data?.hasNext || false;

  const updateUrlParams = (newParams: Record<string, string | number | undefined>) => {
    const nextParams = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, val]) => {
      if (val !== undefined && val !== '' && val !== 1) {
        nextParams.set(key, String(val));
      } else if (val === 1 && key === 'page') {
        nextParams.delete('page');
      } else {
        nextParams.delete(key);
      }
    });
    setSearchParams(nextParams);
  };

  const handleActionTypeFilterChange = (newActionType: string) => {
    updateUrlParams({ action_type: newActionType, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    updateUrlParams({ page: newPage });
  };

  return (
    <div className="h-full w-full min-w-0 overflow-y-auto space-y-6 max-w-7xl mx-auto pb-12 pr-1">
      {/* Page Header */}
      <div className="bg-white p-6 border border-slate-100 rounded-2xl shadow-sm space-y-1.5 shrink-0">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
          {adminMessages.header.auditLogsTitle}
        </h1>
        <p className="text-xs md:text-sm text-slate-500">{adminMessages.header.auditLogsSubtitle}</p>
      </div>

      {/* Audit Log Viewer */}
      <AuditLogViewer
        logs={logs}
        total={total}
        page={page}
        limit={15}
        hasNext={hasNext}
        isLoading={isLoading}
        selectedActionType={actionType}
        onActionTypeFilterChange={handleActionTypeFilterChange}
        onPageChange={handlePageChange}
      />
    </div>
  );
};
