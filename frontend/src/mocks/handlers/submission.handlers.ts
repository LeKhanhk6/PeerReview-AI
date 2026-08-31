import { http, HttpResponse } from 'msw';
import type { SubmissionVersion, SubmissionFeedback } from '../../features/submission/types/submission.types';

export const mockSubmissionHistory: SubmissionVersion[] = [
  {
    id: 501,
    assignment_id: 'a-101',
    version_number: 1,
    file_name: 'Bao_Cao_Tuan_1_Draft.pdf',
    file_url: 'https://storage.googleapis.com/peer-review-bucket/assignment_v1.pdf',
    is_current: false,
    is_late: false,
    created_at: '2026-08-25T10:00:00Z',
  },
  {
    id: 502,
    assignment_id: 'a-101',
    version_number: 2,
    file_name: 'Bao_Cao_Final_Submit.pdf',
    file_url: 'https://storage.googleapis.com/peer-review-bucket/assignment_v2.pdf',
    is_current: true,
    is_late: false,
    created_at: '2026-08-26T14:30:00Z',
  },
];

export const mockSubmissionFeedback: SubmissionFeedback = {
  submission_id: 'sub-502',
  assignment_title: 'Bài Tập Giữa Kỳ - Thiết Kế Kiến Trúc Hệ Thống',
  average_score: 8.8,
  teacher_score: 9.0,
  teacher_feedback: 'Bài nộp trình bày cấu trúc rất rõ ràng, vẽ sơ đồ CSDL chuẩn hóa 3NF.',
  general_feedback: 'Bài nộp đáp ứng xuất sắc các yêu cầu đề bài.',
  reviews: [
    {
      id: 'rev-1',
      reviewer_name: 'Sinh viên ẩn danh #1',
      score: 8.5,
      comments: 'Phần giải thuật B-Tree nêu chi tiết, tuy nhiên nên bổ sung thêm hình vẽ minh họa.',
      submitted_at: '2026-08-27T08:00:00Z',
    },
    {
      id: 'rev-2',
      reviewer_name: 'Sinh viên ẩn danh #2',
      score: 9.0,
      comments: 'Code minh họa đẹp, tài liệu định dạng rõ ràng.',
      submitted_at: '2026-08-27T09:30:00Z',
    },
  ],
};

export const submissionHandlers = [
  // GET /api/submissions/assignments/:assignmentId/submission-history
  http.get('/api/submissions/assignments/:assignmentId/submission-history', ({ params }) => {
    const { assignmentId } = params;
    if (assignmentId === 'error-500') {
      return HttpResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
    return HttpResponse.json({ success: true, data: mockSubmissionHistory });
  }),

  // POST /api/submissions/assignments/:assignmentId
  http.post('/api/submissions/assignments/:assignmentId', async ({ request, params }) => {
    const body = (await request.json()) as any;
    const { assignmentId } = params;

    if (!body || !body.file_url) {
      return HttpResponse.json({ success: false, message: 'file_url is required' }, { status: 400 });
    }

    const newVersionNumber = mockSubmissionHistory.length + 1;

    // Mark previous current version as false
    mockSubmissionHistory.forEach((v) => (v.is_current = false));

    const newSubmission: SubmissionVersion = {
      id: Date.now(),
      assignment_id: String(assignmentId),
      version_number: newVersionNumber,
      file_name: body.file_name || `Bai_Nop_v${newVersionNumber}.pdf`,
      file_url: body.file_url,
      is_current: true,
      is_late: Boolean(body.is_late),
      created_at: new Date().toISOString(),
    };

    mockSubmissionHistory.unshift(newSubmission);
    return HttpResponse.json({ success: true, data: newSubmission });
  }),

  // GET /api/submissions/me/dashboard
  http.get('/api/submissions/me/dashboard', () => {
    return HttpResponse.json({
      success: true,
      data: {
        rows: [
          {
            assignment_id: 'a-101',
            title: 'Dự án báo cáo cuối kỳ Phân tích dữ liệu lớn',
            deadline: new Date(Date.now() + 2 * 86400000).toISOString(), // 2 days left
            group_id: 'g-101',
            group_name: 'Nhóm 4 - Data Science',
            is_late: false,
            days_left: 2,
            submission: {
              id: 'sub-501',
              status: 'IN_PROGRESS',
              submitted_at: undefined,
            },
            review: {
              status: 'UNDER_REVIEW',
            },
          },
          {
            assignment_id: 'a-102',
            title: 'Thiết kế hệ thống cơ sở dữ liệu phân tán',
            deadline: new Date(Date.now() + 10 * 86400000).toISOString(), // 10 days left
            group_id: 'g-102',
            group_name: 'Nhóm 2 - Software Architecture',
            is_late: false,
            days_left: 10,
            submission: {
              id: 'sub-502',
              status: 'SUBMITTED',
              submitted_at: '2026-08-28T14:00:00Z',
            },
            review: {
              status: 'REVIEWED',
            },
          },
        ],
        total: 2,
      },
    });
  }),

  // GET /api/submissions/assignments/:assignmentId/feedback
  http.get('/api/submissions/assignments/:assignmentId/feedback', () => {
    return HttpResponse.json({ success: true, data: mockSubmissionFeedback });
  }),
];
