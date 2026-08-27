import React from 'react';
import { assignmentMessages } from '@/constants/messages/assignment';
import { AssignmentList } from '../components/AssignmentList';

export const TeacherAssignmentsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          {assignmentMessages.title}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {assignmentMessages.subtitle}
        </p>
      </div>

      <AssignmentList />
    </div>
  );
};
