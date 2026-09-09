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

  const axes = [
    { key: 'c1', label: 'C1 (Hoạt động)' },
    { key: 'c2', label: 'C2 (Chất lượng)' },
    { key: 'c3', label: 'C3 (Đúng hạn)' },
    { key: 'c4', label: 'C4 (Làm việc nhóm)' }
  ];

  const chartData = axes.map(axis => {
    const point: any = { subject: axis.label, key: axis.key };
    data.forEach(user => {
      // Normalize C2-C4 (1-5 scale) to 0-100 scale for visual comparison with C1 (0-100)
      if (axis.key === 'c1') {
        point[user.userId] = user.c1;
      } else {
        const val = (user[axis.key as keyof RadarDataPoint] as number) || 0;
        point[user.userId] = (val / 5) * 100;
      }
    });
    return point;
  });

  return (
    <div className="w-full h-80 bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col">
      <div className="text-center mb-1">
        <h3 className="text-sm font-bold text-gray-800">Biểu đồ Năng lực Thành viên</h3>
        <p className="text-[11px] text-gray-400">Quy đổi thang điểm 0-100% để so sánh trên radar</p>
      </div>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="68%" data={chartData}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 9 }} />
            <Tooltip 
              formatter={(value: any, name: any, item: any) => {
                const user = data.find(u => u.userId === name);
                const userName = user?.name || name;
                const axisKey = item?.payload?.key;

                if (axisKey === 'c1') {
                  const c1Val = user ? user.c1 : value;
                  return [`${Number(c1Val || 0).toFixed(0)}/100 điểm`, userName];
                } else if (axisKey && ['c2', 'c3', 'c4'].includes(axisKey)) {
                  const peerVal = user ? (user[axisKey as keyof RadarDataPoint] as number) : (value / 20);
                  return [`${Number(peerVal || 0).toFixed(1)}/5 điểm`, userName];
                }

                return [`${value.toFixed(0)} điểm`, userName];
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
                fillOpacity={0.35}
              />
            ))}
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
