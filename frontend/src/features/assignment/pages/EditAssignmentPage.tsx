import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assignmentMessages } from '@/constants/messages/assignment';
import { AssignmentForm } from '../components/AssignmentForm';
import {
  useAssignmentDetail,
  useAssignmentRubric,
  useUpdateAssignment,
  useSaveRubric,
} from '../hooks/useAssignments';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'sonner';

export const EditAssignmentPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: assignment, isLoading: isLoadingAssignment, isError } = useAssignmentDetail(id);
  const { data: rubric, isLoading: isLoadingRubric } = useAssignmentRubric(id);

  const updateAssignment = useUpdateAssignment();
  const saveRubric = useSaveRubric(id);

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoadingAssignment || isLoadingRubric) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (isError || !assignment) {
    return (
      <div className="max-w-4xl mx-auto">
        <EmptyState
          type="error"
          title="Không tìm thấy bài tập"
          description="Bài tập bạn cần chỉnh sửa không tồn tại hoặc đã bị xóa."
          actionLabel="Quay lại danh sách"
          onAction={() => navigate('/teacher/assignments')}
          showBack
        />
      </div>
    );
  }

  const initialValues = {
    ...assignment,
    rubric: rubric || assignment.rubric || null,
    has_rubric: Boolean(rubric || assignment.has_rubric),
  };

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);
    try {
      // 1. Update Assignment Details
      await updateAssignment.mutateAsync({ id, data: formData.assignment });

      // 2. Save / Upsert Rubric if provided
      if (formData.rubric) {
        await saveRubric.mutateAsync(formData.rubric);
      }

      toast.success(assignmentMessages.updateSuccess);
      navigate('/teacher/assignments');
    } catch (err: any) {
      toast.error(err.message || 'Không thể cập nhật bài tập.');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          {assignmentMessages.editTitle}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Cập nhật thông tin bài tập, yêu cầu và điều chỉnh các tiêu chí chấm điểm (Rubric).
        </p>
      </div>

      <AssignmentForm
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/teacher/assignments')}
        isSubmitting={isSubmitting}
        isEditMode
      />
    </div>
  );
};
