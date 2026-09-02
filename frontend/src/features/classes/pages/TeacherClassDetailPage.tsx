import React from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useClass, useClassMembers } from '../hooks/useClasses';
import { EmptyState } from '@/components/ui/EmptyState';
import { GroupList } from '@/features/groups/components/GroupList';
import { Users, UserCheck, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SkeletonRow } from '@/components/ui/Skeleton';

export const TeacherClassDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'groups' ? 'groups' : 'members';

  const { data: classData, isLoading: isClassLoading } = useClass(id as string);
  const { data: members, isLoading: isMembersLoading } = useClassMembers(id as string);

  if (isClassLoading || isMembersLoading) {
    return (
      <div className="h-full flex flex-col min-h-0 bg-slate-50 p-6 space-y-4">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    );
  }
  
  if (!classData) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <EmptyState type="error" title="Lỗi" description="Không tìm thấy lớp học" />
      </div>
    );
  }

  const handleTabChange = (tab: 'members' | 'groups') => {
    setSearchParams({ tab });
  };

  return (
    <div className="h-full w-full min-w-0 overflow-y-auto space-y-6 max-w-7xl mx-auto pb-12 pr-1 pt-4">
      {/* Page Header */}
      <div className="bg-white p-6 border border-slate-100 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link to="/teacher/classes" className="text-sm text-slate-500 hover:text-brand-primary transition-colors flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Quay lại danh sách lớp
            </Link>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight mt-2">
            {classData.course_code} - {classData.name}
          </h1>
          <p className="text-sm md:text-base text-slate-600 mt-1">{classData.course_name}</p>
        </div>
        <div className="text-left sm:text-right flex flex-col gap-2">
          <div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-brand-soft-bg text-brand-primary border border-brand-primary/20">
              Học kỳ: {classData.semester || 'N/A'}
            </span>
          </div>
          <div className="text-xs text-slate-500 flex items-center sm:justify-end gap-1.5">
            Mã mời: <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded select-all border border-slate-200">{classData.invite_code}</span>
          </div>
        </div>
      </div>

      {/* URL-Synced Tab Navigation */}
      <div className="border-b border-slate-200 px-2">
        <nav className="-mb-px flex space-x-8" aria-label="Class Tabs">
          <button
            onClick={() => handleTabChange('members')}
            className={cn(
              "py-4 px-2 inline-flex items-center gap-2 border-b-2 font-bold text-sm transition-colors",
              activeTab === 'members'
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            )}
            aria-current={activeTab === 'members' ? 'page' : undefined}
          >
            <UserCheck className="w-4 h-4" />
            Sinh viên ({members?.length || 0})
          </button>
          <button
            onClick={() => handleTabChange('groups')}
            className={cn(
              "py-4 px-2 inline-flex items-center gap-2 border-b-2 font-bold text-sm transition-colors",
              activeTab === 'groups'
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            )}
            aria-current={activeTab === 'groups' ? 'page' : undefined}
          >
            <Users className="w-4 h-4" />
            Nhóm học tập
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'members' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900">Danh sách sinh viên</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Họ và Tên
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    MSSV
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Ngày tham gia
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {members?.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-slate-900">{member.full_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-slate-500">{member.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-500 font-bold">{member.student_id || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(member.joined_at).toLocaleDateString('vi-VN')}
                    </td>
                  </tr>
                ))}
                {members?.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-0">
                      <EmptyState
                        type="no_data"
                        title="Chưa có sinh viên nào"
                        description={`Hãy chia sẻ mã mời ${classData.invite_code} để sinh viên tham gia lớp học.`}
                        compact
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <GroupList classId={id as string} />
      )}
    </div>
  );
};
