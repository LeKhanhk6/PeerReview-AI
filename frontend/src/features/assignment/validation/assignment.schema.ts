import { z } from 'zod';
import { assignmentMessages } from '@/constants/messages/assignment';

export const rubricCriteriaSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, { message: assignmentMessages.validation.criteriaNameRequired }).max(255),
  description: z.string().trim().optional().nullable(),
  weight: z.number({ message: assignmentMessages.validation.criteriaWeightPositive })
    .positive({ message: assignmentMessages.validation.criteriaWeightPositive }),
});

export const rubricSchema = z.object({
  description: z.string().trim().optional().nullable(),
  criteria: z.array(rubricCriteriaSchema)
    .min(1, { message: assignmentMessages.validation.atLeastOneCriteria })
    .refine(
      (items) => {
        const total = items.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
        return Math.abs(total - 100) < 0.01;
      },
      { message: assignmentMessages.validation.rubricTotalWeightMismatch }
    ),
});

export const createAssignmentSchema = z.object({
  class_id: z.string().uuid({ message: assignmentMessages.validation.classRequired }),
  title: z.string().trim().min(1, { message: assignmentMessages.validation.titleRequired }).max(255),
  description: z.string().trim().optional().nullable(),
  requirements: z.string().trim().optional().nullable(),
  deadline: z.string()
    .min(1, { message: assignmentMessages.validation.deadlineRequired })
    .refine((val) => {
      const d = new Date(val);
      return !isNaN(d.getTime()) && d > new Date();
    }, { message: assignmentMessages.validation.deadlineFuture }),
});

export const updateAssignmentSchema = z.object({
  title: z.string().trim().min(1, { message: assignmentMessages.validation.titleRequired }).max(255),
  description: z.string().trim().optional().nullable(),
  requirements: z.string().trim().optional().nullable(),
  deadline: z.string()
    .min(1, { message: assignmentMessages.validation.deadlineRequired })
    .refine((val) => {
      const d = new Date(val);
      return !isNaN(d.getTime()) && d > new Date();
    }, { message: assignmentMessages.validation.deadlineFuture }),
});

export type CreateAssignmentFormValues = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentFormValues = z.infer<typeof updateAssignmentSchema>;
export type RubricFormValues = z.infer<typeof rubricSchema>;
