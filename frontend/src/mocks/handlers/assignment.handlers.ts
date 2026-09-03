import { http, HttpResponse } from 'msw';

export const mockClasses = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Lớp 01 - Cấu trúc dữ liệu', course_code: 'CSC10001', course_name: 'Cấu trúc dữ liệu và giải thuật' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Lớp 02 - Lập trình Web', course_code: 'INT2204', course_name: 'Lập trình Web nâng cao' },
];

export const mockAssignments = [
  {
    id: '33333333-3333-3333-3333-333333333333',
    class_id: '11111111-1111-1111-1111-111111111111',
    class_name: 'Lớp 01 - Cấu trúc dữ liệu',
    title: 'Bài tập 1 - Triển khai B-Tree',
    description: 'Xây dựng cấu trúc B-Tree trên ngôn ngữ C++ hoặc Java.',
    requirements: 'Hỗ trợ các thao tác Insert, Delete, Search.',
    deadline: '2026-12-31T23:59:59.000Z',
    created_at: '2026-08-01T00:00:00.000Z',
    has_rubric: true,
    rubric: {
      id: 'r-1',
      assignment_id: '33333333-3333-3333-3333-333333333333',
      description: 'Chấm chéo B-Tree',
      criteria: [
        { id: 'c-1', name: 'Tính đúng đắn của thuật toán', description: 'Chạy đúng test cases', weight: 60 },
        { id: 'c-2', name: 'Chất lượng mã nguồn', description: 'Clean code, comment đầy đủ', weight: 40 },
      ]
    }
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    class_id: '22222222-2222-2222-2222-222222222222',
    class_name: 'Lớp 02 - Lập trình Web',
    title: 'Đồ án 1 - Xây dựng RESTful API',
    description: 'Thiết kế hệ thống RESTful API quản lý sản phẩm.',
    requirements: 'Đầy đủ CRUD, JWT Authentication, OpenAPI spec.',
    deadline: '2026-11-15T23:59:59.000Z',
    created_at: '2026-08-10T00:00:00.000Z',
    has_rubric: false,
    rubric: null
  }
];

export const assignmentHandlers = [
  // GET /api/classes
  http.get('/api/classes', () => {
    return HttpResponse.json({
      success: true,
      data: mockClasses,
      pagination: { total: mockClasses.length, page: 1, limit: 10, totalPages: 1 }
    });
  }),

  // GET /api/assignments
  http.get('/api/assignments', ({ request }) => {
    const url = new URL(request.url);
    const classId = url.searchParams.get('classId');
    const filtered = classId ? mockAssignments.filter(a => a.class_id === classId) : mockAssignments;

    return HttpResponse.json({
      success: true,
      data: filtered,
      pagination: {
        total: filtered.length,
        page: 1,
        limit: 10,
        totalPages: 1
      }
    });
  }),

  // GET /api/assignments/:id/detail
  http.get('/api/assignments/:id/detail', ({ params }) => {
    const { id } = params;
    if (id === 'error-500') {
      return HttpResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
    const item = mockAssignments.find(a => a.id === id);
    if (!item) {
      return HttpResponse.json({ success: false, message: 'Assignment not found' }, { status: 404 });
    }
    return HttpResponse.json({ success: true, data: item });
  }),

  // POST /api/assignments
  http.post('/api/assignments', async ({ request }) => {
    const body = await request.json() as any;
    if (!body.title) {
      return HttpResponse.json({ success: false, message: 'Title is required' }, { status: 400 });
    }
    if (new Date(body.deadline) <= new Date()) {
      return HttpResponse.json({ success: false, message: 'Deadline must be in the future' }, { status: 400 });
    }

    const newAssignment = {
      id: `mock-ass-${Date.now()}`,
      class_id: body.class_id,
      class_name: mockClasses.find(c => c.id === body.class_id)?.name || 'Lớp học',
      title: body.title,
      description: body.description || null,
      requirements: body.requirements || null,
      deadline: body.deadline,
      created_at: new Date().toISOString(),
      has_rubric: false,
      rubric: null
    };

    mockAssignments.push(newAssignment);
    return HttpResponse.json({ success: true, data: newAssignment });
  }),

  // PUT /api/assignments/:id
  http.put('/api/assignments/:id', async ({ params, request }) => {
    const { id } = params;
    const body = await request.json() as any;
    const index = mockAssignments.findIndex(a => a.id === id);

    if (index === -1) {
      return HttpResponse.json({ success: false, message: 'Assignment not found' }, { status: 404 });
    }

    mockAssignments[index] = {
      ...mockAssignments[index],
      title: body.title,
      description: body.description,
      requirements: body.requirements,
      deadline: body.deadline
    };

    return HttpResponse.json({ success: true, data: mockAssignments[index] });
  }),

  // DELETE /api/assignments/:id
  http.delete('/api/assignments/:id', ({ params }) => {
    const { id } = params;
    const index = mockAssignments.findIndex(a => a.id === id);
    if (index !== -1) {
      mockAssignments.splice(index, 1);
    }
    return HttpResponse.json({ success: true, message: 'Deleted successfully' });
  }),

  // GET /api/rubrics/assignment/:assignmentId
  http.get('/api/rubrics/assignment/:assignmentId', ({ params }) => {
    const { assignmentId } = params;
    const item = mockAssignments.find(a => a.id === assignmentId);
    if (!item || !item.rubric) {
      return HttpResponse.json({ success: false, message: 'Rubric not found' }, { status: 404 });
    }
    return HttpResponse.json({ success: true, data: item.rubric });
  }),

  // PUT /api/rubrics/assignment/:assignmentId (Upsert Rubric & Criteria)
  http.put('/api/rubrics/assignment/:assignmentId', async ({ params, request }) => {
    const { assignmentId } = params;
    const body = await request.json() as any;

    const totalWeight = (body.criteria || []).reduce((s: number, c: any) => s + (Number(c.weight) || 0), 0);
    if (Math.abs(totalWeight - 100) >= 0.01) {
      return HttpResponse.json({
        success: false,
        message: 'Total weight must be 100%'
      }, { status: 400 });
    }

    const itemIndex = mockAssignments.findIndex(a => a.id === assignmentId);
    if (itemIndex !== -1) {
      mockAssignments[itemIndex].has_rubric = true;
      mockAssignments[itemIndex].rubric = {
        id: `rubric-${Date.now()}`,
        assignment_id: assignmentId as string,
        description: body.description || null,
        criteria: body.criteria
      };
    }

    return HttpResponse.json({
      success: true,
      data: {
        id: `rubric-${Date.now()}`,
        assignment_id: assignmentId,
        description: body.description,
        criteria: body.criteria
      }
    });
  }),

  // Simulated Attachment Upload API (MSW Mock only)
  http.post('/api/assignments/:id/attachments', async () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: `att-${Date.now()}`,
        file_name: 'mock_attachment.pdf',
        file_url: 'https://example.com/mock_attachment.pdf'
      }
    });
  })
];
