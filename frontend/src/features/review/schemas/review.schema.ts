import { z } from 'zod';
import type { RubricCriterionDetail } from '../types/review.types';

export const createSubmitReviewSchema = (criteriaList: RubricCriterionDetail[]) => {
  return z.object({
    overallComment: z
      .string()
      .trim()
      .min(1, 'Vui lòng nhập nhận xét tổng quan')
      .max(2000, 'Nhận xét tổng quan không được vượt quá 2000 ký tự'),
    criteriaScores: z
      .array(
        z.object({
          criteriaId: z.string().uuid('ID tiêu chí không hợp lệ'),
          score: z.coerce.number().min(0, 'Điểm số không được nhỏ hơn 0'),
          comment: z.string().max(1000, 'Nhận xét tiêu chí tối đa 1000 ký tự').optional(),
        })
      )
      .min(criteriaList.length, 'Vui lòng chấm điểm đầy đủ tất cả các tiêu chí')
      .max(criteriaList.length, 'Số lượng tiêu chí không khớp')
      .superRefine((scores, ctx) => {
        criteriaList.forEach((criterion) => {
          const item = scores.find((s) => s.criteriaId === criterion.id);
          if (!item) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Chưa chấm điểm cho tiêu chí "${criterion.name}"`,
            });
          } else if (item.score > criterion.weight) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Điểm số cho "${criterion.name}" không được vượt quá trọng số tối đa (${criterion.weight})`,
            });
          }
        });
      }),
  });
};
