import React from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTeacherSubmissionsMonitor } from '../hooks/useSubmission';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { calculateDaysLeftStatus } from '@/utils/date.utils';
import { toast } from 'sonner';

export const TeacherSubmissionsMonitorPage: React.FC = () => {
  const { assignmentId = '' } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentStatusFilter = searchParams.get('status') || 'ALL';

  const { data: monitorData, isLoading, isError, refetch } = useTeacherSubmissionsMonitor(
    assignmentId,
    currentStatusFilter
  );

  const handleStatusFilterChange = (newStatus: string) => {
    const params = new URLSearchParams(searchParams);
    if (newStatus && newStatus !== 'ALL') {
      params.set('status', newStatus);
    } else {
      params.delete('status');
    }
    setSearchParams(params);
  };

  // Client-side CSV export
  const handleExportCSV = () => {
    if (!monitorData || !monitorData.groups.length) return;

    const headers = ['Mã Nhóm', 'Tên Nhóm', 'Trạng Thái', 'Phòng Trễ', 'Phiên Bản Mới Nhất', 'Tổng Số Phiên Bản', 'Thời Gian Nộp Lần Đầu', 'Link File Nộp'];
    const rows = monitorData.groups.map((g) => [
      g.groupId,
      `"${g.groupName.replace(/"/g, '""')}"`,
      g.status === 'SUBMITTED' ? 'Đã nộp đúng hạn' : g.status === 'LATE' ? 'Nộp trễ hạn' : 'Chưa nộp',
      g.isLate ? 'Có' : 'Không',
      g.submission ? `v${g.submission.latestVersionNumber}` : 'Chưa nộp',
      g.submission ? g.submission.totalVersions : 0,
      g.submission?.initialSubmittedAt ? new Date(g.submission.initialSubmittedAt).toLocaleString('vi-VN') : '—',
      g.submission?.latestFileUrl || '—',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `danh_sach_nop_bai_${assignmentId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="h-full w-full min-w-0 overflow-y-auto space-y-6 max-w-7xl mx-auto pb-12 pr-1 pt-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (isError || !monitorData) {
    return (
      <div className="h-full w-full min-w-0 flex items-center justify-center">
        <EmptyState
          type="error"
          title="Không thể tải dữ liệu theo dõi bài nộp"
          description="Đã xảy ra lỗi khi lấy danh sách bài nộp của nhóm. Vui lòng thử lại."
          actionLabel="Thử lại"
          onAction={() => refetch()}
        />
      </div>
    );
  }

  const { assignment, stats, groups } = monitorData;
  const deadlineDaysStatus = calculateDaysLeftStatus(assignment.deadline);

  return (
    <div className="h-full w-full min-w-0 overflow-y-auto space-y-6 max-w-7xl mx-auto pb-12 pr-1 pt-4">
      {/* Top Header & Actions */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate('/teacher/assignments')}
            className="text-xs text-slate-500 hover:text-slate-900 mb-1 -ml-2"
          >
            ← Quay lại danh sách bài tập
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {assignment.title}
            </h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${deadlineDaysStatus.badgeClasses}`}>
              {deadlineDaysStatus.label}
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Lớp học: <strong className="text-slate-800">{assignment.className}</strong> | Hạn nộp chính thức: {new Date(assignment.deadline).toLocaleString('vi-VN')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={!groups.length}
            className="gap-2"
          >
            📥 Xuất CSV danh sách
          </Button>

          <Link to={`/teacher/assignments/${assignment.id}/synthesis`}>
            <Button variant="default" size="sm">
              🔗 Phân công chấm chéo & AI Synthesis →
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
          <div className="text-xs font-medium text-slate-500">Tổng số nhóm trong lớp</div>
          <div className="text-3xl font-extrabold text-slate-900">{stats.totalGroups}</div>
          <div className="text-xs text-slate-500 pt-2 border-t border-slate-100">
            Tổng số nhóm cần nộp bài
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
          <div className="text-xs font-medium text-slate-500">Đã nộp (Đúng hạn)</div>
          <div className="text-3xl font-extrabold text-emerald-600">{stats.submittedCount}</div>
          <div className="text-xs text-slate-500 pt-2 border-t border-slate-100">
            Nhóm đã hoàn thành trước deadline
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
          <div className="text-xs font-medium text-slate-500">Nộp trễ hạn (Late)</div>
          <div className="text-3xl font-extrabold text-rose-600">{stats.lateCount}</div>
          <div className="text-xs text-slate-500 pt-2 border-t border-slate-100">
            Nhóm nộp sau thời gian deadline
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
          <div className="text-xs font-medium text-slate-500">Chưa nộp bài</div>
          <div className="text-3xl font-extrabold text-slate-600">{stats.notStartedCount}</div>
          <div className="text-xs text-slate-500 pt-2 border-t border-slate-100">
            Nhóm chưa tải bài nộp lên hệ thống
          </div>
        </div>
      </div>

      {/* Main Content & Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            {[
              { id: 'ALL', label: `Tất cả (${stats.totalGroups})` },
              { id: 'SUBMITTED', label: `Đã nộp đúng hạn (${stats.submittedCount})` },
              { id: 'LATE', label: `Nộp trễ hạn (${stats.lateCount})` },
              { id: 'NOT_STARTED', label: `Chưa nộp (${stats.notStartedCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleStatusFilterChange(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  currentStatusFilter === tab.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-500">
            Hiển thị <strong>{groups.length}</strong> nhóm
          </div>
        </div>

        {/* Table Content */}
        {groups.length === 0 ? (
          <EmptyState
            type="no_data"
            title="Không có nhóm nào phù hợp"
            description="Không tìm thấy nhóm nào khớp với bộ lọc trạng thái bài nộp hiện tại."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Tên nhóm</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4">Phiên bản bài nộp</th>
                  <th className="py-3 px-4">Thời gian nộp lần đầu</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {groups.map((group) => {
                  const hasSubmission = Boolean(group.submission);
                  const isSubmittedLate = group.isLate || group.status === 'LATE';

                  return (
                    <tr key={group.groupId} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {group.groupName}
                      </td>

                      <td className="py-3.5 px-4">
                        {group.status === 'SUBMITTED' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ✓ Đã nộp đúng hạn
                          </span>
                        ) : isSubmittedLate ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            ⚠️ Nộp trễ hạn
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            ⏳ Chưa nộp
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {hasSubmission ? (
                          <span className="text-slate-800">
                            Phiên bản <strong>v{group.submission?.latestVersionNumber}</strong>
                            <span className="text-slate-400 text-[10px] ml-1">
                              (Tổng: {group.submission?.totalVersions} lần)
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {group.submission?.initialSubmittedAt ? (
                          <span className="text-slate-700">
                            {new Date(group.submission.initialSubmittedAt).toLocaleString('vi-VN')}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {group.submission?.latestFileUrl ? (
                          <a
                            href={group.submission.latestFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => {
                              if (group.submission?.latestFileUrl?.includes('storage.googleapis.com/peer-review-bucket')) {
                                e.preventDefault();
                                toast.info('Tính năng tải về file bài nộp đang ở chế độ mô phỏng.');
                              }
                            }}
                          >
                            <Button variant="outline" size="sm" className="text-xs">
                              📥 Xem file bài nộp
                            </Button>
                          </a>
                        ) : (
                          <Button variant="outline" size="sm" disabled className="text-xs">
                            Chưa có file
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
