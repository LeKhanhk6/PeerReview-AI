import React, { useState } from 'react';
import { useClasses } from '../hooks/useClasses';
import { Button } from '@/components/ui/Button';
import { JoinClassDialog } from '../components/JoinClassDialog';
import { JoinGroupModal } from '@/features/groups/components/JoinGroupModal';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';

export const StudentClassesPage: React.FC = () => {
  const { data: classesData, isLoading, page, setPage } = useClasses();
  const navigate = useNavigate();
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [selectedGroupClass, setSelectedGroupClass] = useState<{ id: string; name: string } | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    );
  }

  const classes = classesData?.data || (Array.isArray(classesData) ? classesData : []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 border border-gray-200 rounded-xl shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📚 Danh sách Lớp học đã tham gia</h1>
          <p className="text-xs text-gray-500 mt-1">Quản lý danh sách các lớp học và nhóm học tập của bạn</p>
        </div>
        <Button onClick={() => setIsJoinOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs">
          🔑 Tham gia Lớp mới (Mã Invite)
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((cls: any) => {
          const hasGroup = Boolean((cls.group_name || cls.group_id) && cls.group_id !== 'null' && cls.group_id !== 'undefined');

          return (
            <div key={cls.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between hover:border-blue-300 transition-colors">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      {cls.course_code} - {cls.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">{cls.course_name}</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    {cls.semester || 'Học kỳ chính'}
                  </span>
                </div>

                {/* Group Status Badge */}
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-medium">Trạng thái nhóm:</span>
                  {hasGroup ? (
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      🟢 {cls.group_name || 'Đã vào nhóm'}
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                      🟡 Chưa có nhóm
                    </span>
                  )}
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                {hasGroup ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/student/groups/${cls.group_id}/workspace`)}
                    className="text-xs text-emerald-800 border-emerald-300 hover:bg-emerald-50 font-semibold"
                  >
                    🚀 Không gian Nhóm
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedGroupClass({ id: cls.id, name: cls.name })}
                    className="text-xs text-amber-800 border-amber-300 hover:bg-amber-50 font-semibold"
                  >
                    🚀 Tham gia Nhóm
                  </Button>
                )}

                <Button
                  size="sm"
                  onClick={() => navigate('/student/dashboard')}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                >
                  📥 Xem Bài Tập →
                </Button>
              </div>
            </div>
          );
        })}

        {classes.length === 0 && (
          <div className="col-span-full">
            <EmptyState
              type="no_data"
              title="Chưa tham gia lớp học nào"
              description="Bạn chưa đăng ký vào lớp học nào. Bấm 'Tham gia Lớp mới' và nhập mã mời từ Giảng viên."
              actionLabel="Tham gia Lớp học"
              onAction={() => setIsJoinOpen(true)}
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

      <JoinClassDialog open={isJoinOpen} onClose={() => setIsJoinOpen(false)} />
      
      <JoinGroupModal
        open={Boolean(selectedGroupClass)}
        onClose={() => setSelectedGroupClass(null)}
        classId={selectedGroupClass?.id}
        className={selectedGroupClass?.name}
      />
    </div>
  );
};
