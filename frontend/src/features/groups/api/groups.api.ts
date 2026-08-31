import { api } from '@/lib/axios';
import type { Group, CreateGroupPayload, AddMemberPayload, RemoveMemberPayload, AssignLeaderPayload } from '../types/group';

export const groupsApi = {
  getGroups: async (classId: string): Promise<Group[]> => {
    const res: any = await api.get('/groups', { params: { classId } });
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    return [];
  },

  getGroupDetail: async (id: string): Promise<Group> => {
    const res: any = await api.get(`/groups/${id}`);
    return res.data || res;
  },

  createGroup: async (data: CreateGroupPayload): Promise<Group> => {
    return api.post('/groups', data);
  },

  joinGroup: async (groupId: string): Promise<any> => {
    return api.post(`/groups/${groupId}/join`);
  },

  addMember: async ({ groupId, user_id }: AddMemberPayload): Promise<any> => {
    return api.post(`/groups/${groupId}/members`, { user_id });
  },

  removeMember: async ({ groupId, userId }: RemoveMemberPayload): Promise<any> => {
    return api.delete(`/groups/${groupId}/members/${userId}`);
  },

  assignLeader: async ({ groupId, user_id }: AssignLeaderPayload): Promise<any> => {
    return api.put(`/groups/${groupId}/leader`, { user_id });
  },
};
