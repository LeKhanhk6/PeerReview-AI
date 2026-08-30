import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { assignmentMessages } from '@/constants/messages/assignment';
import { useAssignmentsList, useClassesList, useDeleteAssignment } from '../hooks/useAssignments';
import { toast } from 'sonner';
import type { Assignment } from '../types/assignment.types';

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
        <div className="flex-1 min-w-[240px] max-w-xs">
          <label htmlFor="filter-class" className="block text-xs font-medium text-gray-700 mb-1">
            Lọc theo lớp học
          </label>
          <select
            id="filter-class"
            value={selectedClassId}
            onChange={(e) => handleClassFilterChange(e.target.value)}
            disabled={isLoadingClasses}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
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
                className="bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-gray-900 hover:text-blue-600 transition-colors">
                      {assignment.title}
                    </h3>

                    {/* Rubric Status Badge */}
                    {hasRubric ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                        ✓ {assignmentMessages.rubric.weightValid}
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                        ⚠️ {assignmentMessages.rubric.missingRubricWarningTitle}
                      </span>
                    )}

                    {isExpired && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                        Đã hết hạn
                      </span>
                    )}
                  </div>

                  {assignment.class_name && (
                    <p className="text-xs font-medium text-blue-700">
                      🏫 Lớp: {assignment.class_name}
                    </p>
                  )}

                  {assignment.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{assignment.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1">
                    <span>
                      📅 Hạn nộp: <strong className="text-gray-700">{deadlineDate.toLocaleString()}</strong>
                    </span>
                    <span>
                      🕒 Ngày tạo: {new Date(assignment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
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
                    className="border-blue-200 text-blue-700 hover:bg-blue-50 font-medium"
                  >
                    🤖 AI Synthesis
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
