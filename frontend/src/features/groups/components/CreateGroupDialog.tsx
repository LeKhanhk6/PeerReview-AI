import React, { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useCreateGroup } from '../hooks/useGroups';
import { toast } from 'sonner';
import { z } from 'zod';

const groupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(100, 'Group name cannot exceed 100 characters').trim(),
});

interface Props {
  open: boolean;
  onClose: () => void;
  classId: string;
}

export const CreateGroupDialog: React.FC<Props> = ({ open, onClose, classId }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const createGroup = useCreateGroup(classId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = groupSchema.safeParse({ name });
    if (!validation.success) {
      setError(validation.error.errors[0]?.message || 'Invalid group name');
      return;
    }

    try {
      await createGroup.mutateAsync({ class_id: classId, name: validation.data.name });
      toast.success('Group created successfully');
      setName('');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create group');
    }
  };

  const handleClose = () => {
    setName('');
    setError(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Create New Group"
      description="Create a new study group for this class."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="group-name" className="block text-sm font-medium text-gray-700 mb-1">
            Group Name
          </label>
          <input
            id="group-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="e.g. Group 1 - Web Dev"
            disabled={createGroup.isPending}
            autoFocus
          />
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={handleClose} disabled={createGroup.isPending}>
            Cancel
          </Button>
          <Button type="submit" isLoading={createGroup.isPending}>
            Create Group
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
