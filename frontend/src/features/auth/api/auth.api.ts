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
