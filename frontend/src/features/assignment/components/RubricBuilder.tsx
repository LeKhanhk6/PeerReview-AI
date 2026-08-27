import React from 'react';
import { Button } from '@/components/ui/Button';
import { assignmentMessages } from '@/constants/messages/assignment';
import type { RubricCriteria } from '../types/assignment.types';

interface RubricBuilderProps {
  criteria: RubricCriteria[];
  description?: string | null;
  onCriteriaChange: (updatedCriteria: RubricCriteria[]) => void;
  onDescriptionChange?: (desc: string) => void;
  serverError?: string;
  disabled?: boolean;
}

export const RubricBuilder: React.FC<RubricBuilderProps> = ({
  criteria,
  description = '',
  onCriteriaChange,
  onDescriptionChange,
  serverError,
  disabled = false,
}) => {
  // Calculate total weight with floating point safety
  const totalWeight = criteria.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
  const isValidWeight = Math.abs(totalWeight - 100) < 0.01;

  const handleAddCriteria = () => {
    const newCriteria: RubricCriteria = {
      name: '',
      description: '',
      weight: criteria.length === 0 ? 100 : 0,
    };
    onCriteriaChange([...criteria, newCriteria]);
  };

  const handleFieldChange = (index: number, field: keyof RubricCriteria, value: any) => {
    const updated = criteria.map((item, i) => {
      if (i === index) {
        return {
          ...item,
          [field]: field === 'weight' ? (value === '' ? 0 : Number(value)) : value,
        };
      }
      return item;
    });
    onCriteriaChange(updated);
  };

  const handleRemove = (index: number) => {
    const updated = criteria.filter((_, i) => i !== index);
    onCriteriaChange(updated);
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const updated = [...criteria];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    onCriteriaChange(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index >= criteria.length - 1) return;
    const updated = [...criteria];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    onCriteriaChange(updated);
  };

  return (
    <div className="space-y-4 border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            {assignmentMessages.form.rubricSectionTitle}
          </h3>
          <p className="text-xs text-gray-500">
            Định nghĩa các tiêu chí chấm chéo và gán % trọng số (tổng các tiêu chí bắt buộc = 100%).
          </p>
        </div>

        {/* Total Weight Status Badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-700">{assignmentMessages.rubric.totalWeight}</span>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
              isValidWeight
                ? 'bg-green-100 text-green-800 border border-green-300'
                : 'bg-red-100 text-red-800 border border-red-300'
            }`}
            role="status"
          >
            <span aria-live="polite">
              {isValidWeight
                ? assignmentMessages.rubric.weightValid
                : assignmentMessages.rubric.weightInvalid.replace('{total}', totalWeight.toFixed(2))}
            </span>
          </span>
        </div>
      </div>

      {serverError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 font-medium" role="alert">
          ⚠ {serverError}
        </div>
      )}

      {/* Optional Rubric Description */}
      {onDescriptionChange && (
        <div>
          <label htmlFor="rubric-main-desc" className="block text-xs font-medium text-gray-700 mb-1">
            {assignmentMessages.form.rubricDescriptionLabel}
          </label>
          <input
            id="rubric-main-desc"
            type="text"
            value={description || ''}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder={assignmentMessages.form.rubricDescriptionPlaceholder}
            className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm bg-white"
            disabled={disabled}
          />
        </div>
      )}

      {/* Criteria Items List */}
      {criteria.length === 0 ? (
        <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-md bg-gray-50">
          <p className="text-sm text-gray-500 mb-3">{assignmentMessages.rubric.emptyCriteria}</p>
          <Button type="button" variant="outline" size="sm" onClick={handleAddCriteria} disabled={disabled}>
            + {assignmentMessages.rubric.addCriteriaBtn}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {criteria.map((item, index) => (
            <div
              key={index}
              className="p-3 border border-gray-200 rounded-md bg-gray-50/50 hover:bg-gray-50 transition-colors space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Tiêu chí #{index + 1}
                </span>

                <div className="flex items-center gap-1">
                  {/* Reorder Up Button */}
                  <button
                    type="button"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0 || disabled}
                    className="p-1 text-gray-500 hover:text-gray-900 disabled:opacity-30 rounded hover:bg-gray-200 text-xs"
                    title={assignmentMessages.rubric.moveUp}
                    aria-label={`${assignmentMessages.rubric.moveUp} ${item.name || index + 1}`}
                  >
                    ⬆️
                  </button>

                  {/* Reorder Down Button */}
                  <button
                    type="button"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === criteria.length - 1 || disabled}
                    className="p-1 text-gray-500 hover:text-gray-900 disabled:opacity-30 rounded hover:bg-gray-200 text-xs"
                    title={assignmentMessages.rubric.moveDown}
                    aria-label={`${assignmentMessages.rubric.moveDown} ${item.name || index + 1}`}
                  >
                    ⬇️
                  </button>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    disabled={disabled}
                    className="p-1 text-red-600 hover:text-red-800 disabled:opacity-30 rounded hover:bg-red-50 text-xs ml-1"
                    title={assignmentMessages.rubric.removeCriteria}
                    aria-label={`${assignmentMessages.rubric.removeCriteria} ${item.name || index + 1}`}
                  >
                    🗑 Xóa
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-8">
                  <label htmlFor={`crit-name-${index}`} className="block text-xs font-medium text-gray-700 mb-1">
                    {assignmentMessages.rubric.criteriaNameLabel} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id={`crit-name-${index}`}
                    type="text"
                    required
                    value={item.name}
                    onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
                    placeholder={assignmentMessages.rubric.criteriaNamePlaceholder}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm bg-white"
                    disabled={disabled}
                  />
                </div>

                <div className="sm:col-span-4">
                  <label htmlFor={`crit-weight-${index}`} className="block text-xs font-medium text-gray-700 mb-1">
                    {assignmentMessages.rubric.criteriaWeightLabel} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id={`crit-weight-${index}`}
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    value={item.weight || ''}
                    onChange={(e) => handleFieldChange(index, 'weight', e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm bg-white font-mono"
                    disabled={disabled}
                  />
                </div>
              </div>

              <div>
                <label htmlFor={`crit-desc-${index}`} className="block text-xs font-medium text-gray-600 mb-1">
                  {assignmentMessages.rubric.criteriaDescLabel}
                </label>
                <input
                  id={`crit-desc-${index}`}
                  type="text"
                  value={item.description || ''}
                  onChange={(e) => handleFieldChange(index, 'description', e.target.value)}
                  placeholder={assignmentMessages.rubric.criteriaDescPlaceholder}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs bg-white text-gray-700"
                  disabled={disabled}
                />
              </div>
            </div>
          ))}

          <div className="pt-2 flex justify-start">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddCriteria}
              disabled={disabled}
            >
              + {assignmentMessages.rubric.addCriteriaBtn}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
