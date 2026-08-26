import { useQuery, type UseQueryOptions, type QueryKey } from '@tanstack/react-query';
import type { ApiError } from '@/lib/axios';

export function useApiQuery<TData = any, TQueryKey extends QueryKey = QueryKey>(
  queryKey: TQueryKey,
  fetchFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, ApiError, TData, TQueryKey>, 'queryKey' | 'queryFn'>
) {
  return useQuery<TData, ApiError, TData, TQueryKey>({
    queryKey,
    queryFn: fetchFn,
    ...options,
  });
}
