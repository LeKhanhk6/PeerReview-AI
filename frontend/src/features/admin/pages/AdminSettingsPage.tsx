import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { adminMessages } from '@/constants/messages/admin';
import { useSystemConfig, useUpdateSystemConfigMutation, useAuditLogs } from '../hooks/useAdmin';
import { AlertTriangle, Settings, Check, Save, History, User, Clock, ArrowRight } from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const { data: configData, isLoading: isLoadingConfig } = useSystemConfig();
  const updateMutation = useUpdateSystemConfigMutation();

  const [auditLogPage, setAuditLogPage] = useState(1);
  const auditLogLimit = 10;

  // Audit Logs query filtered by ADMIN_UPDATE_SYS_CONFIG
  const { data: auditLogsData } = useAuditLogs({
    action_type: 'ADMIN_UPDATE_SYS_CONFIG',
    page: auditLogPage,
    limit: auditLogLimit,
  });

  const auditLogs = auditLogsData?.logs || [];
  const totalAuditLogs = auditLogsData?.total || 0;
  const auditLogHasNext = auditLogsData?.hasNext || false;
  const totalAuditLogPages = Math.ceil(totalAuditLogs / auditLogLimit) || 1;

  // Local Form State
  const [auditLoggingEnabled, setAuditLoggingEnabled] = useState('true');
  const [telemetryEnabled, setTelemetryEnabled] = useState('true');
  const [rateLimitAiMentor, setRateLimitAiMentor] = useState('30');
  const [piiSanitizationMode, setPiiSanitizationMode] = useState('STRICT');

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<{ key: string; oldVal: string; newVal: string }[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync state when configData loads
  useEffect(() => {
    if (configData?.configs) {
      if (configData.configs.audit_logging_enabled !== undefined) {
        setAuditLoggingEnabled(configData.configs.audit_logging_enabled);
      }
      if (configData.configs.telemetry_enabled !== undefined) {
        setTelemetryEnabled(configData.configs.telemetry_enabled);
      }
      if (configData.configs.rate_limit_ai_mentor !== undefined) {
        setRateLimitAiMentor(configData.configs.rate_limit_ai_mentor);
      }
      if (configData.configs.pii_sanitization_mode !== undefined) {
        setPiiSanitizationMode(configData.configs.pii_sanitization_mode);
      }
    }
  }, [configData]);

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Client-side Semantic Validation
    const rateLimitNum = parseInt(rateLimitAiMentor, 10);
    if (isNaN(rateLimitNum) || rateLimitNum <= 0) {
      setValidationError('Giới hạn số request AI Mentor phải là một số nguyên dương > 0');
      return;
    }

    const currentMap = configData?.configs || {};
    const changes: { key: string; oldVal: string; newVal: string }[] = [];

    if (auditLoggingEnabled !== currentMap.audit_logging_enabled) {
      changes.push({
        key: 'audit_logging_enabled',
        oldVal: currentMap.audit_logging_enabled || 'true',
        newVal: auditLoggingEnabled,
      });
    }
    if (telemetryEnabled !== currentMap.telemetry_enabled) {
      changes.push({
        key: 'telemetry_enabled',
        oldVal: currentMap.telemetry_enabled || 'true',
        newVal: telemetryEnabled,
      });
    }
    if (rateLimitAiMentor !== currentMap.rate_limit_ai_mentor) {
      changes.push({
        key: 'rate_limit_ai_mentor',
        oldVal: currentMap.rate_limit_ai_mentor || '30',
        newVal: rateLimitAiMentor,
      });
    }
    if (piiSanitizationMode !== currentMap.pii_sanitization_mode) {
      changes.push({
        key: 'pii_sanitization_mode',
        oldVal: currentMap.pii_sanitization_mode || 'STRICT',
        newVal: piiSanitizationMode,
      });
    }

    if (changes.length === 0) {
      return; // No changes to submit
    }

    setPendingChanges(changes);
    setIsConfirmOpen(true);
  };

  const handleFinalSubmit = async () => {
    setIsConfirmOpen(false);
    const payload: Record<string, string> = {};
    pendingChanges.forEach((c) => {
      payload[c.key] = c.newVal;
    });

    await updateMutation.mutateAsync(payload);
  };

  return (

    <div className="h-full w-full min-w-0 overflow-y-auto space-y-6 max-w-7xl mx-auto pb-12 pr-1">
      {/* Page Header */}
      <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-sm space-y-2">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          {adminMessages.header.settingsTitle}
        </h1>
        <p className="text-sm text-gray-600">{adminMessages.header.settingsSubtitle}</p>
      </div>

      {/* Main Settings Form */}
      {isLoadingConfig ? (
        <div className="space-y-4" aria-busy="true">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <form onSubmit={handleOpenConfirm} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-brand-primary" /> Cấu hình Tham số Vận hành Hệ thống
            </h3>
            <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Active System Config Engine
            </span>
          </div>

          {validationError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md font-medium flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {validationError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Audit Logging Enabled */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-2">
              <label className="block text-sm font-bold text-gray-900">
                Ghi Nhật ký Vết (Audit Logging)
              </label>
              <p className="text-xs text-gray-500">Tự động ghi vết mọi thao tác nhạy cảm vào activity_logs</p>
              <select
                value={auditLoggingEnabled}
                onChange={(e) => setAuditLoggingEnabled(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-md text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="true">Active (Bật ghi nhật ký)</option>
                <option value="false">Inactive (Tắt ghi nhật ký)</option>
              </select>
            </div>

            {/* Telemetry Enabled */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-2">
              <label className="block text-sm font-bold text-gray-900">
                Báo lỗi Client (Telemetry & Error Log)
              </label>
              <p className="text-xs text-gray-500">Thu thập lỗi runtime và báo cáo sự cố mạng qua /api/client-errors</p>
              <select
                value={telemetryEnabled}
                onChange={(e) => setTelemetryEnabled(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-md text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="true">Active (Thu thập lỗi tự động)</option>
                <option value="false">Inactive (Tắt thu thập lỗi)</option>
              </select>
            </div>

            {/* Rate Limit AI Mentor */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-2">
              <label className="block text-sm font-bold text-gray-900">
                Giới hạn tần suất AI Mentor (requests / phút)
              </label>
              <p className="text-xs text-gray-500">Tối đa số request AI Mentor mỗi phút per sinh viên</p>
              <input
                type="number"
                min="1"
                max="300"
                value={rateLimitAiMentor}
                onChange={(e) => setRateLimitAiMentor(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-md text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            {/* PII Sanitization Mode */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-2">
              <label className="block text-sm font-bold text-gray-900">
                Chế độ Bảo mật Chấm chéo (PII Sanitization)
              </label>
              <p className="text-xs text-gray-500">Ẩn danh tính PII giữa sinh viên và người chấm chéo</p>
              <select
                value={piiSanitizationMode}
                onChange={(e) => setPiiSanitizationMode(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-md text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="STRICT">STRICT (Mã hóa nghiêm ngặt Email/Full Name)</option>
                <option value="RELAXED">RELAXED (Chỉ ẩn thông tin nhạy cảm chính)</option>
              </select>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end pt-3 border-t border-gray-100">
            <Button
              type="submit"
              variant="default"
              size="default"
              className="gap-1.5"
              isLoading={updateMutation.isPending}
            >
              <Save className="w-4 h-4" /> Lưu thay đổi cấu hình
            </Button>
          </div>
        </form>
      )}

      {/* System Config Change Audit Trail */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <History className="w-5 h-5 text-brand-primary" /> Lịch sử Thay đổi Cấu hình (Audit Trail)
        </h3>

        {auditLogs.length > 0 ? (
          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div key={log.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50/50 text-xs space-y-1.5">
                <div className="flex justify-between items-center border-b border-gray-200 pb-1">
                  <span className="font-bold text-gray-900 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-gray-500" /> {log.userName || 'Admin'} ({log.userEmail})
                  </span>
                  <span className="text-gray-500 font-mono flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400" /> {log.createdAt ? new Date(log.createdAt).toLocaleString('vi-VN') : '—'}
                  </span>
                </div>
                <p className="text-gray-700 font-medium">{log.contentSummary}</p>

                {/* Render Diff Changes */}
                {log.metadata && (log.metadata as any).changes && (
                  <div className="bg-gray-900 text-green-400 p-2.5 rounded font-mono text-[11px] space-y-1">
                    <p className="text-gray-400 text-[10px] flex items-center gap-1">Chi tiết thay đổi (Old <ArrowRight size={10} /> New):</p>
                    {((log.metadata as any).changes as any[]).map((ch: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-amber-300 font-bold">{ch.key}:</span>
                        <span className="text-red-400 line-through">{ch.old_value ?? 'N/A'}</span>
                        <ArrowRight size={12} className="text-white mx-1" />
                        <span className="text-emerald-300 font-bold">{ch.new_value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500 italic py-2">
            Chưa có lịch sử thay đổi cấu hình nào được ghi nhận.
          </p>
        )}

        {/* Pagination Footer */}
        {totalAuditLogPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2 text-xs text-slate-500 shrink-0">
            <span>
              Trang <strong>{auditLogPage}</strong> / {totalAuditLogPages} (Tổng {totalAuditLogs} nhật ký)
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={auditLogPage <= 1}
                onClick={() => setAuditLogPage(auditLogPage - 1)}
                className="text-xs"
              >
                Trang trước
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!auditLogHasNext || auditLogPage >= totalAuditLogPages}
                onClick={() => setAuditLogPage(auditLogPage + 1)}
                className="text-xs"
              >
                Trang sau
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog showing diff before PATCH */}
      <ConfirmDialog
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleFinalSubmit}
        title="Xác nhận cập nhật cấu hình hệ thống"
        description="Bạn có chắc chắn muốn cập nhật các tham số vận hành hệ thống dưới đây không?"
        isDestructive={false}
      >
        <div className="mt-3 p-3 bg-gray-900 text-white rounded-md text-xs font-mono space-y-1 text-left">
          <p className="text-gray-400 text-[10px] pb-1 border-b border-gray-800">
            Các thay đổi sẽ có hiệu lực tức thì (Instant Cache Invalidation):
          </p>
          {pendingChanges.map((ch, idx) => (
            <div key={idx} className="flex items-center gap-2 py-0.5">
              <span className="text-amber-300 font-bold">{ch.key}:</span>
              <span className="text-red-400 line-through">{ch.oldVal}</span>
              <ArrowRight size={12} className="text-white mx-1" />
              <span className="text-emerald-300 font-bold">{ch.newVal}</span>
            </div>
          ))}
        </div>
      </ConfirmDialog>
    </div>
  );
};
