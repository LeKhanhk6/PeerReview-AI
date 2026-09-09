import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/analytics.api';

export const analyticsKeys = {
  all: ['analytics'] as const,
  overview: (classId?: string) => ['analytics', 'overview', classId] as const,
  classContributions: (classId: string) => ['analytics', 'class-contributions', classId] as const,
  groupContribution: (groupId: string) => ['analytics', 'group-contribution', groupId] as const,
  collaborationRisks: (classId: string) => ['analytics', 'collaboration-risks', classId] as const,
  assignmentGroupAnalytics: (assignmentId: string, groupId: string) => ['analytics', 'assignment', assignmentId, 'group', groupId] as const,
};

export const useDashboardOverview = (classId?: string) => {
  return useQuery({
    queryKey: analyticsKeys.overview(classId),
    queryFn: () => analyticsApi.getDashboardOverview(classId),
  });
};

export const useClassContributions = (classId: string) => {
  return useQuery({
    queryKey: analyticsKeys.classContributions(classId),
    queryFn: () => analyticsApi.getClassContributions(classId),
    enabled: Boolean(classId),
  });
};

export const useGroupContribution = (groupId: string, enabled = true) => {
  return useQuery({
    queryKey: analyticsKeys.groupContribution(groupId),
    queryFn: () => analyticsApi.getGroupContribution(groupId),
    enabled: Boolean(groupId) && enabled,
  });
};

export const useClassCollaborationRisks = (classId: string) => {
  return useQuery({
    queryKey: analyticsKeys.collaborationRisks(classId),
    queryFn: () => analyticsApi.getClassCollaborationRisks(classId),
    enabled: Boolean(classId),
  });
};

import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useAssignmentGroupAnalytics = (assignmentId: string, groupId: string, enabled = true) => {
  return useQuery({
    queryKey: analyticsKeys.assignmentGroupAnalytics(assignmentId, groupId),
    queryFn: () => analyticsApi.getAssignmentGroupAnalytics(assignmentId, groupId),
    enabled: Boolean(assignmentId) && Boolean(groupId) && enabled,
    retry: false, // Don't retry on 403
  });
};

export const usePublishGroupAnalytics = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ assignmentId, groupId }: { assignmentId: string; groupId: string }) => 
      analyticsApi.publishGroupAnalytics(assignmentId, groupId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: analyticsKeys.assignmentGroupAnalytics(variables.assignmentId, variables.groupId),
      });
    },
  });
};
