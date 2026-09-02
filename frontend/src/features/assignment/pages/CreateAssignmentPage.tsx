import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { assignmentMessages } from '@/constants/messages/assignment';
import { AssignmentForm } from '../components/AssignmentForm';
import { useCreateAssignment, assignmentKeys } from '../hooks/useAssignments';
import { assignmentApi } from '../api/assignment.api';
import { toast } from 'sonner';

export const CreateAssignmentPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createAssignment = useCreateAssignment();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);
    try {
      // 1. Create Assignment
      const newAssignment = await createAssignment.mutateAsync(formData.assignment);

      // 2. Save Rubric if included
      if (formData.rubric) {
        await assignmentApi.saveRubric({
          assignmentId: newAssignment.id,
          data: formData.rubric,
        });
        // Ensure cache is invalidated after saving rubric
        await queryClient.invalidateQueries({ queryKey: assignmentKeys.all });
      }

      toast.success(assignmentMessages.createSuccess);
      navigate('/teacher/assignments');
    } catch (err: any) {
      toast.error(err.message || 'Không thể tạo bài tập.');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 pr-1 pt-4">
      {/* Page Header */}
      <div className="bg-white p-6 border border-slate-100 rounded-2xl shadow-sm space-y-1.5 shrink-0">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
          {assignmentMessages.createTitle}
        </h1>
        <p className="text-xs md:text-sm text-slate-500">
          Điền các thông tin bài tập, yêu cầu và thiết lập khung tiêu chí chấm điểm (Rubric).
        </p>
      </div>

      <AssignmentForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/teacher/assignments')}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
