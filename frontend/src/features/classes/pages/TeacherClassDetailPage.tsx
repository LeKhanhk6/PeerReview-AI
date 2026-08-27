import React from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useClass, useClassMembers } from '../hooks/useClasses';
import { EmptyState } from '@/components/ui/EmptyState';
import { GroupList } from '@/features/groups/components/GroupList';
import { Users, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export const TeacherClassDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'groups' ? 'groups' : 'members';

  const { data: classData, isLoading: isClassLoading } = useClass(id as string);
  const { data: members, isLoading: isMembersLoading } = useClassMembers(id as string);

  if (isClassLoading || isMembersLoading) return <div className="p-6 text-gray-500" aria-busy="true">Loading class details...</div>;
  if (!classData) return <div className="p-6 text-red-600">Class not found</div>;

  const handleTabChange = (tab: 'members' | 'groups') => {
    setSearchParams({ tab });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link to="/teacher/classes" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
              &larr; Back to Classes
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            {classData.course_code} - {classData.name}
          </h1>
          <p className="text-lg text-gray-600 mt-1">{classData.course_name}</p>
        </div>
        <div className="text-right">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            Semester: {classData.semester || 'N/A'}
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Invite Code: <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded select-all">{classData.invite_code}</span>
          </div>
        </div>
      </div>

      {/* URL-Synced Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Class Tabs">
          <button
            onClick={() => handleTabChange('members')}
            className={cn(
              "py-4 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm transition-colors",
              activeTab === 'members'
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
            aria-current={activeTab === 'members' ? 'page' : undefined}
          >
            <UserCheck className="w-4 h-4" />
            Enrolled Students ({members?.length || 0})
          </button>
          <button
            onClick={() => handleTabChange('groups')}
            className={cn(
              "py-4 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm transition-colors",
              activeTab === 'groups'
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
            aria-current={activeTab === 'groups' ? 'page' : undefined}
          >
            <Users className="w-4 h-4" />
            Study Groups
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'members' ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Class Roster</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {members?.map((member) => (
                  <tr key={member.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{member.full_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{member.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{member.student_id || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(member.joined_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {members?.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-0">
                      <EmptyState
                        type="no_data"
                        title="No students yet"
                        description={`Share the invite code ${classData.invite_code} for students to join.`}
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
