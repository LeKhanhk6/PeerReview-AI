import React from 'react';
import { ContributionBadge } from './ContributionBadge';

interface AssignmentContributionTableProps {
  members: any[];
}

export const AssignmentContributionTable: React.FC<AssignmentContributionTableProps> = ({ members }) => {
  if (!members || members.length === 0) return null;

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider">
          <tr>
            <th scope="col" className="px-4 py-3">Thành viên</th>
            <th scope="col" className="px-4 py-3 text-center">Xếp loại</th>
            <th scope="col" className="px-4 py-3 text-center">S_i (Multiplier)</th>
            <th scope="col" className="px-4 py-3 text-center">C1 (Auto)</th>
            <th scope="col" className="px-4 py-3 text-center">C2-C4 (Peer)</th>
            <th scope="col" className="px-4 py-3 text-center">Cảnh báo</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {members.map((m) => {
            const hasMissingVotes = m.isMissingEvaluation === true;

            return (
              <tr key={m.userId} className="hover:bg-indigo-50/30 transition-colors">
                <td className="px-4 py-3 font-semibold text-gray-900">{m.name}</td>
                <td className="px-4 py-3 text-center">
                  <ContributionBadge category={m.classification} />
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="font-mono font-bold text-brand-primary bg-brand-primary/10 px-2 py-1 rounded-md">
                    x{m.multiplier?.toFixed(2)}
                  </span>
                </td>
                <td className="px-4 py-3 text-center font-mono text-gray-600">
                  {m.c1?.toFixed(1)}/100
                </td>
                <td className="px-4 py-3 text-center font-mono text-gray-600">
                  <div className="flex gap-1 justify-center text-xs">
                    <span title="Artifact Quality">C2:{m.c2?.toFixed(1)}</span>
                    <span className="text-gray-300">|</span>
                    <span title="Timeliness">C3:{m.c3?.toFixed(1)}</span>
                    <span className="text-gray-300">|</span>
                    <span title="Teamwork">C4:{m.c4?.toFixed(1)}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  {hasMissingVotes ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-100 px-2 py-1 rounded-full">
                      Chưa hoàn thành chấm nội bộ
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
