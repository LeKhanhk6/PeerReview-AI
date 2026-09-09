import { useState } from 'react';
import { GroupRadarChart } from './features/analytics/components/GroupRadarChart';
import { AssignmentContributionTable } from './features/analytics/components/AssignmentContributionTable';

export const ScreenshotTest = () => {
  const [stateIndex, setStateIndex] = useState(0);

  const members = [
    {
      userId: 'u1',
      name: 'Nguyen Van A',
      classification: 'HIGH_CONTRIBUTOR',
      multiplier: 1.15,
      c1: 95,
      c2: 4.8,
      c3: 5,
      c4: 4.5,
      votes: 2,
      isPublished: true,
      color: '#4f46e5'
    },
    {
      userId: 'u2',
      name: 'Tran Thi B (You)',
      classification: 'NORMAL',
      multiplier: 1.0,
      c1: 80,
      c2: 4.0,
      c3: 4.0,
      c4: 4.0,
      votes: 2,
      isPublished: true,
      color: '#ec4899'
    },
    {
      userId: 'u3',
      name: 'Le Van C',
      classification: 'FREE_RIDER',
      multiplier: 0.85,
      c1: 40,
      c2: 2.0,
      c3: 2.0,
      c4: 2.0,
      votes: 0,
      isPublished: true,
      color: '#94a3b8'
    }
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto font-sans bg-gray-50 min-h-screen">
      <div className="mb-4 flex gap-2">
        <button id="btn-0" onClick={() => setStateIndex(0)} className="bg-gray-200 px-2">Teacher Modal</button>
        <button id="btn-1" onClick={() => setStateIndex(1)} className="bg-gray-200 px-2">Student View</button>
        <button id="btn-2" onClick={() => setStateIndex(2)} className="bg-gray-200 px-2">Student Empty</button>
      </div>

      {stateIndex === 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
          <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
             <div>
               <span className="text-sm font-medium text-gray-700 mr-2">Trạng thái:</span>
               <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-md">Đã công bố</span>
             </div>
             <div className="flex gap-2">
                <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-sm">Publish Lại</button>
             </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="col-span-1 border-r border-gray-100 pr-4">
                <GroupRadarChart data={members} />
             </div>
             <div className="col-span-2">
                <AssignmentContributionTable members={members} />
             </div>
          </div>
        </div>
      )}

      {stateIndex === 1 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="col-span-1 border-r border-gray-100 pr-4">
                <GroupRadarChart data={members.map(m => ({ ...m, color: m.userId === 'u2' ? '#4f46e5' : '#94a3b8' }))} />
             </div>
             <div className="col-span-2">
                <AssignmentContributionTable members={members} />
             </div>
          </div>
        </div>
      )}

      {stateIndex === 2 && (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-200 text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Chờ giảng viên công bố kết quả đánh giá</h2>
          <p className="text-gray-500">Hiện tại thời gian chấm chéo chưa kết thúc hoặc giảng viên chưa công bố điểm đóng góp. Vui lòng quay lại sau.</p>
        </div>
      )}
    </div>
  );
};
