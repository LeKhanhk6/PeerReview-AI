import { delay, http, HttpResponse } from 'msw';

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

/**
 * Wraps an MSW handler to simulate network delay.
 * Useful for testing loading states (Loading Spinners, Skeletons).
 */
export const withDelay = (
  method: HttpMethod,
  path: string,
  responseResolver: Parameters<typeof http.get>[1],
  ms = 1000
) => {
  return http[method](path, async (info) => {
    await delay(ms);
    return responseResolver(info);
  });
};

/**
 * Wraps an MSW handler to simulate a server error (500) or other error states.
 * Useful for testing Error Boundaries and Global Error Toasts.
 */
export const withError = (
  method: HttpMethod,
  path: string,
  status = 500,
  message = 'Internal Server Error (Mocked)'
) => {
  return http[method](path, () => {
    return HttpResponse.json(
      { success: false, message },
      { status }
    );
  });
};
