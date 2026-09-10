import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useJoinClass } from '../hooks/useClasses';
import { toast } from 'sonner';

const schema = z.object({
  invite_code: z.string().min(6, 'Mã mời phải có ít nhất 6 ký tự').trim(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
}

export const JoinClassDialog: React.FC<Props> = ({ open, onClose }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });
  const joinClass = useJoinClass();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset input form and validation errors whenever dialog opens or closes
  useEffect(() => {
    if (open) {
      reset();
    }
  }, [open, reset]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const normalizedCode = data.invite_code.toUpperCase().trim();
      await joinClass.mutateAsync(normalizedCode);
      toast.success('Tham gia lớp học thành công!');
      reset();
      onClose();
    } catch (error: any) {
      const errMsg = error?.response?.data?.message || error?.message || 'Không thể tham gia lớp học';
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} title="Tham gia Lớp học (Mã Invite)">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Mã mời Lớp học (Invite Code) *
          </label>
          <input
            {...register('invite_code')}
            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm uppercase font-mono tracking-wider text-slate-800"
            placeholder="Nhập mã 6 ký tự (Ví dụ: SE301TEST)"
            disabled={isSubmitting}
          />
          {errors.invite_code && (
            <p className="mt-1.5 text-xs font-semibold text-red-600 flex items-center gap-1">
              ⚠️ {errors.invite_code.message}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Hủy bỏ
          </Button>
          <Button type="submit" isLoading={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs">
            Tham gia Lớp
          </Button>
        </div>
      </form>
    </Dialog>
  );
};

