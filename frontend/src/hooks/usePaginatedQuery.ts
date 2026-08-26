import { useQuery, keepPreviousData, type QueryKey, type UseQueryOptions } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import type { ApiError } from '@/lib/axios';

export function usePaginatedQuery<TData = any>(
  queryKeyPrefix: unknown[],
  fetchFn: (params: Record<string, any>) => Promise<TData>,
  defaultLimit: number = 10,
  options?: Omit<UseQueryOptions<TData, ApiError, TData, QueryKey>, 'queryKey' | 'queryFn' | 'placeholderData'>
) {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || String(defaultLimit), 10);
  
  const filters: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    if (key !== 'page' && key !== 'limit') {
      filters[key] = value;
    }
  });

  const params = { page, limit, ...filters };
  // Include params in queryKey to ensure reactivity when URL changes
  const queryKey = [...queryKeyPrefix, params];

  const query = useQuery<TData, ApiError>({
    queryKey,
    queryFn: () => fetchFn(params),
    placeholderData: keepPreviousData,
    ...options,
  });

  const setPage = (newPage: number) => {
    setSearchParams((prev) => {
      prev.set('page', String(newPage));
      return prev;
    });
  };

  const setFilter = (key: string, value: string | null) => {
    setSearchParams((prev) => {
      if (value === null || value === '') {
        prev.delete(key);
      } else {
        prev.set(key, value);
      }
      // Reset to page 1 when any filter changes
      prev.set('page', '1');
      return prev;
    });
  };

  return {
    ...query,
    page,
    limit,
    setPage,
    setFilter,
  };
}
