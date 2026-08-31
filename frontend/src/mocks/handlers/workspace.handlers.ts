import { http, HttpResponse } from 'msw';
import type { TaskItem, DiscussionMessage, ActivityLog, GroupFileItem } from '../../features/workspace/types/workspace.types';

export const mockTasks: TaskItem[] = [
  {
    id: 101,
    group_id: 'g-101',
    title: 'Thiết kế sơ đồ CSDL PostgreSQL',
    status: 'DONE',
    assignee_id: 'u-1',
    assignee_name: 'Nguyen Van A (Leader)',
    created_at: '2026-08-25T08:00:00Z',
    completed_at: '2026-08-26T10:00:00Z',
  },
  {
    id: 102,
    group_id: 'g-101',
    title: 'Viết API Endpoints cho Auth & Class',
    status: 'IN_PROGRESS',
    assignee_id: 'u-2',
    assignee_name: 'Tran Thi B',
    created_at: '2026-08-26T09:00:00Z',
  },
  {
    id: 103,
    group_id: 'g-101',
    title: 'Triển khai giao diện Bảng Kanban & Tab Thảo luận',
    status: 'TODO',
    assignee_id: null,
    created_at: '2026-08-27T08:00:00Z',
  },
];

export const mockDiscussions: DiscussionMessage[] = [
  {
    id: 201,
    group_id: 'g-101',
    user_id: 'u-1',
    user_name: 'Nguyen Van A (Leader)',
    message: 'Chào cả nhóm, chúng ta cần hoàn thiện phần API trước deadline Thứ 6 nhé!',
    created_at: '2026-08-27T09:00:00Z',
  },
  {
    id: 202,
    group_id: 'g-101',
    user_id: 'u-2',
    user_name: 'Tran Thi B',
    message: 'Mình đang xử lý endpoint Workspace rồi nhé A.',
    created_at: '2026-08-27T09:15:00Z',
  },
];

export const mockActivities: ActivityLog[] = [
  {
    id: 301,
    group_id: 'g-101',
    user_id: 'u-1',
    user_name: 'Nguyen Van A (Leader)',
    action_type: 'TASK_CREATE',
    content_summary: 'Đã tạo công việc: "Thiết kế sơ đồ CSDL PostgreSQL"',
    created_at: '2026-08-25T08:00:00Z',
  },
  {
    id: 302,
    group_id: 'g-101',
    user_id: 'u-2',
    user_name: 'Tran Thi B',
    action_type: 'TASK_UPDATE',
    content_summary: 'Đã chuyển trạng thái task "Viết API Endpoints" sang IN_PROGRESS',
    created_at: '2026-08-26T09:00:00Z',
  },
];

export const mockFiles: GroupFileItem[] = [
  {
    id: 401,
    group_id: 'g-101',
    uploaded_by: 'u-1',
    uploader_name: 'Nguyen Van A (Leader)',
    file_name: 'So_Do_CSDL_DBDiagram.pdf',
    file_url: 'https://example.com/files/db_diagram.pdf',
    created_at: '2026-08-26T11:00:00Z',
  },
];

export const workspaceHandlers = [
  // Tasks
  http.get('/api/workspace/groups/:id/tasks', ({ params }) => {
    const { id } = params;
    if (id === 'error-500') {
      return HttpResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
    if (id === 'no-group' || id === 'unassigned') {
      return HttpResponse.json({ success: true, hasGroup: false, data: [] });
    }
    return HttpResponse.json({ success: true, hasGroup: true, data: mockTasks });
  }),

  http.post('/api/workspace/groups/:id/tasks', async ({ request, params }) => {
    const body = (await request.json()) as any;
    const newTask: TaskItem = {
      id: Date.now(),
      group_id: String(params.id),
      title: body.title,
      status: body.status || 'TODO',
      assignee_id: body.assignee_id || null,
      assignee_name: body.assignee_id ? 'Thành viên được gán' : undefined,
      created_at: new Date().toISOString(),
    };
    mockTasks.push(newTask);

    mockActivities.unshift({
      id: Date.now(),
      group_id: String(params.id),
      user_id: 'u-current',
      user_name: 'Bạn (Sinh viên)',
      action_type: 'TASK_CREATE',
      content_summary: `Đã tạo công việc mới: "${body.title}"`,
      created_at: new Date().toISOString(),
    });

    return HttpResponse.json({ success: true, data: newTask });
  }),

  http.patch('/api/workspace/tasks/:taskId', async ({ request, params }) => {
    const body = (await request.json()) as any;
    const { taskId } = params;
    const taskIndex = mockTasks.findIndex((t) => String(t.id) === String(taskId));
    if (taskIndex !== -1) {
      const oldTitle = mockTasks[taskIndex].title;
      mockTasks[taskIndex] = { ...mockTasks[taskIndex], ...body };

      mockActivities.unshift({
        id: Date.now(),
        group_id: mockTasks[taskIndex].group_id,
        user_id: 'u-current',
        user_name: 'Bạn (Sinh viên)',
        action_type: 'TASK_UPDATE',
        content_summary: `Đã cập nhật công việc "${oldTitle}" ${body.status ? `sang ${body.status}` : ''}`,
        created_at: new Date().toISOString(),
      });

      return HttpResponse.json({ success: true, data: mockTasks[taskIndex] });
    }
    return HttpResponse.json({ success: false, message: 'Task not found' }, { status: 404 });
  }),

  http.delete('/api/workspace/tasks/:taskId', ({ params }) => {
    const { taskId } = params;
    const taskIndex = mockTasks.findIndex((t) => String(t.id) === String(taskId));
    if (taskIndex !== -1) {
      const task = mockTasks[taskIndex];
      mockTasks.splice(taskIndex, 1);

      mockActivities.unshift({
        id: Date.now(),
        group_id: task.group_id,
        user_id: 'u-current',
        user_name: 'Bạn (Sinh viên)',
        action_type: 'TASK_DELETE',
        content_summary: `Đã xóa công việc: "${task.title}"`,
        created_at: new Date().toISOString(),
      });

      return HttpResponse.json({ success: true });
    }
    return HttpResponse.json({ success: false, message: 'Task not found' }, { status: 404 });
  }),

  // Discussions
  http.get('/api/workspace/groups/:id/discussions', ({ params }) => {
    const { id } = params;
    if (id === 'no-group' || id === 'unassigned') {
      return HttpResponse.json({ success: true, hasGroup: false, data: [] });
    }
    return HttpResponse.json({ success: true, hasGroup: true, data: mockDiscussions });
  }),

  http.post('/api/workspace/groups/:id/discussions', async ({ request, params }) => {
    const body = (await request.json()) as any;
    const newMessage: DiscussionMessage = {
      id: Date.now(),
      group_id: String(params.id),
      user_id: 'u-current',
      user_name: 'Bạn (Sinh viên)',
      message: body.message,
      created_at: new Date().toISOString(),
    };
    mockDiscussions.push(newMessage);

    mockActivities.unshift({
      id: Date.now(),
      group_id: String(params.id),
      user_id: 'u-current',
      user_name: 'Bạn (Sinh viên)',
      action_type: 'COMMENT_ADD',
      content_summary: `Đã gửi tin nhắn thảo luận: "${body.message.slice(0, 30)}..."`,
      created_at: new Date().toISOString(),
    });

    return HttpResponse.json({ success: true, data: newMessage });
  }),

  // Activities
  http.get('/api/workspace/groups/:id/activities', ({ params }) => {
    const { id } = params;
    if (id === 'no-group' || id === 'unassigned') {
      return HttpResponse.json({ success: true, hasGroup: false, data: [] });
    }
    return HttpResponse.json({ success: true, hasGroup: true, data: mockActivities });
  }),

  // Group Files
  http.get('/api/workspace/groups/:id/files', ({ params }) => {
    const { id } = params;
    if (id === 'no-group' || id === 'unassigned') {
      return HttpResponse.json({ success: true, hasGroup: false, data: [] });
    }
    return HttpResponse.json({ success: true, hasGroup: true, data: mockFiles });
  }),

  http.post('/api/workspace/groups/:id/files', async ({ request, params }) => {
    const body = (await request.json()) as any;
    const newFile: GroupFileItem = {
      id: Date.now(),
      group_id: String(params.id),
      uploaded_by: 'u-current',
      uploader_name: 'Bạn (Sinh viên)',
      file_name: body.fileName,
      file_url: body.fileUrl,
      created_at: new Date().toISOString(),
    };
    mockFiles.push(newFile);

    mockActivities.unshift({
      id: Date.now(),
      group_id: String(params.id),
      user_id: 'u-current',
      user_name: 'Bạn (Sinh viên)',
      action_type: 'SUBMISSION_UPLOAD',
      content_summary: `Đã tải lên tệp tài liệu: "${body.fileName}"`,
      created_at: new Date().toISOString(),
    });

    return HttpResponse.json({ success: true, data: newFile });
  }),
];
