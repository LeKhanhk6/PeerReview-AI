import React from 'react';
import { synthesisMessages } from '@/constants/messages/synthesis';
import type { AssignmentSynthesisResponse } from '../types/synthesis.types';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface AssignmentSynthesisOverviewProps {
  synthesis?: AssignmentSynthesisResponse;
}

export const AssignmentSynthesisOverview: React.FC<AssignmentSynthesisOverviewProps> = ({
  synthesis,
}) => {
  if (!synthesis || synthesis.reason === 'NOT_ENOUGH_REVIEWS') {
    return null;
  }

  const { strengths = [], weaknesses = [], suggestions = [] } = synthesis;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Strengths */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4" /> {synthesisMessages.categories.strength}
        </h3>
        {strengths.length === 0 ? (
          <p className="text-xs text-emerald-600 italic">Chưa phát hiện điểm sáng nổi bật.</p>
        ) : (
          <ul className="space-y-1.5 text-xs text-emerald-950 font-medium">
            {strengths.map((item, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-emerald-500 font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Weaknesses */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4" /> {synthesisMessages.categories.weakness}
        </h3>
        {weaknesses.length === 0 ? (
          <p className="text-xs text-amber-600 italic">Không có điểm yếu đáng kể.</p>
        ) : (
          <ul className="space-y-1.5 text-xs text-amber-950 font-medium">
            {weaknesses.map((item, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-amber-500 font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Suggestions */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
          <Info className="w-4 h-4" /> {synthesisMessages.categories.suggestion}
        </h3>
        {suggestions.length === 0 ? (
          <p className="text-xs text-blue-600 italic">Chưa có gợi ý cụ thể.</p>
        ) : (
          <ul className="space-y-1.5 text-xs text-blue-950 font-medium">
            {suggestions.map((item, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-blue-500 font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
