import React from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { adminMessages } from '@/constants/messages/admin';

export const AdminSettingsPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const auditEnabled = user?.capabilities?.audit_enabled ?? true;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-sm space-y-2">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          {adminMessages.header.settingsTitle}
        </h1>
        <p className="text-sm text-gray-600">{adminMessages.header.settingsSubtitle}</p>
      </div>

      {/* Read-only System Status Panel */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
          🔍 Trạng thái Tính năng Quản trị & Bảo mật
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Audit Logging Status Card */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-900">Ghi Nhật ký Vết (Audit Logging)</p>
              <p className="text-xs text-gray-500 mt-0.5">Tự động ghi vết mọi thao tác nhạy cảm vào activity_logs</p>
            </div>
            <span
              className={`px-3 py-1 text-xs font-bold rounded-full border ${
                auditEnabled
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-red-100 text-red-800 border-red-300'
              }`}
            >
              {auditEnabled ? '✓ ACTIVE' : '✕ INACTIVE'}
            </span>
          </div>

          {/* Double-Blind Protection Card */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-900">Bảo mật Chấm chéo (Double-Blind)</p>
              <p className="text-xs text-gray-500 mt-0.5">Tự động ẩn danh tính PII giữa Sinh viên và Người chấm</p>
            </div>
            <span className="px-3 py-1 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
              ✓ ENFORCED
            </span>
          </div>

          {/* Client Telemetry Card */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-900">Báo lỗi Client (Telemetry & Error Log)</p>
              <p className="text-xs text-gray-500 mt-0.5">Thu thập lỗi runtime và báo cáo sự cố mạng (/api/client-errors)</p>
            </div>
            <span className="px-3 py-1 text-xs font-bold bg-blue-100 text-blue-800 rounded-full border border-blue-300">
              ✓ ENABLED
            </span>
          </div>

          {/* Rate Limiting Card */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-900">Giới hạn tần suất AI Mentor (Rate Limiting)</p>
              <p className="text-xs text-gray-500 mt-0.5">Tối đa 30 requests/phút per sinh viên</p>
            </div>
            <span className="px-3 py-1 text-xs font-bold bg-purple-100 text-purple-800 rounded-full border border-purple-300">
              ✓ 30 REQ/MIN
            </span>
          </div>
        </div>

        <div className="text-xs text-gray-500 italic pt-2">
          📌 *Lưu ý: Các cấu hình hệ thống hiện đang ở chế độ hiển thị trạng thái (Read-only status checks). Chức năng chỉnh sửa thông số sẽ tự động kích hoạt khi Backend triển khai Task B4 (`PATCH /api/admin/system-config`).*
        </div>
      </div>
    </div>
  );
};
