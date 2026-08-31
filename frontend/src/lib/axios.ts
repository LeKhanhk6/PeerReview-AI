import axios, { type AxiosError, type AxiosResponse } from 'axios';
import { useAuthStore } from '../features/auth/store/authStore';

export interface ApiError {
  code: string;
  message: string;
  status: number;
}

// Create a configured axios instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Unwrap { data } if the backend follows this format, but keep pagination if it exists
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      if ('pagination' in response.data) {
        return {
          data: response.data.data,
          ...response.data.pagination
        };
      }
      return response.data.data;
    }
    return response.data;
  },
  (error: AxiosError<any>) => {
    const status = error.response?.status || 500;
    const responseData = error.response?.data || {};
    const errObj = responseData.error || responseData;
    
    // Normalize error to { code, message, status }
    const normalizedError: ApiError = {
      code: errObj.code || responseData.code || 'UNKNOWN_ERROR',
      message: errObj.message || responseData.message || error.message || 'An unexpected error occurred',
      status: status,
    };
    
    console.error(`[API Error] ${status}: ${normalizedError.message}`, normalizedError);

    // Full 401 & 403 ACCOUNT_LOCKED handling
    if (status === 401 || (status === 403 && (normalizedError.code === 'ACCOUNT_LOCKED' || normalizedError.code === 'USER_LOCKED'))) {
      const originalRequest = error.config;
      // Do not redirect if it's the login route or the initial hydration check
      if (originalRequest && !originalRequest.url?.includes('/auth/login') && !originalRequest.url?.includes('/auth/me')) {
        // Clear auth state
        useAuthStore.getState().setAuth(null, null);
        // Redirect to login to prevent loops
        window.location.href = '/login?reason=locked';
      }
    }

    return Promise.reject(normalizedError);
  }
);
