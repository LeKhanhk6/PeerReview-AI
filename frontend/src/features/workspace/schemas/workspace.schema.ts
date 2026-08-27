import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Tên công việc không được để trống.')
    .max(255, 'Tên công việc không quá 255 ký tự.')
    .trim(),
  assignee_id: z.string().nullable().optional(),
});

export const createDiscussionSchema = z.object({
  message: z.string().min(1, 'Nội dung tin nhắn không được để trống.').trim(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type CreateDiscussionInput = z.infer<typeof createDiscussionSchema>;
