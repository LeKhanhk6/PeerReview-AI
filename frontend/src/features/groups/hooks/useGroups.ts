import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupsApi } from '../api/groups.api';
import type { CreateGroupPayload, AddMemberPayload, RemoveMemberPayload, AssignLeaderPayload } from '../types/group';

export const groupKeys = {
  all: ['groups'] as const,
  list: (classId: string) => ['groups', classId] as const,
  detail: (id: string) => ['groups', 'detail', id] as const,
};

export const useGroups = (classId: string) => {
  return useQuery({
    queryKey: groupKeys.list(classId),
    queryFn: () => groupsApi.getGroups(classId),
    enabled: Boolean(classId),
  });
};

export const useGroupDetail = (id: string) => {
  return useQuery({
    queryKey: groupKeys.detail(id),
    queryFn: () => groupsApi.getGroupDetail(id),
    enabled: Boolean(id),
  });
};

export const useCreateGroup = (classId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGroupPayload) => groupsApi.createGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.list(classId) });
    },
  });
};

export const useAddMember = (classId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddMemberPayload) => groupsApi.addMember(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.list(classId) });
    },
  });
};

export const useRemoveMember = (classId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RemoveMemberPayload) => groupsApi.removeMember(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.list(classId) });
    },
  });
};

export const useAssignLeader = (classId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AssignLeaderPayload) => groupsApi.assignLeader(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.list(classId) });
    },
  });
};
