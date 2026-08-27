import React from 'react';

interface ContributionProgressBarProps {
  score: number; // 0.0 to 1.0
  memberName: string;
  showPercentage?: boolean;
}

export const ContributionProgressBar: React.FC<ContributionProgressBarProps> = ({
  score,
  memberName,
  showPercentage = true,
}) => {
  const percent = Math.min(100, Math.max(0, Math.round(score * 100)));

  let barColor = 'bg-blue-600';
  if (percent >= 75) barColor = 'bg-emerald-600';
  else if (percent < 20) barColor = 'bg-red-600';
  else if (percent < 35) barColor = 'bg-amber-500';

  return (
    <div className="flex items-center gap-3 w-full">
      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Tỷ lệ đóng góp của ${memberName}`}
        className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden"
      >
        <div
          className={`h-2 transition-all duration-300 rounded-full ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showPercentage && (
        <span className="text-xs font-semibold font-mono text-gray-700 w-10 text-right">
          {percent}%
        </span>
      )}
    </div>
  );
};
