import { http, HttpResponse } from 'msw';
import type { Group } from '@/features/groups/types/group';

export const mockGroups: Group[] = [
  {
    id: 'g-101',
    name: 'Nhóm 01 — React Architecture',
    class_id: 'c-101',
    created_at: '2026-08-20T08:00:00Z',
    member_count: 3,
    members: [
      { id: 'u-1', full_name: 'Nguyen Van A', email: 'a@example.com', is_leader: true, joined_at: '2026-08-20T08:00:00Z' },
      { id: 'u-2', full_name: 'Tran Thi B', email: 'b@example.com', is_leader: false, joined_at: '2026-08-21T09:00:00Z' },
      { id: 'u-3', full_name: 'Le Van C', email: 'c@example.com', is_leader: false, joined_at: '2026-08-22T10:00:00Z' },
    ],
  },
  {
    id: 'g-102',
    name: 'Nhóm 02 — Fullstack Node.js',
    class_id: 'c-101',
    created_at: '2026-08-21T08:00:00Z',
    member_count: 6, // Full group
    members: [
      { id: 'u-4', full_name: 'Pham Van D', email: 'd@example.com', is_leader: true, joined_at: '2026-08-21T08:00:00Z' },
      { id: 'u-5', full_name: 'Hoang Thi E', email: 'e@example.com', is_leader: false, joined_at: '2026-08-21T09:00:00Z' },
      { id: 'u-6', full_name: 'Vu Van F', email: 'f@example.com', is_leader: false, joined_at: '2026-08-22T10:00:00Z' },
      { id: 'u-7', full_name: 'Dang Thi G', email: 'g@example.com', is_leader: false, joined_at: '2026-08-22T11:00:00Z' },
      { id: 'u-8', full_name: 'Bui Van H', email: 'h@example.com', is_leader: false, joined_at: '2026-08-23T12:00:00Z' },
      { id: 'u-9', full_name: 'Do Thi K', email: 'k@example.com', is_leader: false, joined_at: '2026-08-23T13:00:00Z' },
    ],
  },
];

export const groupsHandlers = [
  // GET /api/groups or /api/groups?classId=...
  http.get('/api/groups', ({ request }) => {
    const url = new URL(request.url);
    const classId = url.searchParams.get('classId');
    if (classId) {
      const filtered = mockGroups.filter((g) => g.class_id === classId);
      return HttpResponse.json({ success: true, data: filtered });
    }
    return HttpResponse.json({ success: true, data: mockGroups });
  }),

  // GET /api/groups/:id
  http.get('/api/groups/:id', ({ params }) => {
    const { id } = params;
    const group = mockGroups.find((g) => g.id === id);
    if (!group) {
      return HttpResponse.json({ success: false, message: 'Group not found' }, { status: 404 });
    }
    return HttpResponse.json({ success: true, data: group });
  }),

  // POST /api/groups/:id/join
  http.post('/api/groups/:id/join', async ({ params }) => {
    const { id } = params;
    const group = mockGroups.find((g) => g.id === id);
    
    if (!group) {
      return HttpResponse.json({ success: false, message: 'Group not found' }, { status: 404 });
    }

    if ((group.member_count || group.members.length) >= 6) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'GROUP_FULL',
            message: 'Nhóm đã đạt số lượng tối đa 6 thành viên.',
          },
        },
        { status: 409 }
      );
    }

    // Add current student mock
    group.member_count = (group.member_count || group.members.length) + 1;
    group.members.push({
      id: '123',
      full_name: 'Mock User (Bạn)',
      email: 'mockuser@example.com',
      is_leader: false,
      joined_at: new Date().toISOString(),
    });

    return HttpResponse.json({
      success: true,
      data: {
        group_id: id,
        user_id: '123',
        is_leader: false,
        joined_at: new Date().toISOString(),
      },
    });
  }),
];
