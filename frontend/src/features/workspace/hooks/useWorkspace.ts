import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workspaceApi } from '../api/workspace.api';
import type { TaskItem, TaskStatus } from '../types/workspace.types';

export const workspaceKeys = {
  all: ['workspace'] as const,
  tasks: (groupId: string) => ['workspace', 'tasks', groupId] as const,
  discussions: (groupId: string) => ['workspace', 'discussions', groupId] as const,
  activities: (groupId: string) => ['workspace', 'activities', groupId] as const,
  files: (groupId: string) => ['workspace', 'files', groupId] as const,
};

// 1. Tasks Query & Mutations
export const useGroupTasks = (groupId: string) => {
  return useQuery({
    queryKey: workspaceKeys.tasks(groupId),
    queryFn: () => workspaceApi.getGroupTasks(groupId),
    enabled: Boolean(groupId),
    refetchInterval: 30000, // 30s auto-refresh
  });
};

export const useCreateTask = (groupId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; status?: TaskStatus; assignee_id?: string | null }) =>
      workspaceApi.createTask(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.tasks(groupId) });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.activities(groupId) });
    },
  });
};

export const useUpdateTask = (groupId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      data,
    }: {
      taskId: string | number;
      data: { title?: string; status?: TaskStatus; assignee_id?: string | null };
    }) => workspaceApi.updateTask(taskId, data),

    // Optimistic Update for smooth Kanban card movement
    onMutate: async ({ taskId, data }) => {
      await queryClient.cancelQueries({ queryKey: workspaceKeys.tasks(groupId) });
      const previousTasks = queryClient.getQueryData<TaskItem[]>(workspaceKeys.tasks(groupId));

      if (previousTasks) {
        queryClient.setQueryData<TaskItem[]>(
          workspaceKeys.tasks(groupId),
          previousTasks.map((t) => (t.id === taskId ? { ...t, ...data } : t))
        );
      }

      return { previousTasks };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(workspaceKeys.tasks(groupId), context.previousTasks);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.tasks(groupId) });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.activities(groupId) });
    },
  });
};

export const useDeleteTask = (groupId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string | number) => workspaceApi.deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.tasks(groupId) });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.activities(groupId) });
    },
  });
};

// 2. Discussions Query & Mutation
export const useGroupDiscussions = (groupId: string) => {
  return useQuery({
    queryKey: workspaceKeys.discussions(groupId),
    queryFn: () => workspaceApi.getGroupDiscussions(groupId),
    enabled: Boolean(groupId),
    refetchInterval: 15000, // 15s auto-refresh for chat
    refetchOnWindowFocus: true,
  });
};

export const useCreateDiscussion = (groupId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (message: string) => workspaceApi.createDiscussion(groupId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.discussions(groupId) });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.activities(groupId) });
    },
  });
};

// 3. Activity Logs Query
export const useGroupActivities = (groupId: string, page = 1) => {
  return useQuery({
    queryKey: workspaceKeys.activities(groupId),
    queryFn: () => workspaceApi.getGroupActivities(groupId, page),
    enabled: Boolean(groupId),
    refetchInterval: 30000, // 30s auto-refresh
  });
};

// 4. Group Files Query & Mutation
export const useGroupFiles = (groupId: string) => {
  return useQuery({
    queryKey: workspaceKeys.files(groupId),
    queryFn: () => workspaceApi.getGroupFiles(groupId),
    enabled: Boolean(groupId),
  });
};

export const useCreateGroupFile = (groupId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { fileName: string; fileUrl: string }) => workspaceApi.createGroupFile(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.files(groupId) });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.activities(groupId) });
    },
  });
};
