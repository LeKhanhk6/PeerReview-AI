import { api } from '@/lib/axios';
import type {
  Assignment,
  CreateAssignmentInput,
  UpdateAssignmentInput,
  SaveRubricInput,
  Rubric,
  AssignmentFilterParams,
} from '../types/assignment.types';

export const assignmentApi = {
  // Lấy danh sách Lớp học để hiển thị trên Class Selector
  getClasses: async (): Promise<any[]> => {
    const res: any = await api.get('/classes');
    // Normalize response formats (direct array or paginated response)
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    return [];
  },

  // Lấy danh sách Bài tập
  getAssignments: async (params?: AssignmentFilterParams): Promise<{ data: Assignment[]; pagination?: any }> => {
    const res: any = await api.get('/assignments', { params });
    if (Array.isArray(res)) {
      return { data: res };
    }
    return res || { data: [] };
  },

  // Lấy chi tiết Bài tập
  getAssignmentById: async (id: string): Promise<Assignment> => {
    const res: any = await api.get(`/assignments/${id}`);
    return res.data || res;
  },

  // Tạo mới Bài tập
  createAssignment: async (input: CreateAssignmentInput): Promise<Assignment> => {
    const res: any = await api.post('/assignments', input);
    return res.data || res;
  },

  // Cập nhật Bài tập
  updateAssignment: async ({ id, data }: { id: string; data: UpdateAssignmentInput }): Promise<Assignment> => {
    const res: any = await api.put(`/assignments/${id}`, data);
    return res.data || res;
  },

  // Xóa Bài tập
  deleteAssignment: async (id: string): Promise<any> => {
    return api.delete(`/assignments/${id}`);
  },

  // Lấy Rubric của Bài tập
  getRubricByAssignment: async (assignmentId: string): Promise<Rubric | null> => {
    try {
      const res: any = await api.get(`/rubrics/assignment/${assignmentId}`);
      return res.data || res;
    } catch (err: any) {
      if (err?.status === 404 || err?.response?.status === 404) {
        return null;
      }
      throw err;
    }
  },

  // Upsert Rubric & Criteria (Tạo mới hoặc Cập nhật Rubric)
  saveRubric: async ({ assignmentId, data }: { assignmentId: string; data: SaveRubricInput }): Promise<Rubric> => {
    const res: any = await api.put(`/rubrics/assignment/${assignmentId}`, data);
    return res.data || res;
  },

  // TODO: Tích hợp thật với backend endpoint khi có dịch vụ file upload chuyên dụng (S3/Cloudinary/Supabase Storage)
  // Hiện tại AttachmentManager chạy trên UI state local & MSW simulated upload
  uploadAttachment: async (assignmentId: string, file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    const res: any = await api.post(`/assignments/${assignmentId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data || res;
  }
};
