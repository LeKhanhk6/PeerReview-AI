import React, { useState } from 'react';
import { useClasses } from '../hooks/useClasses';
import { Button } from '@/components/ui/Button';
import { JoinClassDialog } from '../components/JoinClassDialog';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/ui/EmptyState';

export const StudentClassesPage: React.FC = () => {
  const { data: classes, isLoading } = useClasses();
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">My Joined Classes</h1>
        <Button onClick={() => setIsJoinOpen(true)}>Join Class</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes?.map((cls) => (
          <div key={cls.id} className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  <Link to={`/student/classes/${cls.id}`} className="hover:text-blue-600">
                    {cls.course_code} - {cls.name}
                  </Link>
                </h3>
                <p className="text-sm text-gray-500">{cls.course_name}</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {cls.semester || 'No Semester'}
              </span>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <Link to={`/student/classes/${cls.id}`}>
                <Button variant="outline" size="sm">
                  Go to Workspace
                </Button>
              </Link>
            </div>
          </div>
        ))}
        {classes?.length === 0 && (
          <div className="col-span-full">
            <EmptyState
              type="no_data"
              title="No classes joined"
              description="You haven't joined any classes yet. Click 'Join Class' and enter your invite code."
              actionLabel="Join Class"
              onAction={() => setIsJoinOpen(true)}
            />
          </div>
        )}
      </div>

      <JoinClassDialog open={isJoinOpen} onClose={() => setIsJoinOpen(false)} />
    </div>
  );
};
