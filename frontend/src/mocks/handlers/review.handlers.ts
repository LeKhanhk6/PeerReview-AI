import { http, HttpResponse } from 'msw';

export const mockReviewAssignments = [
  {
    id: 'ra-101',
    status: 'PENDING',
    assignedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    submission: {
      publicId: 'A7F2BC',
      title: 'Anonymous Submission A7F2BC',
      submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      fileUrl: '/api/submissions/A7F2BC/download',
    },
    assignmentDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ra-102',
    status: 'COMPLETED',
    assignedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    submission: {
      publicId: 'B9D4E1',
      title: 'Anonymous Submission B9D4E1',
      submittedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      fileUrl: '/api/submissions/B9D4E1/download',
    },
    assignmentDeadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ra-103',
    status: 'PENDING',
    assignedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    submission: {
      publicId: 'C3F8A2',
      title: 'Anonymous Submission C3F8A2',
      submittedAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
      fileUrl: '/api/submissions/C3F8A2/download',
    },
    assignmentDeadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const reviewHandlers = [
  // Student: Get review assignments list for an assignment
  http.get('/api/assignments/:assignmentId/my-reviews', ({ request }) => {
    const url = new URL(request.url);
    const statusFilter = url.searchParams.get('status');

    let filtered = mockReviewAssignments;
    if (statusFilter && statusFilter !== 'ALL') {
      filtered = mockReviewAssignments.filter((item) => item.status === statusFilter);
    }

    return HttpResponse.json({
      success: true,
      data: filtered,
      pagination: {
        page: 1,
        limit: 10,
        total: filtered.length,
        hasNext: false,
      },
    });
  }),

  // Student: Get detail of a specific review assignment
  http.get('/api/my-reviews/:reviewAssignmentId', ({ params }) => {
    const { reviewAssignmentId } = params;

    const matched = mockReviewAssignments.find((item) => item.id === reviewAssignmentId);
    const status = matched?.status || 'PENDING';
    const isPastDeadline = matched?.id === 'ra-103';

    return HttpResponse.json({
      success: true,
      data: {
        reviewAssignment: {
          id: reviewAssignmentId,
          status,
          assignedAt: matched?.assignedAt || new Date().toISOString(),
          isPastDeadline,
          isEditable: status === 'PENDING' && !isPastDeadline,
        },
        submission: matched?.submission || {
          publicId: 'A7F2BC',
          title: 'Anonymous Submission A7F2BC',
          submittedAt: new Date().toISOString(),
          fileUrl: '/api/submissions/A7F2BC/download',
        },
        assignment: {
          title: 'Bài tập 1: Thiết kế Kiến trúc Hệ thống',
          description: 'Học viên làm bài theo nhóm và nộp báo cáo định dạng PDF.',
          reviewDeadline: matched?.assignmentDeadline || new Date(Date.now() + 3 * 86400000).toISOString(),
          attachments: [
            {
              id: 'att-1',
              fileName: 'Huong_dan_danh_gia_rubric.pdf',
              fileUrl: '#',
              fileSize: 1024500,
            },
          ],
        },
        rubric: {
          id: 'b6e32d56-74b8-4d32-9c42-5f6a29e1d88b',
          description: 'Khung tiêu chí đánh giá chéo bài làm nhóm',
          criteria: [
            {
              id: 'd4e5f6a1-b2c3-4d5e-8f9a-0b1c2d3e4f5a',
              name: 'Tính đúng đắn và Kiến trúc thuật toán',
              description: 'Đánh giá mức độ hoàn thiện kiến trúc hệ thống và tính chính xác.',
              weight: 40.0,
            },
            {
              id: 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d',
              name: 'Chất lượng Mã nguồn & Quy tắc Code',
              description: 'Đánh giá cấu trúc code, phân lớp và tuân thủ coding conventions.',
              weight: 30.0,
            },
            {
              id: 'f1e2d3c4-b5a6-4f7e-9d8c-7b6a5f4e3d2c',
              name: 'Trình bày Báo cáo & Sáng tạo',
              description: 'Đánh giá tính mạch lạc, trực quan của sơ đồ và điểm sáng tạo.',
              weight: 30.0,
            },
          ],
        },
        review:
          status === 'COMPLETED'
            ? {
                scores: [
                  { criteriaId: 'd4e5f6a1-b2c3-4d5e-8f9a-0b1c2d3e4f5a', score: 36, comment: 'Thiết kế kiến trúc rất đầy đủ' },
                  { criteriaId: 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', score: 27, comment: 'Code phân lớp tốt' },
                  { criteriaId: 'f1e2d3c4-b5a6-4f7e-9d8c-7b6a5f4e3d2c', score: 25, comment: 'Báo cáo mạch lạc' },
                ],
                comment: 'Bài làm xuất sắc, cấu trúc rõ ràng và tuân thủ các quy tắc thiết kế.',
                totalScore: 88.0,
                submittedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
              }
            : null,
      },
    });
  }),

  // Student: Submit a peer review
  http.post('/api/my-reviews/:reviewAssignmentId/submit', async ({ request }) => {
    const body = (await request.json()) as any;

    let totalScore = 85.0;
    if (body.criteriaScores && Array.isArray(body.criteriaScores)) {
      totalScore = body.criteriaScores.reduce((acc: number, item: any) => acc + (item.score || 0), 0);
    }

    return HttpResponse.json({
      success: true,
      data: {
        reviewId: `rev-${Date.now()}`,
        totalScore,
        status: 'COMPLETED',
        submittedAt: new Date().toISOString(),
        criteriaCount: body.criteriaScores?.length || 3,
      },
    });
  }),

  // Student: AI Mentor Analysis endpoint
  http.post('/api/analyze', async ({ request }) => {
    const body = (await request.json()) as { comment?: string };
    const text = body.comment || '';

    // Check for simulated error trigger in test scenarios
    if (text.includes('trigger_ai_error')) {
      return HttpResponse.json({ success: false, message: 'AI Service Error' }, { status: 500 });
    }

    let category = '4. Góp ý chi tiết bám sát tiêu chí chấm điểm';
    let guidanceMessage = 'Nhận xét của bạn rất chất lượng, có tính xây dựng cao và chỉ rõ các điểm bài nộp đạt được.';
    let suggestedRewrite = 'Bài làm thiết kế kiến trúc hệ thống rõ ràng, phân lớp logic tốt. Cần bổ sung thêm sơ đồ luồng dữ liệu chi tiết.';

    if (text.includes('ngu') || text.includes('dở') || text.includes('xấu')) {
      category = '1. Tiêu cực/xúc phạm';
      guidanceMessage = 'Lời nhận xét chứa từ ngữ mang tính tiêu cực hoặc chỉ trích nặng lời. Vui lòng chuyển sang góp ý lịch sự và khách quan hơn.';
      suggestedRewrite = 'Bài làm cần cải thiện thêm về mặt giao diện và tối ưu thuật toán để tăng trải nghiệm người dùng.';
    } else if (text.length < 25 || text.includes('ok') || text.includes('được')) {
      category = '2. Qua loa/hời hợt';
      guidanceMessage = 'Nhận xét còn khá ngắn và hời hợt. Bạn nên chỉ ra cụ thể điểm mạnh hoặc phần nào trong bài làm cần chỉnh sửa.';
      suggestedRewrite = 'Bài làm nhìn chung đã hoàn thành các yêu cầu cơ bản, tuy nhiên cần bổ sung tài liệu hướng dẫn cài đặt chi tiết hơn.';
    } else if (text.includes('tốt') || text.includes('hay') || text.includes('đẹp')) {
      category = '3. Khen chung chung';
      guidanceMessage = 'Lời khen còn mang tính chung chung. Bạn nên gắn lời khen với một tiêu chí Rubric cụ thể (như Tính đúng đắn, Mã nguồn hoặc Báo cáo).';
      suggestedRewrite = 'Phần trình bày báo cáo rất trực quan và có tính sáng tạo cao. Sơ đồ kiến trúc trình bày chuẩn mực.';
    }

    return HttpResponse.json({
      success: true,
      data: {
        category,
        rubric_criteria: 'Nội dung',
        guidance_message: guidanceMessage,
        suggested_rewrite: suggestedRewrite,
      },
    });
  }),
];
