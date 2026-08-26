import { queryClient } from './queryClient';

/**
 * Thống nhất Recovery Strategy chung:
 * 1. Reset query cache
 * 2. Redirect safe route
 * 3. Reload last resort
 */
export function executeRecoveryStrategy(safeRoute: string = '/') {
  try {
    // 1. Reset query cache
    queryClient.resetQueries();

    // 2. Redirect to safe route
    if (window.location.pathname !== safeRoute) {
      window.location.href = safeRoute;
    } else {
      // 3. Reload last resort if already on safe route
      window.location.reload();
    }
  } catch (error) {
    // Fallback if anything above fails
    console.error('Recovery strategy failed, forcing reload', error);
    window.location.reload();
  }
}
