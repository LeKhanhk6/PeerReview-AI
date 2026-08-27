import { api } from '@/lib/axios';
import type { Group, CreateGroupPayload, AddMemberPayload, RemoveMemberPayload, AssignLeaderPayload } from '../types/group';

export const groupsApi = {
  getGroups: async (classId: string): Promise<Group[]> => {
    return api.get('/groups', { params: { classId } });
  },

  getGroupDetail: async (id: string): Promise<Group> => {
    return api.get(`/groups/${id}`);
  },

  createGroup: async (data: CreateGroupPayload): Promise<Group> => {
    return api.post('/groups', data);
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
