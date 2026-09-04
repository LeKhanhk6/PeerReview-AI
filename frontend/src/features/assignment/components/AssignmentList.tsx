import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { assignmentMessages } from '@/constants/messages/assignment';
import { useAssignmentsList, useClassesList, useDeleteAssignment } from '../hooks/useAssignments';
import type { Assignment } from '../types/assignment.types';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';


export const AssignmentList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedClassId = searchParams.get('classId') || '';

  const { data: classes = [], isLoading: isLoadingClasses } = useClassesList();
  const {
    data: assignmentsData,
    isLoading: isLoadingAssignments,
    isError,
  } = useAssignmentsList({ classId: selectedClassId || undefined });

  const deleteAssignment = useDeleteAssignment();

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const assignmentsList: Assignment[] = Array.isArray(assignmentsData?.data)
    ? assignmentsData.data
    : Array.isArray(assignmentsData)
    ? (assignmentsData as any)
    : [];

  const handleClassFilterChange = (classId: string) => {
    const params = new URLSearchParams(searchParams);
    if (classId) {
      params.set('classId', classId);
    } else {
      params.delete('classId');
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await deleteAssignment.mutateAsync(deletingId);
      toast.success(assignmentMessages.deleteSuccess);
      setDeletingId(null);
    } catch (err: any) {
      toast.error(err.message || 'Không thể xóa bài tập');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 bg-white p-4 border border-slate-100 rounded-2xl shadow-sm shrink-0">
        <div className="flex-1 min-w-[240px] max-w-xs">
          <label htmlFor="filter-class" className="block text-xs font-medium text-gray-700 mb-1">
            Lọc theo lớp học
          </label>
          <select
            id="filter-class"
            value={selectedClassId}
            onChange={(e) => handleClassFilterChange(e.target.value)}
            disabled={isLoadingClasses}
            className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
          >
            <option value="">-- Tất cả lớp học --</option>
            {classes.map((cls: any) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} ({cls.course_code})
              </option>
            ))}
          </select>
        </div>

        <Button onClick={() => navigate('/teacher/assignments/create')}>
          + {assignmentMessages.createTitle}
        </Button>
      </div>

      {/* Loading Skeleton */}
      {isLoadingAssignments ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
      ) : isError ? (
        <EmptyState
          type="error"
          title="Không thể tải danh sách bài tập"
          description="Vui lòng thử lại sau hoặc kiểm tra kết nối mạng."
          actionLabel="Thử lại"
          onAction={() => window.location.reload()}
        />
      ) : assignmentsList.length === 0 ? (
        <EmptyState
          type="no_data"
          title={assignmentMessages.noAssignments}
          description="Bắt đầu tạo bài tập đầu tiên cho lớp học của bạn."
          actionLabel={assignmentMessages.createTitle}
          onAction={() => navigate('/teacher/assignments/create')}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {assignmentsList.map((assignment) => {
            const hasRubric = Boolean(assignment.has_rubric || assignment.rubric?.criteria?.length);
            const deadlineDate = new Date(assignment.deadline);
            const isExpired = deadlineDate < new Date();

            return (
              <div
                key={assignment.id}
                className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-slate-300 hover:shadow-md transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 hover:text-brand-primary transition-colors">
                      {assignment.title}
                    </h3>

                    {/* Rubric Status Badge */}
                    {hasRubric ? (
                      <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {assignmentMessages.rubric.weightValid}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                        <AlertTriangle className="w-3.5 h-3.5" /> {assignmentMessages.rubric.missingRubricWarningTitle}
                      </span>
                    )}

                    {isExpired && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                        Đã hết hạn
                      </span>
                    )}
                  </div>

                  {assignment.class_name && (
                    <p className="text-xs font-bold text-brand-primary bg-brand-soft-bg inline-flex px-2 py-0.5 rounded border border-brand-primary/20">
                      Lớp: {assignment.class_name}
                    </p>
                  )}

                  {assignment.description && (
                    <p className="text-sm text-slate-600 line-clamp-2">{assignment.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1 font-medium">
                    <span>
                      Hạn nộp: <strong className="text-slate-800">{deadlineDate.toLocaleString('vi-VN')}</strong>
                    </span>
                    <span>
                      Tạo ngày: {new Date(assignment.created_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 mt-2 md:mt-0">
                  {!hasRubric && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/teacher/assignments/${assignment.id}/edit`)}
                      className="border-amber-300 text-amber-900 hover:bg-amber-50"
                    >
                      + Rubric
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/teacher/assignments/${assignment.id}/synthesis`)}
                    className="border-brand-primary/30 text-brand-primary hover:bg-brand-soft-bg font-bold"
                  >
                    AI Synthesis
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/teacher/assignments/${assignment.id}/edit`)}
                  >
                    Chỉnh sửa
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeletingId(assignment.id)}
                  >
                    Xóa
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteConfirm}
        title="Xóa bài tập"
        description={assignmentMessages.deleteConfirm}
        isDestructive={true}
        isLoading={deleteAssignment.isPending}
      />
    </div>
  );
};
