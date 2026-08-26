import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classesApi } from '../api/classes.api';
import type { CreateClassDTO, UpdateClassDTO } from '../types';

export const classKeys = {
  all: ['classes'] as const,
  lists: () => [...classKeys.all, 'list'] as const,
  details: () => [...classKeys.all, 'detail'] as const,
  detail: (id: string) => [...classKeys.details(), id] as const,
  members: (id: string) => [...classKeys.detail(id), 'members'] as const,
};

export const useClasses = () => {
  return useQuery({
    queryKey: classKeys.lists(),
    queryFn: classesApi.getAll,
  });
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
      queryClient.invalidateQueries({ queryKey: classKeys.lists() });
    },
  });
};

export const useUpdateClass = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClassDTO }) => classesApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: classKeys.lists() });
      queryClient.invalidateQueries({ queryKey: classKeys.detail(variables.id) });
    },
  });
};

export const useDeleteClass = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => classesApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: classKeys.lists() });
      queryClient.removeQueries({ queryKey: classKeys.detail(id) });
    },
  });
};

export const useJoinClass = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (invite_code: string) => classesApi.join(invite_code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.lists() });
    },
  });
};
