import React from 'react';
import { assignmentMessages } from '@/constants/messages/assignment';
import { AssignmentList } from '../components/AssignmentList';

export const TeacherAssignmentsPage: React.FC = () => {
  return (
    <div className="h-full w-full min-w-0 overflow-y-auto space-y-6 max-w-7xl mx-auto pb-12 pr-1 pt-4">
      {/* Page Header */}
      <div className="bg-white p-6 border border-slate-100 rounded-2xl shadow-sm space-y-1.5 shrink-0">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
          {assignmentMessages.title}
        </h1>
        <p className="text-xs md:text-sm text-slate-500">
          {assignmentMessages.subtitle}
        </p>
      </div>

      <AssignmentList />
    </div>
  );
};
