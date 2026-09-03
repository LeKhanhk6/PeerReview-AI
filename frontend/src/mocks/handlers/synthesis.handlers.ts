import { http, HttpResponse } from 'msw';
import type {
  AssignmentSynthesisResponse,
  SubmissionSummaryResponse,
  GetSourceReviewsResponse,
  SummaryItem,
} from '@/features/synthesis/types/synthesis.types';

// Mock DB state for testing
let mockSummaryStatus: 'DRAFT' | 'REVIEWING' | 'APPROVED' = 'DRAFT';
let mockSummaryUpdatedAt = new Date().toISOString();

const mockSummaryItems: SummaryItem[] = [
  {
    id: 'item-uuid-101',
    summary_id: 'summary-uuid-1',
    topic_category: 'STRENGTH',
    content: 'Thiết kế kiến trúc hệ thống rõ ràng, phân chia các lớp Controller/Service/DAO hợp lý.',
    note: 'Nhóm phát huy tốt nguyên tắc phân lớp kiến trúc.',
    frequency_count: 5,
    is_teacher_edited: false,
    source_review_ids: ['rev-001', 'rev-002', 'rev-003'],
    created_at: '2026-08-25T10:00:00.000Z',
    updated_at: '2026-08-25T10:00:00.000Z',
  },
  {
    id: 'item-uuid-102',
    summary_id: 'summary-uuid-1',
    topic_category: 'WEAKNESS',
    content: 'Thiếu kiểm thử đơn vị (Unit Tests) cho lớp xử lý thanh toán và xác thực JWT.',
    note: 'Cần yêu cầu bổ sung test coverage trước khi nghiệm thu.',
    frequency_count: 4,
    is_teacher_edited: false,
    source_review_ids: ['rev-002', 'rev-004'],
    created_at: '2026-08-25T10:00:00.000Z',
    updated_at: '2026-08-25T10:00:00.000Z',
  },
  {
    id: 'item-uuid-103',
    summary_id: 'summary-uuid-1',
    topic_category: 'SUGGESTION',
    content: 'Nên bổ sung bộ lưu vết lỗi Client Telemetry và tối ưu hóa truy vấn PostgreSQL bằng Indexing.',
    note: '',
    frequency_count: 3,
    is_teacher_edited: false,
    source_review_ids: ['rev-001', 'rev-005'],
    created_at: '2026-08-25T10:00:00.000Z',
    updated_at: '2026-08-25T10:00:00.000Z',
  },
  {
    id: 'item-uuid-104',
    summary_id: 'summary-uuid-1',
    topic_category: 'QUESTION',
    content: 'Cơ chế làm mới Token (Refresh Token) được xử lý ở Client hay Server Redis?',
    note: '',
    frequency_count: 2,
    is_teacher_edited: false,
    source_review_ids: ['rev-003'],
    created_at: '2026-08-25T10:00:00.000Z',
    updated_at: '2026-08-25T10:00:00.000Z',
  },
];

export const synthesisHandlers = [
  // 1. GET /api/assignments/:assignmentId/reviews/synthesis
  http.get('/api/assignments/:assignmentId/reviews/synthesis', ({ params }) => {
    const { assignmentId } = params;

    // Test case assignment without enough reviews
    if (assignmentId === 'no-reviews-assignment-id') {
      const emptyResponse: AssignmentSynthesisResponse = {
        requestId: 'req-empty-001',
        summary: 'Chưa có đủ dữ liệu để phân tích.',
        reason: 'NOT_ENOUGH_REVIEWS',
        strengths: [],
        weaknesses: [],
        suggestions: [],
        totalReviews: 2,
        reviewsUsed: 0,
        confidence: 0,
      };
      return HttpResponse.json({ success: true, data: emptyResponse });
    }

    const synthesisData: AssignmentSynthesisResponse = {
      requestId: 'req-synthesis-999',
      summary: 'Nhìn chung các nhóm đã hoàn thành bài nộp đạt chuẩn với cấu trúc mã nguồn tốt.',
      strengths: [
        'Cấu trúc sơ đồ cơ sở dữ liệu PostgreSQL chuẩn hóa, đầy đủ ràng buộc Khóa chính/Khóa ngoại.',
        'Triển khai JWT Authentication an toàn kết hợp với RBAC middleware.',
        'Viết tài liệu Swagger API chi tiết cho sinh viên tham chiếu.',
      ],
      weaknesses: [
        'Một số bài làm chưa chú trọng xử lý ngoại lệ ranh giới (Edge Cases) trong Input Validation.',
        'Thiếu các chỉ số theo dõi Client Telemetry khi xảy ra sự cố mạng.',
      ],
      suggestions: [
        'Áp dụng Zod schema validation trên cả Frontend và Backend.',
        'Bổ sung bộ kiểm thử tự động E2E trước khi nộp bài cuối kỳ.',
      ],
      totalReviews: 24,
      reviewsUsed: 20,
      confidence: 0.88,
    };

    return HttpResponse.json({ success: true, data: synthesisData });
  }),

  // 2. GET /api/submissions/:submissionId/summary
  http.get('/api/submissions/:submissionId/summary', ({ params }) => {
    const { submissionId } = params;

    if (submissionId === 'not-found-submission-id') {
      return HttpResponse.json(
        { success: false, code: 'NOT_FOUND', message: 'Summary not generated yet' },
        { status: 404 }
      );
    }

    const response: SubmissionSummaryResponse = {
      summary: {
        id: 'summary-uuid-1',
        submissionId: submissionId as string,
        status: mockSummaryStatus,
        updatedBy: mockSummaryStatus !== 'DRAFT' ? 'teacher-uuid-001' : null,
        updatedAt: mockSummaryUpdatedAt,
        generatedAt: '2026-08-25T10:00:00.000Z',
      },
      items: mockSummaryItems,
      sourceReviewsCount: 5,
    };

    return HttpResponse.json({ success: true, data: response });
  }),

  // 3. GET /api/submissions/:submissionId/reviews (Traceability source reviews)
  // CRITICAL SECURITY RULE: No PII (Student Name, Student ID, Group Name/ID) in output!
  http.get('/api/submissions/:submissionId/reviews', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);

    const mockSourceReviews: GetSourceReviewsResponse = {
      reviews: [
        {
          id: 'rev-001',
          total_score: 92,
          overall_comment:
            'Bài nộp có bố cục rất rõ ràng, giải thích thuật toán chi tiết và có đính kèm sơ đồ ERD.',
          submitted_at: '2026-08-24T14:30:00.000Z',
          status: 'SUBMITTED',
        },
        {
          id: 'rev-002',
          total_score: 78,
          overall_comment:
            'Chức năng chính chạy ổn định nhưng cần bổ sung thêm Unit tests cho luồng xử lý giao dịch.',
          submitted_at: '2026-08-24T15:10:00.000Z',
          status: 'SUBMITTED',
        },
        {
          id: 'rev-003',
          total_score: 85,
          overall_comment:
            'Giao diện người dùng thiết kế đẹp, tuy nhiên font chữ ở một số bảng hơi nhỏ.',
          submitted_at: '2026-08-24T16:00:00.000Z',
          status: 'SUBMITTED',
        },
      ],
      total: 3,
      page,
      limit,
    };

    return HttpResponse.json({
      success: true,
      data: mockSourceReviews.reviews,
      pagination: {
        page,
        limit,
        total: mockSourceReviews.total,
        hasNext: false,
      },
    });
  }),

  // 4. PATCH /api/summary-items/:itemId
  http.patch('/api/summary-items/:itemId', async ({ params, request }) => {
    const { itemId } = params;
    const body = (await request.json()) as { content?: string; note?: string; updatedAt: string };

    if (mockSummaryStatus === 'APPROVED') {
      return HttpResponse.json(
        { success: false, code: 'BAD_REQUEST', message: 'Cannot edit an approved summary' },
        { status: 400 }
      );
    }

    // Simulate 409 Conflict if payload updatedAt is outdated
    if (body.updatedAt === 'outdated-timestamp') {
      return HttpResponse.json(
        {
          success: false,
          code: 'CONFLICT',
          message: 'Failed to update item, it might have been modified by someone else',
        },
        { status: 409 }
      );
    }

    const itemIndex = mockSummaryItems.findIndex((i) => i.id === itemId);
    if (itemIndex !== -1) {
      if (body.content !== undefined) mockSummaryItems[itemIndex].content = body.content;
      if (body.note !== undefined) mockSummaryItems[itemIndex].note = body.note;
      mockSummaryItems[itemIndex].is_teacher_edited = true;
      mockSummaryItems[itemIndex].updated_at = new Date().toISOString();
    }

    // Auto-transition status from DRAFT to REVIEWING on first edit
    if (mockSummaryStatus === 'DRAFT') {
      mockSummaryStatus = 'REVIEWING';
    }
    mockSummaryUpdatedAt = new Date().toISOString();

    return HttpResponse.json({
      success: true,
      data: {
        id: itemId,
        updatedAt: mockSummaryUpdatedAt,
      },
    });
  }),

  // 5. PATCH /api/submissions/:submissionId/summary/approve
  http.patch('/api/submissions/:submissionId/summary/approve', ({ params }) => {
    const { submissionId } = params;

    if (mockSummaryStatus === 'APPROVED') {
      return HttpResponse.json(
        { success: false, code: 'BAD_REQUEST', message: 'Summary is already approved' },
        { status: 400 }
      );
    }

    mockSummaryStatus = 'APPROVED';
    mockSummaryUpdatedAt = new Date().toISOString();

    return HttpResponse.json({
      success: true,
      data: {
        id: 'summary-uuid-1',
        submissionId: submissionId as string,
        status: 'APPROVED',
        updatedAt: mockSummaryUpdatedAt,
      },
    });
  }),
];

