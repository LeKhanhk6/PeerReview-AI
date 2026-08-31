import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assignmentApi } from '../api/assignment.api';
import type {
  CreateAssignmentInput,
  UpdateAssignmentInput,
  SaveRubricInput,
  AssignmentFilterParams,
} from '../types/assignment.types';

export const assignmentKeys = {
  all: ['assignments'] as const,
  classes: ['classes', 'teacher'] as const,
  list: (params?: AssignmentFilterParams) => ['assignments', 'list', params] as const,
  detail: (id: string) => ['assignments', 'detail', id] as const,
  rubric: (assignmentId: string) => ['rubric', 'assignment', assignmentId] as const,
};

export const useClassesList = () => {
  return useQuery({
    queryKey: assignmentKeys.classes,
    queryFn: () => assignmentApi.getClasses(),
  });
};

export const useAssignmentsList = (params?: AssignmentFilterParams) => {
  return useQuery({
    queryKey: assignmentKeys.list(params),
    queryFn: () => assignmentApi.getAssignments(params),
  });
};

export const useAssignmentDetail = (id?: string) => {
  const isValidUuid = Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));
  return useQuery({
    queryKey: assignmentKeys.detail(id || ''),
    queryFn: () => assignmentApi.getAssignmentById(id || ''),
    enabled: isValidUuid,
  });
};

export const useCreateAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAssignmentInput) => assignmentApi.createAssignment(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.all });
    },
  });
};

export const useUpdateAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAssignmentInput }) =>
      assignmentApi.updateAssignment({ id, data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.all });
      queryClient.invalidateQueries({ queryKey: assignmentKeys.detail(variables.id) });
    },
  });
};

export const useDeleteAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assignmentApi.deleteAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.all });
    },
  });
};

export const useAssignmentRubric = (assignmentId: string) => {
  return useQuery({
    queryKey: assignmentKeys.rubric(assignmentId),
    queryFn: () => assignmentApi.getRubricByAssignment(assignmentId),
    enabled: Boolean(assignmentId),
  });
};

export const useSaveRubric = (assignmentId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SaveRubricInput) => assignmentApi.saveRubric({ assignmentId, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.rubric(assignmentId) });
      queryClient.invalidateQueries({ queryKey: assignmentKeys.detail(assignmentId) });
      queryClient.invalidateQueries({ queryKey: assignmentKeys.all });
    },
  });
};
