import { api } from '@/lib/axios';
import type { User } from '../types';

export const loginApi = async (credentials: any): Promise<{ user: User, accessToken: string }> => {
  return api.post('/auth/login', credentials);
};

export const registerApi = async (data: any): Promise<{ user: User }> => {
  return api.post('/auth/register', data);
};

export const logoutApi = async (): Promise<void> => {
  return api.post('/auth/logout');
};

export const getMeApi = async (): Promise<{ user: User }> => {
  return api.get('/auth/me');
};

export const updateProfileApi = async (data: { full_name?: string; avatar_url?: string }): Promise<{ user: User }> => {
  return api.patch('/auth/profile', data);
};

export const changePasswordApi = async (data: { current_password: string; new_password: string }): Promise<{ message: string }> => {
  return api.post('/auth/change-password', data);
};

export const forgotPasswordApi = async (email: string): Promise<{ message: string }> => {
  return api.post('/auth/forgot-password', { email });
};

export const resetPasswordApi = async (data: { token: string; password: string }): Promise<{ message: string }> => {
  return api.post('/auth/reset-password', data);
};
