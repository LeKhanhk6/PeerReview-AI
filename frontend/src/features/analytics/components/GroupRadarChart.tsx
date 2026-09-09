import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

export interface RadarDataPoint {
  userId: string;
  name: string;
  c1: number;
  c2: number;
  c3: number;
  c4: number;
  color: string;
}

interface GroupRadarChartProps {
  data: RadarDataPoint[];
}

export const GroupRadarChart: React.FC<GroupRadarChartProps> = ({ data }) => {
  if (!data || data.length === 0) return null;

  // We need to pivot data for Recharts:
  // Each object is an axis (subject), e.g., { subject: 'C1: Năng suất', User1: 80, User2: 90 }
  const axes = [
    { key: 'c1', label: 'C1 (Hoạt động)' },
    { key: 'c2', label: 'C2 (Chất lượng)' },
    { key: 'c3', label: 'C3 (Đúng hạn)' },
    { key: 'c4', label: 'C4 (Làm việc nhóm)' }
  ];

  const chartData = axes.map(axis => {
    const point: any = { subject: axis.label };
    data.forEach(user => {
      // Normalize C2-C4 (1-5 scale) to 0-100 scale for visual comparison with C1 (0-100)
      if (axis.key === 'c1') {
        point[user.userId] = user.c1;
      } else {
        const val = user[axis.key as keyof RadarDataPoint] as number;
        // Map 1-5 to 0-100 (where 1 is 0%, 5 is 100%) or (where 1 is 20%, 5 is 100%)
        // User requested: normalize 0-1 (C1/100, C2-C4/5).
        // Standard mapping for 5 point scale where 5 = 100%:
        point[user.userId] = (val / 5) * 100;
      }
    });
    return point;
  });

  return (
    <div className="w-full h-80 bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <h3 className="text-sm font-bold text-gray-800 mb-4 text-center">Biểu đồ Năng lực (0-100%)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
          <Tooltip 
            formatter={(value: any, name: any) => {
              const user = data.find(u => u.userId === name);
              return [`${value.toFixed(0)}%`, user?.name || name];
            }}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          {data.map((user) => (
            <Radar
              key={user.userId}
              name={user.userId}
              dataKey={user.userId}
              stroke={user.color}
              fill={user.color}
              fillOpacity={0.4}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
