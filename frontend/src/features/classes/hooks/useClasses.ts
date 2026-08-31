import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usePaginatedQuery } from '@/hooks/usePaginatedQuery';
import { classesApi } from '../api/classes.api';
import type { Class, CreateClassDTO, UpdateClassDTO } from '../types';

export const classKeys = {
  all: ['classes'] as const,
  lists: () => [...classKeys.all, 'list'] as const,
  details: () => [...classKeys.all, 'detail'] as const,
  detail: (id: string) => [...classKeys.details(), id] as const,
  members: (id: string) => [...classKeys.detail(id), 'members'] as const,
};

const invalidateAllClassRelatedQueries = (queryClient: any, classId?: string) => {
  queryClient.invalidateQueries({ queryKey: classKeys.all });
  queryClient.invalidateQueries({ queryKey: classKeys.lists() });
  queryClient.invalidateQueries({ queryKey: ['teacher-classes'] });
  queryClient.invalidateQueries({ queryKey: ['teacher-dashboard-overview'] });
  queryClient.invalidateQueries({ queryKey: ['admin-dashboard-overview'] });
  queryClient.invalidateQueries({ queryKey: ['student-dashboard-assignments'] });
  queryClient.invalidateQueries({ queryKey: ['user-classes'] });
  queryClient.invalidateQueries({ queryKey: ['my-classes'] });
  if (classId) {
    queryClient.invalidateQueries({ queryKey: classKeys.detail(classId) });
  }
};

export const useClasses = () => {
  return usePaginatedQuery<{ data: Class[]; total: number; page: number; limit: number; totalPages: number }>(
    classKeys.lists() as unknown as unknown[],
    (params) => classesApi.getAll(params),
    10
  );
};

export const useClass = (id: string) => {
  return useQuery({
    queryKey: classKeys.detail(id),
    queryFn: () => classesApi.getById(id),
    enabled: !!id,
  });
};

export const useClassMembers = (id: string) => {
  return useQuery({
    queryKey: classKeys.members(id),
    queryFn: () => classesApi.getMembers(id),
    enabled: !!id,
  });
};

export const useCreateClass = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateClassDTO) => classesApi.create(data),
    onSuccess: () => {
      invalidateAllClassRelatedQueries(queryClient);
    },
  });
};

export const useUpdateClass = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClassDTO }) => classesApi.update(id, data),
    onSuccess: (_, variables) => {
      invalidateAllClassRelatedQueries(queryClient, variables.id);
    },
  });
};

export const useDeleteClass = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => classesApi.delete(id),
    onSuccess: (_, id) => {
      invalidateAllClassRelatedQueries(queryClient, id);
      queryClient.removeQueries({ queryKey: classKeys.detail(id) });
    },
  });
};

export const useJoinClass = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (invite_code: string) => classesApi.join(invite_code),
    onSuccess: () => {
      invalidateAllClassRelatedQueries(queryClient);
    },
  });
};
