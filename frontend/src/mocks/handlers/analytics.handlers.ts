import { http, HttpResponse } from 'msw';

export const mockDashboardOverview = {
  totalClasses: 3,
  totalStudents: 45,
  totalAssignments: 6,
  hasAssignments: true,
  expectedSubmissions: 30,
  actualSubmissions: 25,
  expectedReviews: 50,
  completedReviews: 42,
  submissionRate: 83.33,
  reviewCompletionRate: 84.0,
  averageScore: 8.45,
};

export const mockClassContributions = [
  {
    groupId: 'g-101',
    groupName: 'Nhóm 01 - Thuật Toán B-Tree',
    hasFreeRider: false,
    memberCount: 4,
    averageContributionScore: 0.78,
  },
  {
    groupId: 'g-102',
    groupName: 'Nhóm 02 - Xây Dựng REST API',
    hasFreeRider: true,
    memberCount: 3,
    averageContributionScore: 0.42,
  },
];

export const mockGroupContribution = [
  {
    userId: 'u-1',
    name: 'Nguyen Van A (Leader)',
    totalActivities: 35,
    activityBreakdown: { TASK_CREATE: 5, TASK_UPDATE: 12, SUBMISSION_UPLOAD: 3, COMMENT_ADD: 15 },
    tasksAssigned: 8,
    tasksCompleted: 8,
    tasksCreated: 5,
    completionRate: 1.0,
    contributionScore: 0.88,
    isFreeRider: false,
    isInactive: false,
    rank: 1,
  },
  {
    userId: 'u-2',
    name: 'Tran Thi B',
    totalActivities: 22,
    activityBreakdown: { TASK_UPDATE: 8, SUBMISSION_UPLOAD: 2, COMMENT_ADD: 12 },
    tasksAssigned: 5,
    tasksCompleted: 4,
    tasksCreated: 2,
    completionRate: 0.8,
    contributionScore: 0.65,
    isFreeRider: false,
    isInactive: false,
    rank: 2,
  },
  {
    userId: 'u-3',
    name: 'Le Van C',
    totalActivities: 2,
    activityBreakdown: { COMMENT_ADD: 2 },
    tasksAssigned: 4,
    tasksCompleted: 0,
    tasksCreated: 0,
    completionRate: 0.0,
    contributionScore: 0.05,
    isFreeRider: true,
    isInactive: false,
    rank: 3,
  },
];

export const mockCollaborationRisks = [
  {
    id: 'risk-1',
    groupId: 'g-102',
    groupName: 'Nhóm 02 - Xây Dựng REST API',
    userId: 'u-3',
    userName: 'Le Van C',
    entityType: 'USER',
    riskType: 'LOW_CONTRIBUTION',
    severity: 'HIGH',
    score: 0.95,
    message: 'Thành viên Le Van C có đóng góp cực kỳ thấp (5%) và không hoàn thành bất kỳ task nào được giao.',
    status: 'ACTIVE',
    createdAt: '2026-08-27T10:00:00Z',
  },
  {
    id: 'risk-2',
    groupId: 'g-102',
    groupName: 'Nhóm 02 - Xây Dựng REST API',
    entityType: 'GROUP',
    riskType: 'UNBALANCED_CONTRIBUTION',
    severity: 'MEDIUM',
    score: 0.72,
    message: 'Phân chia công việc trong Nhóm 02 quá mất cân bằng giữa các thành viên.',
    status: 'ACTIVE',
    createdAt: '2026-08-27T11:30:00Z',
  },
  {
    id: 'risk-3',
    groupId: 'g-103',
    groupName: 'Nhóm 03 - Thiết Kế CSDL',
    entityType: 'GROUP',
    riskType: 'DEAD_GROUP',
    severity: 'HIGH',
    score: 0.98,
    message: 'Nhóm 03 chưa phát sinh bất kỳ tương tác hoặc thảo luận nào trong 3 ngày qua.',
    status: 'ACTIVE',
    createdAt: '2026-08-26T08:00:00Z',
  },
];

export const analyticsHandlers = [
  // GET /api/analytics/dashboard/overview
  http.get('/api/analytics/dashboard/overview', ({ request }) => {
    const url = new URL(request.url);
    const classId = url.searchParams.get('classId');
    if (classId === 'error-500') {
      return HttpResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
    return HttpResponse.json({
      success: true,
      data: mockDashboardOverview,
    });
  }),

  // GET /api/analytics/classes/:classId/contributions
  http.get('/api/analytics/classes/:classId/contributions', ({ params }) => {
    const { classId } = params;
    if (classId === 'error-500') {
      return HttpResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
    return HttpResponse.json({
      success: true,
      data: mockClassContributions,
    });
  }),

  // GET /api/analytics/groups/:groupId/contribution
  http.get('/api/analytics/groups/:groupId/contribution', ({ params }) => {
    const { groupId } = params;
    if (groupId === 'error-500') {
      return HttpResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
    return HttpResponse.json({
      success: true,
      data: mockGroupContribution,
    });
  }),

  // GET /api/analytics/classes/:classId/collaboration-risks
  http.get('/api/analytics/classes/:classId/collaboration-risks', ({ params }) => {
    const { classId } = params;
    if (classId === 'error-500') {
      return HttpResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
    return HttpResponse.json({
      success: true,
      data: mockCollaborationRisks,
    });
  }),
];
