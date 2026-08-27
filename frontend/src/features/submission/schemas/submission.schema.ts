import { z } from 'zod';

export const submitAssignmentSchema = z.object({
  file_url: z
    .string()
    .url('Đường dẫn tệp bài nộp phải là một URL hợp lệ.')
    .refine(
      (val) => {
        const allowedDomains = [
          's3.amazonaws.com',
          'firebaseapp.com',
          'googleapis.com',
          'storage.googleapis.com',
          'blob:',
        ];
        try {
          if (val.startsWith('blob:')) return true;
          const hostname = new URL(val).hostname;
          return allowedDomains.some((d) => hostname.endsWith(d) || hostname === d);
        } catch {
          return false;
        }
      },
      { message: 'Tệp nộp bài phải thuộc domain lưu trữ đám mây hợp lệ (Google Storage, S3, Firebase).' }
    ),
});

export type SubmitAssignmentInput = z.infer<typeof submitAssignmentSchema>;
