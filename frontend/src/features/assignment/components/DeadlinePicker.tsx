import React from 'react';
import { assignmentMessages } from '@/constants/messages/assignment';

interface DeadlinePickerProps {
  id?: string;
  value: string;
  onChange: (isoUtcString: string) => void;
  error?: string;
  disabled?: boolean;
}

// Convert ISO UTC string (e.g. 2026-12-31T23:59:59.000Z) to local input datetime-local format (YYYY-MM-DDTHH:mm)
const isoToLocalDatetime = (isoStr: string): string => {
  if (!isoStr) return '';
  const date = new Date(isoStr);
  if (isNaN(date.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Convert local input value to current local Date minimum (YYYY-MM-DDTHH:mm)
const getMinLocalDatetime = (): string => {
  const now = new Date();
  return isoToLocalDatetime(now.toISOString());
};

export const DeadlinePicker: React.FC<DeadlinePickerProps> = ({
  id = 'assignment-deadline',
  value,
  onChange,
  error,
  disabled = false,
}) => {
  const localValue = isoToLocalDatetime(value);
  const minLocal = getMinLocalDatetime();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) {
      onChange('');
      return;
    }
    const dateObj = new Date(val);
    if (!isNaN(dateObj.getTime())) {
      onChange(dateObj.toISOString());
    }
  };

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {assignmentMessages.form.deadlineLabel} <span className="text-red-500">*</span>
      </label>
      <input
        type="datetime-local"
        id={id}
        name="deadline"
        value={localValue}
        min={minLocal}
        onChange={handleChange}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      />
      {error && (
        <p id={`${id}-error`} className="text-xs text-red-600 mt-1" role="alert">
          {error}
        </p>
      )}
      <p className="text-xs text-gray-500">
        Thời gian được lưu trữ chuẩn ISO (UTC) và tự động hiển thị theo múi giờ địa phương của bạn.
      </p>
    </div>
  );
};
