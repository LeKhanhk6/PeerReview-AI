import { api } from '@/lib/axios';
import type {
  TaskItem,
  TaskStatus,
  DiscussionMessage,
  ActivityLog,
  GroupFileItem,
} from '../types/workspace.types';

export interface WorkspaceQueryResult<T> {
  hasGroup: boolean;
  data: T[];
}

export const workspaceApi = {
  // Tasks
  getGroupTasks: async (groupId: string): Promise<WorkspaceQueryResult<TaskItem>> => {
    try {
      const res: any = await api.get(`/workspace/groups/${groupId}/tasks`);
      if (res && typeof res.hasGroup === 'boolean') {
        return { hasGroup: res.hasGroup, data: Array.isArray(res.data) ? res.data : [] };
      }
      const data = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      return { hasGroup: true, data };
    } catch (_err) {
      return { hasGroup: false, data: [] };
    }
  },

  createTask: async (
    groupId: string,
    data: { title: string; status?: TaskStatus; assignee_id?: string | null }
  ): Promise<TaskItem> => {
    const res: any = await api.post(`/workspace/groups/${groupId}/tasks`, data);
    return res.data || res;
  },

  updateTask: async (
    taskId: string | number,
    data: { title?: string; status?: TaskStatus; assignee_id?: string | null }
  ): Promise<TaskItem> => {
    const res: any = await api.patch(`/workspace/tasks/${taskId}`, data);
    return res.data || res;
  },

  deleteTask: async (taskId: string | number): Promise<{ success: boolean }> => {
    const res: any = await api.delete(`/workspace/tasks/${taskId}`);
    return res.data || res;
  },

  // Discussions
  getGroupDiscussions: async (groupId: string): Promise<WorkspaceQueryResult<DiscussionMessage>> => {
    try {
      const res: any = await api.get(`/workspace/groups/${groupId}/discussions`);
      if (res && typeof res.hasGroup === 'boolean') {
        return { hasGroup: res.hasGroup, data: Array.isArray(res.data) ? res.data : [] };
      }
      const data = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      return { hasGroup: true, data };
    } catch (_err) {
      return { hasGroup: false, data: [] };
    }
  },

  createDiscussion: async (groupId: string, message: string): Promise<DiscussionMessage> => {
    const res: any = await api.post(`/workspace/groups/${groupId}/discussions`, { message });
    return res.data || res;
  },

  // Activities (Paginated)
  getGroupActivities: async (groupId: string, page = 1, limit = 50): Promise<WorkspaceQueryResult<ActivityLog>> => {
    try {
      const res: any = await api.get(`/workspace/groups/${groupId}/activities`, {
        params: { page, limit },
      });
      if (res && typeof res.hasGroup === 'boolean') {
        return { hasGroup: res.hasGroup, data: Array.isArray(res.data) ? res.data : [] };
      }
      const data = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      return { hasGroup: true, data };
    } catch (_err) {
      return { hasGroup: false, data: [] };
    }
  },

  // Group Files
  getGroupFiles: async (groupId: string): Promise<WorkspaceQueryResult<GroupFileItem>> => {
    try {
      const res: any = await api.get(`/workspace/groups/${groupId}/files`);
      if (res && typeof res.hasGroup === 'boolean') {
        return { hasGroup: res.hasGroup, data: Array.isArray(res.data) ? res.data : [] };
      }
      const data = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      return { hasGroup: true, data };
    } catch (_err) {
      return { hasGroup: false, data: [] };
    }
  },

  createGroupFile: async (
    groupId: string,
    formData: FormData,
    config?: { onUploadProgress?: (progressEvent: any) => void }
  ): Promise<GroupFileItem> => {
    // We delete Content-Type so Axios/browser automatically sets the boundary for FormData
    const res: any = await api.post(`/workspace/groups/${groupId}/files`, formData, {
      ...config,
      headers: {
        'Content-Type': undefined,
      },
    });
    return res.data || res;
  },
};
