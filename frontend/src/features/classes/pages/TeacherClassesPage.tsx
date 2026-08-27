import React, { useState } from 'react';
import { useClasses, useDeleteClass } from '../hooks/useClasses';
import { Button } from '@/components/ui/Button';
import { CreateClassDialog } from '../components/CreateClassDialog';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';

export const TeacherClassesPage: React.FC = () => {
  const { data: classesData, isLoading, page, setPage } = useClasses();
  const deleteClass = useDeleteClass();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      try {
        await deleteClass.mutateAsync(id);
        toast.success('Class deleted successfully');
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete class');
      }
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">My Classes</h1>
        <Button onClick={() => setIsCreateOpen(true)}>Create Class</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classesData?.data?.map((cls: any) => (
          <div key={cls.id} className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  <Link to={`/teacher/classes/${cls.id}`} className="hover:text-blue-600">
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
              <div className="text-sm text-gray-500">
                Invite Code: <span className="font-mono font-bold text-gray-900">{cls.invite_code}</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleDelete(cls.id)}>
                Delete
              </Button>
            </div>
          </div>
        ))}
        {classesData?.data?.length === 0 && (
          <div className="col-span-full">
            <EmptyState
              type="no_data"
              title="No classes found"
              description="You haven't created any classes yet. Create one to get started."
              actionLabel="Create Class"
              onAction={() => setIsCreateOpen(true)}
            />
          </div>
        )}
      </div>

      {classesData && classesData.totalPages > 1 && (
        <div className="mt-8">
          <Pagination
            page={page}
            totalPages={classesData.totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      <CreateClassDialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
};
