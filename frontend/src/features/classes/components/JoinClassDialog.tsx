import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useJoinClass } from '../hooks/useClasses';
import { toast } from 'sonner';

const schema = z.object({
  invite_code: z.string().min(6, 'Invite code must be at least 6 characters').trim(),
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

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      await joinClass.mutateAsync(data.invite_code);
      toast.success('Joined class successfully');
      reset();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to join class');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Join a Class">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Invite Code</label>
          <input
            {...register('invite_code')}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm uppercase"
            placeholder="Enter 6-character code"
          />
          {errors.invite_code && <p className="mt-1 text-sm text-red-600">{errors.invite_code.message}</p>}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Join
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
