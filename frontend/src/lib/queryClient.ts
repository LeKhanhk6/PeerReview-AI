import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { toastError } from './toast';
import { sendTelemetry } from './telemetry';

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: any, query) => {
      if (error.status === 401) {
        // Handle unauthorized globally (e.g. redirect to login, handled in interceptor ideally)
        return;
      }
      if (error.status === 403) {
        // Will be handled by ErrorBoundary or local component (EmptyState no_permission)
        return;
      }
      if (error.status === 404) {
        // Will be treated as empty data, no toast
        return;
      }
      
      // Log unexpected API failures to telemetry
      sendTelemetry({
        event: 'api_failure',
        metadata: {
          status: error.status,
          message: error.message,
          queryKey: query.queryKey,
        }
      });

      // Default to 500 or unknown errors
      toastError(error);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error: any, _variables, _context, mutation) => {
      // Log unexpected API failures to telemetry
      sendTelemetry({
        event: 'api_failure',
        metadata: {
          status: error.status,
          message: error.message,
          mutationKey: mutation.options.mutationKey,
        }
      });

      toastError(error);
    }
  }),
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      networkMode: 'offlineFirst',
    },
    mutations: {
      networkMode: 'offlineFirst',
    }
  },
});
