import { api } from '@/lib/axios';
import type {
  TaskItem,
  TaskStatus,
  DiscussionMessage,
  ActivityLog,
  GroupFileItem,
} from '../types/analytics.types'; // fallback or import from workspace.types
import type {
  TaskItem as WorkspaceTaskItem,
  DiscussionMessage as WorkspaceDiscussionMessage,
  ActivityLog as WorkspaceActivityLog,
  GroupFileItem as WorkspaceGroupFileItem,
} from '../types/workspace.types';

export const workspaceApi = {
  // Tasks
  getGroupTasks: async (groupId: string): Promise<WorkspaceTaskItem[]> => {
    const res: any = await api.get(`/workspace/groups/${groupId}/tasks`);
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    return [];
  },

  createTask: async (
    groupId: string,
    data: { title: string; status?: TaskStatus; assignee_id?: string | null }
  ): Promise<WorkspaceTaskItem> => {
    const res: any = await api.post(`/workspace/groups/${groupId}/tasks`, data);
    return res.data || res;
  },

  updateTask: async (
    taskId: string | number,
    data: { title?: string; status?: TaskStatus; assignee_id?: string | null }
  ): Promise<WorkspaceTaskItem> => {
    const res: any = await api.patch(`/workspace/tasks/${taskId}`, data);
    return res.data || res;
  },

  deleteTask: async (taskId: string | number): Promise<{ success: boolean }> => {
    const res: any = await api.delete(`/workspace/tasks/${taskId}`);
    return res.data || res;
  },

  // Discussions
  getGroupDiscussions: async (groupId: string): Promise<WorkspaceDiscussionMessage[]> => {
    const res: any = await api.get(`/workspace/groups/${groupId}/discussions`);
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    return [];
  },

  createDiscussion: async (groupId: string, message: string): Promise<WorkspaceDiscussionMessage> => {
    const res: any = await api.post(`/workspace/groups/${groupId}/discussions`, { message });
    return res.data || res;
  },

  // Activities (Paginated)
  getGroupActivities: async (groupId: string, page = 1, limit = 50): Promise<WorkspaceActivityLog[]> => {
    const res: any = await api.get(`/workspace/groups/${groupId}/activities`, {
      params: { page, limit },
    });
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    return [];
  },

  // Group Files
  getGroupFiles: async (groupId: string): Promise<WorkspaceGroupFileItem[]> => {
    const res: any = await api.get(`/workspace/groups/${groupId}/files`);
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    return [];
  },

  createGroupFile: async (
    groupId: string,
    data: { fileName: string; fileUrl: string }
  ): Promise<WorkspaceGroupFileItem> => {
    const res: any = await api.post(`/workspace/groups/${groupId}/files`, data);
    return res.data || res;
  },
};
