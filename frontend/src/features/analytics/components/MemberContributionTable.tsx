import React from 'react';
import { analyticsMessages } from '@/constants/messages/analytics';
import { ContributionBadge } from './ContributionBadge';
import { ContributionProgressBar } from './ContributionProgressBar';
import { getMemberCategory } from '../constants/thresholds';
import type { GroupMemberContribution } from '../types/analytics.types';

interface MemberContributionTableProps {
  members: GroupMemberContribution[];
}

export const MemberContributionTable: React.FC<MemberContributionTableProps> = ({ members }) => {
  if (!members || members.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-gray-500">
        {analyticsMessages.empty.noDataDescription}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700 uppercase tracking-wider">
          <tr>
            <th scope="col" className="px-4 py-3 text-center w-16">
              {analyticsMessages.table.rank}
            </th>
            <th scope="col" className="px-4 py-3">
              {analyticsMessages.table.name}
            </th>
            <th scope="col" className="px-4 py-3 text-center">
              {analyticsMessages.table.category}
            </th>
            <th scope="col" className="px-4 py-3 min-w-[180px]">
              {analyticsMessages.table.score}
            </th>
            <th scope="col" className="px-4 py-3 text-center">
              {analyticsMessages.table.activities}
            </th>
            <th scope="col" className="px-4 py-3 text-center">
              {analyticsMessages.table.tasksCompleted} / {analyticsMessages.table.tasksAssigned}
            </th>
            <th scope="col" className="px-4 py-3 text-center">
              {analyticsMessages.table.tasksCreated}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {members.map((member, idx) => {
            const category = getMemberCategory(member);
            const rank = member.rank || idx + 1;

            return (
              <tr key={member.userId} className="hover:bg-gray-50/80 transition-colors">
                <td className="px-4 py-3 text-center font-bold text-gray-500">#{rank}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{member.name}</td>
                <td className="px-4 py-3 text-center">
                  <ContributionBadge category={category} />
                </td>
                <td className="px-4 py-3">
                  <ContributionProgressBar score={member.contributionScore} memberName={member.name} />
                </td>
                <td className="px-4 py-3 text-center font-mono font-medium text-gray-800">
                  {member.totalActivities}
                </td>
                <td className="px-4 py-3 text-center font-mono text-xs">
                  <span className="font-semibold text-gray-900">{member.tasksCompleted}</span>
                  <span className="text-gray-400"> / {member.tasksAssigned}</span>
                </td>
                <td className="px-4 py-3 text-center font-mono text-gray-700">{member.tasksCreated}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
