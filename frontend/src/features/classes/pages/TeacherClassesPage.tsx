import React, { useState } from 'react';
import { useClasses, useDeleteClass } from '../hooks/useClasses';
import { Button } from '@/components/ui/Button';
import { CreateClassDialog } from '../components/CreateClassDialog';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Copy, Plus, Trash2 } from 'lucide-react';

export const TeacherClassesPage: React.FC = () => {
  const { data: classesData, isLoading, page, setPage } = useClasses();
  const deleteClass = useDeleteClass();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteClass.mutateAsync(deleteTargetId);
      toast.success('Đã xóa lớp học thành công');
      setDeleteTargetId(null);
    } catch (error: any) {
      toast.error(error.message || 'Không thể xóa lớp học');
    }
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Đã copy mã mời: ' + code);
  };

  return (
    <div className="h-full flex flex-col min-h-0 bg-slate-50">
      <div className="bg-white p-5 border-b border-slate-200 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Quản lý Lớp học</h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">Quản lý danh sách các lớp học, học kỳ và mã mời</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" /> Tạo lớp mới
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-5">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" aria-busy="true">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {classesData?.data?.map((cls: any) => (
                <div key={cls.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md hover:border-brand-primary/20 transition-all group">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-mono font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                        {cls.course_code}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1 line-clamp-1" title={cls.name}>
                        <Link to={`/teacher/classes/${cls.id}`} className="hover:text-brand-primary transition-colors">
                          {cls.name}
                        </Link>
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5" title={cls.course_name}>
                        {cls.course_name}
                      </p>
                    </div>
                    <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-soft-bg text-brand-primary border border-brand-primary/20">
                      {cls.semester || 'Chưa xếp HK'}
                    </span>
                  </div>
                  
                  <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer" onClick={() => copyInviteCode(cls.invite_code)}>
                      <span className="text-xs text-slate-500">Mã:</span>
                      <span className="text-xs font-mono font-bold text-slate-900">{cls.invite_code}</span>
                      <Copy className="w-3.5 h-3.5 text-slate-400 ml-1" />
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setDeleteTargetId(cls.id)}
                      className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 h-8 px-2.5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {classesData?.data?.length === 0 && (
                <div className="col-span-full py-8">
                  <EmptyState
                    type="no_data"
                    title="Chưa có lớp học nào"
                    description="Bạn chưa tạo lớp học nào. Hãy tạo lớp đầu tiên để bắt đầu."
                    actionLabel="Tạo Lớp Học"
                    onAction={() => setIsCreateOpen(true)}
                  />
                </div>
              )}
            </div>

            {classesData && (
              <div className="mt-6 pt-4 flex items-center justify-between border-t border-slate-200 text-xs text-slate-500">
                <span>
                  {classesData.totalPages > 1 ? (
                    <>Trang <strong>{page}</strong> / {classesData.totalPages} (Tổng số lớp: {classesData.total})</>
                  ) : (
                    <>Tổng số lớp: {classesData.total}</>
                  )}
                </span>
                {classesData.totalPages > 1 && (
                  <Pagination
                    page={page}
                    totalPages={classesData.totalPages}
                    onPageChange={setPage}
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>

      <CreateClassDialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} />

      <ConfirmDialog
        open={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDelete}
        title="Xác nhận xóa lớp học"
        description="Toàn bộ sinh viên, bài tập và điểm số trong lớp này sẽ bị xóa. Hành động này không thể hoàn tác."
        isDestructive={true}
        isLoading={deleteClass.isPending}
      />
    </div>
  );
};
