import { api } from '@/lib/axios';
import type { Class, ClassMember, CreateClassDTO, UpdateClassDTO } from '../types';

export const classesApi = {
  getAll: (): Promise<Class[]> => {
    return api.get('/classes');
  },
  
  getById: (id: string): Promise<Class> => {
    return api.get(`/classes/${id}`);
  },
  
  create: (data: CreateClassDTO): Promise<Class> => {
    return api.post('/classes', data);
  },
  
  update: (id: string, data: UpdateClassDTO): Promise<Class> => {
    return api.put(`/classes/${id}`, data);
  },
  
  delete: (id: string): Promise<void> => {
    return api.delete(`/classes/${id}`);
  },
  
  getMembers: (id: string): Promise<ClassMember[]> => {
    return api.get(`/classes/${id}/members`);
  },
  
  join: (invite_code: string): Promise<any> => {
    return api.post('/classes/join', { invite_code });
  }
};
