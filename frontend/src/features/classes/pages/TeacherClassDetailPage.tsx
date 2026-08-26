import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useClass, useClassMembers } from '../hooks/useClasses';


export const TeacherClassDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: classData, isLoading: isClassLoading } = useClass(id as string);
  const { data: members, isLoading: isMembersLoading } = useClassMembers(id as string);

  if (isClassLoading || isMembersLoading) return <div>Loading...</div>;
  if (!classData) return <div>Class not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link to="/teacher/classes" className="text-sm text-gray-500 hover:text-blue-600">
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
            Invite Code: <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded">{classData.invite_code}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Students ({members?.length || 0})</h2>
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
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    No students have joined this class yet. Share the invite code: <strong>{classData.invite_code}</strong>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
