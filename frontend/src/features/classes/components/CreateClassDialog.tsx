import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useCreateClass } from '../hooks/useClasses';
import { toast } from 'sonner';

import { Loader2 } from 'lucide-react';

const schema = z.object({
  course_code: z.string().min(1, 'Mã môn học là bắt buộc').max(50),
  course_name: z.string().min(1, 'Tên môn học là bắt buộc').max(255),
  name: z.string().min(1, 'Mã lớp là bắt buộc').max(255),
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
      toast.success('Tạo lớp học thành công');
      reset();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Không thể tạo lớp học');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Tạo Lớp Học Mới">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
        <div>
          <label className="block text-sm font-bold text-slate-700">Mã môn học <span className="text-rose-500">*</span></label>
          <input
            {...register('course_code')}
            className={`mt-1 block w-full border ${errors.course_code ? 'border-rose-300 text-rose-900 focus:ring-rose-500' : 'border-slate-200 focus:ring-brand-primary focus:border-brand-primary'} rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 sm:text-sm transition-colors`}
            placeholder="VD: INT3306"
          />
          {errors.course_code && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.course_code.message}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-bold text-slate-700">Tên môn học <span className="text-rose-500">*</span></label>
          <input
            {...register('course_name')}
            className={`mt-1 block w-full border ${errors.course_name ? 'border-rose-300 text-rose-900 focus:ring-rose-500' : 'border-slate-200 focus:ring-brand-primary focus:border-brand-primary'} rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 sm:text-sm transition-colors`}
            placeholder="VD: Phát triển Ứng dụng Web"
          />
          {errors.course_name && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.course_name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700">Mã lớp <span className="text-rose-500">*</span></label>
          <input
            {...register('name')}
            className={`mt-1 block w-full border ${errors.name ? 'border-rose-300 text-rose-900 focus:ring-rose-500' : 'border-slate-200 focus:ring-brand-primary focus:border-brand-primary'} rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 sm:text-sm transition-colors`}
            placeholder="VD: L02"
          />
          {errors.name && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700">Học kỳ</label>
          <input
            {...register('semester')}
            className={`mt-1 block w-full border ${errors.semester ? 'border-rose-300 text-rose-900 focus:ring-rose-500' : 'border-slate-200 focus:ring-brand-primary focus:border-brand-primary'} rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 sm:text-sm transition-colors`}
            placeholder="VD: HK1 2025-2026"
          />
          {errors.semester && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.semester.message}</p>}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...
              </span>
            ) : (
              'Tạo lớp học'
            )}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
