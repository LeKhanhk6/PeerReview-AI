import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/analytics.api';

export const analyticsKeys = {
  all: ['analytics'] as const,
  overview: (classId?: string) => ['analytics', 'overview', classId] as const,
  classContributions: (classId: string) => ['analytics', 'class-contributions', classId] as const,
  groupContribution: (groupId: string) => ['analytics', 'group-contribution', groupId] as const,
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
