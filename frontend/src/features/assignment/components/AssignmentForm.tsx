import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { assignmentMessages } from '@/constants/messages/assignment';
import { DeadlinePicker } from './DeadlinePicker';
import { AttachmentManager } from './AttachmentManager';
import { RubricBuilder } from './RubricBuilder';
import { AlertTriangle } from 'lucide-react';

import { useClassesList } from '../hooks/useAssignments';
import type {
  Assignment,
  AssignmentAttachment,
  RubricCriteria,
} from '../types/assignment.types';

interface AssignmentFormProps {
  initialValues?: Partial<Assignment>;
  onSubmit: (formData: {
    assignment: {
      class_id: string;
      title: string;
      description?: string | null;
      requirements?: string | null;
      deadline: string;
    };
    rubric?: {
      description?: string | null;
      criteria: RubricCriteria[];
    } | null;
    attachments?: AssignmentAttachment[];
  }) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  isEditMode?: boolean;
}

export const AssignmentForm: React.FC<AssignmentFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  isEditMode = false,
}) => {
  const { data: classes = [], isLoading: isLoadingClasses } = useClassesList();

  const [classId, setClassId] = useState(initialValues?.class_id || '');
  const [title, setTitle] = useState(initialValues?.title || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [requirements, setRequirements] = useState(initialValues?.requirements || '');
  const [deadline, setDeadline] = useState(initialValues?.deadline || '');

  const [attachments, setAttachments] = useState<AssignmentAttachment[]>(
    initialValues?.attachments || []
  );

  // Rubric state
  const [includeRubric, setIncludeRubric] = useState<boolean>(
    Boolean(initialValues?.has_rubric || initialValues?.rubric?.criteria?.length)
  );
  const [rubricDescription, setRubricDescription] = useState<string>(
    initialValues?.rubric?.description || ''
  );
  const [criteria, setCriteria] = useState<RubricCriteria[]>(
    initialValues?.rubric?.criteria?.map((c) => ({
      ...c,
      weight: Number(c.weight) || 0,
    })) || [
      { name: 'Nội dung & Tính đúng đắn', description: 'Đạt đầy đủ yêu cầu bài tập', weight: 50 },
      { name: 'Hình thức & Mã nguồn', description: 'Trình bày sạch đẹp, đúng chuẩn', weight: 50 },
    ]
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!classId) {
      newErrors.class_id = assignmentMessages.validation.classRequired;
    }
    if (!title.trim()) {
      newErrors.title = assignmentMessages.validation.titleRequired;
    }
    if (!deadline) {
      newErrors.deadline = assignmentMessages.validation.deadlineRequired;
    } else {
      const d = new Date(deadline);
      if (isNaN(d.getTime()) || d <= new Date()) {
        newErrors.deadline = assignmentMessages.validation.deadlineFuture;
      }
    }

    if (includeRubric) {
      if (criteria.length === 0) {
        newErrors.rubric = assignmentMessages.validation.atLeastOneCriteria;
      } else {
        const total = criteria.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);
        if (Math.abs(total - 100) >= 0.01) {
          newErrors.rubric = assignmentMessages.validation.rubricTotalWeightMismatch;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validateForm()) return;

    try {
      await onSubmit({
        assignment: {
          class_id: classId,
          title: title.trim(),
          description: description.trim() || null,
          requirements: requirements.trim() || null,
          deadline,
        },
        rubric: includeRubric
          ? {
              description: rubricDescription.trim() || null,
              criteria,
            }
          : null,
        attachments,
      });
    } catch (err: any) {
      setServerError(err.message || 'Đã có lỗi xảy ra khi lưu bài tập.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {serverError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 font-medium flex items-center gap-1.5" role="alert">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {serverError}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-2">
          Thông Tin Bài Tập
        </h3>

        {/* Class Selection Dropdown */}
        <div>
          <label htmlFor="select-class" className="block text-sm font-medium text-gray-700 mb-1">
            {assignmentMessages.form.selectClass} <span className="text-red-500">*</span>
          </label>
          {isLoadingClasses ? (
            <div className="text-sm text-gray-500 py-2" aria-busy="true">
              Đang tải danh sách lớp học...
            </div>
          ) : (
            <select
              id="select-class"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              disabled={isEditMode || isSubmitting}
              aria-describedby={errors.class_id ? "err-class-id" : undefined}
              className={`w-full px-3 py-2 border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.class_id ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
            >
              <option value="">{assignmentMessages.form.selectClassPlaceholder}</option>
              {classes.map((cls: any) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.course_code} - {cls.course_name})
                </option>
              ))}
            </select>
          )}
          {errors.class_id && <p id="err-class-id" role="alert" className="text-xs text-red-600 mt-1">{errors.class_id}</p>}
        </div>

        {/* Assignment Title */}
        <div>
          <label htmlFor="assignment-title" className="block text-sm font-medium text-gray-700 mb-1">
            {assignmentMessages.form.titleLabel} <span className="text-red-500">*</span>
          </label>
          <input
            id="assignment-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={assignmentMessages.form.titlePlaceholder}
            disabled={isSubmitting}
            aria-describedby={errors.title ? "err-title" : undefined}
            className={`w-full px-3 py-2 border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.title ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
          />
          {errors.title && <p id="err-title" role="alert" className="text-xs text-red-600 mt-1">{errors.title}</p>}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="assignment-description" className="block text-sm font-medium text-gray-700 mb-1">
            {assignmentMessages.form.descriptionLabel}
          </label>
          <textarea
            id="assignment-description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={assignmentMessages.form.descriptionPlaceholder}
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Requirements */}
        <div>
          <label htmlFor="assignment-requirements" className="block text-sm font-medium text-gray-700 mb-1">
            {assignmentMessages.form.requirementsLabel}
          </label>
          <textarea
            id="assignment-requirements"
            rows={4}
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            placeholder={assignmentMessages.form.requirementsPlaceholder}
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
          />
        </div>

        {/* Deadline Picker */}
        <DeadlinePicker
          value={deadline}
          onChange={(newDeadline) => setDeadline(newDeadline)}
          error={errors.deadline}
          disabled={isSubmitting}
        />

        {/* Attachment Manager */}
        <AttachmentManager
          attachments={attachments}
          onChange={(updated) => setAttachments(updated)}
          disabled={isSubmitting}
        />
      </div>

      {/* Rubric Section Toggle & Warning Banner */}
      <div className="space-y-3">
        {!includeRubric ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {assignmentMessages.rubric.missingRubricWarningTitle}
              </h4>
              <p className="text-xs text-amber-800 mt-1">
                {assignmentMessages.rubric.missingRubricWarningDescription}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIncludeRubric(true)}
              className="bg-white border-amber-300 text-amber-900 hover:bg-amber-100 whitespace-nowrap"
            >
              + {assignmentMessages.form.setupRubricBtn}
            </Button>
          </div>
        ) : (
          <RubricBuilder
            criteria={criteria}
            description={rubricDescription}
            onCriteriaChange={(updated) => setCriteria(updated)}
            onDescriptionChange={(desc) => setRubricDescription(desc)}
            serverError={errors.rubric}
            disabled={isSubmitting}
          />
        )}
      </div>

      {/* Form Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          {assignmentMessages.form.cancelBtn}
        </Button>
        <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
          {isEditMode ? assignmentMessages.form.submitUpdate : assignmentMessages.form.submitCreate}
        </Button>
      </div>
    </form>
  );
};
