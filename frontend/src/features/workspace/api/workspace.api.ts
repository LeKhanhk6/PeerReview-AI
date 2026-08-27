import { api } from '@/lib/axios';
import type {
  TaskItem,
  TaskStatus,
  DiscussionMessage,
  ActivityLog,
  GroupFileItem,
} from '../types/workspace.types';
import {
  mockTasks,
  mockDiscussions,
  mockActivities,
  mockFiles,
} from '@/mocks/handlers/workspace.handlers';

export const workspaceApi = {
  // Tasks
  getGroupTasks: async (groupId: string): Promise<TaskItem[]> => {
    try {
      const res: any = await api.get(`/workspace/groups/${groupId}/tasks`);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      return mockTasks;
    } catch (_err) {
      return mockTasks;
    }
  },

  createTask: async (
    groupId: string,
    data: { title: string; status?: TaskStatus; assignee_id?: string | null }
  ): Promise<TaskItem> => {
    try {
      const res: any = await api.post(`/workspace/groups/${groupId}/tasks`, data);
      return res.data || res;
    } catch (_err) {
      const newTask: TaskItem = {
        id: Date.now(),
        group_id: groupId,
        title: data.title,
        status: data.status || 'TODO',
        assignee_id: data.assignee_id || null,
        created_at: new Date().toISOString(),
      };
      mockTasks.push(newTask);
      mockActivities.unshift({
        id: Date.now(),
        group_id: groupId,
        user_id: 'u-current',
        user_name: 'Bạn (Sinh viên)',
        action_type: 'TASK_CREATE',
        content_summary: `Đã tạo công việc mới: "${data.title}"`,
        created_at: new Date().toISOString(),
      });
      return newTask;
    }
  },

  updateTask: async (
    taskId: string | number,
    data: { title?: string; status?: TaskStatus; assignee_id?: string | null }
  ): Promise<TaskItem> => {
    try {
      const res: any = await api.patch(`/workspace/tasks/${taskId}`, data);
      return res.data || res;
    } catch (_err) {
      const taskIndex = mockTasks.findIndex((t) => String(t.id) === String(taskId));
      if (taskIndex !== -1) {
        const oldTitle = mockTasks[taskIndex].title;
        mockTasks[taskIndex] = { ...mockTasks[taskIndex], ...data };
        mockActivities.unshift({
          id: Date.now(),
          group_id: mockTasks[taskIndex].group_id,
          user_id: 'u-current',
          user_name: 'Bạn (Sinh viên)',
          action_type: 'TASK_UPDATE',
          content_summary: `Đã cập nhật công việc "${oldTitle}" ${data.status ? `sang ${data.status}` : ''}`,
          created_at: new Date().toISOString(),
        });
        return mockTasks[taskIndex];
      }
      return { id: taskId, group_id: 'g-101', title: 'Task', status: data.status || 'TODO', assignee_id: null };
    }
  },

  deleteTask: async (taskId: string | number): Promise<{ success: boolean }> => {
    try {
      const res: any = await api.delete(`/workspace/tasks/${taskId}`);
      return res.data || res;
    } catch (_err) {
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
      }
      return { success: true };
    }
  },

  // Discussions
  getGroupDiscussions: async (groupId: string): Promise<DiscussionMessage[]> => {
    try {
      const res: any = await api.get(`/workspace/groups/${groupId}/discussions`);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      return mockDiscussions;
    } catch (_err) {
      return mockDiscussions;
    }
  },

  createDiscussion: async (groupId: string, message: string): Promise<DiscussionMessage> => {
    try {
      const res: any = await api.post(`/workspace/groups/${groupId}/discussions`, { message });
      return res.data || res;
    } catch (_err) {
      const newMsg: DiscussionMessage = {
        id: Date.now(),
        group_id: groupId,
        user_id: 'u-current',
        user_name: 'Bạn (Sinh viên)',
        message,
        created_at: new Date().toISOString(),
      };
      mockDiscussions.push(newMsg);
      return newMsg;
    }
  },

  // Activities (Paginated)
  getGroupActivities: async (groupId: string, page = 1, limit = 50): Promise<ActivityLog[]> => {
    try {
      const res: any = await api.get(`/workspace/groups/${groupId}/activities`, {
        params: { page, limit },
      });
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      return mockActivities;
    } catch (_err) {
      return mockActivities;
    }
  },

  // Group Files
  getGroupFiles: async (groupId: string): Promise<GroupFileItem[]> => {
    try {
      const res: any = await api.get(`/workspace/groups/${groupId}/files`);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      return mockFiles;
    } catch (_err) {
      return mockFiles;
    }
  },

  createGroupFile: async (
    groupId: string,
    data: { fileName: string; fileUrl: string }
  ): Promise<GroupFileItem> => {
    try {
      const res: any = await api.post(`/workspace/groups/${groupId}/files`, data);
      return res.data || res;
    } catch (_err) {
      const newFile: GroupFileItem = {
        id: Date.now(),
        group_id: groupId,
        uploaded_by: 'u-current',
        uploader_name: 'Bạn (Sinh viên)',
        file_name: data.fileName,
        file_url: data.fileUrl,
        created_at: new Date().toISOString(),
      };
      mockFiles.push(newFile);
      return newFile;
    }
  },
};
