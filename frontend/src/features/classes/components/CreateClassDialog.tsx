import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useCreateClass } from '../hooks/useClasses';
import { toast } from 'sonner';

const schema = z.object({
  course_code: z.string().min(1, 'Course code is required').max(50),
  course_name: z.string().min(1, 'Course name is required').max(255),
  name: z.string().min(1, 'Class name is required').max(255),
  semester: z.string().max(50).optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
}

export const CreateClassDialog: React.FC<Props> = ({ open, onClose }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });
  const createClass = useCreateClass();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      await createClass.mutateAsync(data);
      toast.success('Class created successfully');
      reset();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create class');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Create New Class">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Course Code</label>
          <input
            {...register('course_code')}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="e.g. CSC10001"
          />
          {errors.course_code && <p className="mt-1 text-sm text-red-600">{errors.course_code.message}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Course Name</label>
          <input
            {...register('course_name')}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="e.g. Data Structures and Algorithms"
          />
          {errors.course_name && <p className="mt-1 text-sm text-red-600">{errors.course_name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Class Name</label>
          <input
            {...register('name')}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="e.g. Class 01 - Group 2"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Semester</label>
          <input
            {...register('semester')}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="e.g. HK1 2025-2026"
          />
          {errors.semester && <p className="mt-1 text-sm text-red-600">{errors.semester.message}</p>}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Create Class
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
