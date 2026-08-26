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

api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Unwrap { success, data } if the backend follows this format
    if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
      return response.data.data;
    }
    return response.data;
  },
  (error: AxiosError<any>) => {
    const status = error.response?.status || 500;
    const responseData = error.response?.data || {};
    
    // Normalize error to { code, message, status }
    const normalizedError: ApiError = {
      code: responseData.code || 'UNKNOWN_ERROR',
      message: responseData.message || error.message || 'An unexpected error occurred',
      status: status,
    };
    
    console.error(`[API Error] ${status}: ${normalizedError.message}`, normalizedError);

    // Full 401 handling
    if (status === 401) {
      const originalRequest = error.config;
      // Do not redirect if it's the login route or the initial hydration check
      if (originalRequest && !originalRequest.url?.includes('/auth/login') && !originalRequest.url?.includes('/auth/me')) {
        // Clear auth state
        useAuthStore.getState().setUser(null);
        // Redirect to login to prevent loops
        window.location.href = '/login';
      }
    }

    return Promise.reject(normalizedError);
  }
);
