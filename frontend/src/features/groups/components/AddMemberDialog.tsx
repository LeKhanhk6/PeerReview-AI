import React, { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useClassMembers } from '@/features/classes/hooks/useClasses';
import { useAddMember } from '../hooks/useGroups';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onClose: () => void;
  classId: string;
  groupId: string;
  assignedUserIds: Set<string>;
}

export const AddMemberDialog: React.FC<Props> = ({ open, onClose, classId, groupId, assignedUserIds }) => {
  const { data: members, isLoading } = useClassMembers(classId);
  const addMember = useAddMember(classId);
  const [selectedUserId, setSelectedUserId] = useState('');

  const unassignedMembers = (members || []).filter((m) => !assignedUserIds.has(m.id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      toast.error('Please select a student');
      return;
    }

    try {
      await addMember.mutateAsync({ groupId, user_id: selectedUserId });
      toast.success('Member added to group');
      setSelectedUserId('');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add member to group');
    }
  };

  const handleClose = () => {
    setSelectedUserId('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Add Member to Group"
      description="Select an unassigned student from this class to add to the group."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="select-student" className="block text-sm font-medium text-gray-700 mb-1">
            Student
          </label>
          {isLoading ? (
            <div className="text-sm text-gray-500 py-2" aria-busy="true">Loading class members...</div>
          ) : unassignedMembers.length === 0 ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800">
              All enrolled students in this class have already been assigned to groups.
            </div>
          ) : (
            <select
              id="select-student"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
              disabled={addMember.isPending}
            >
              <option value="">-- Select a Student --</option>
              {unassignedMembers.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.full_name} ({student.email}){student.student_id ? ` - ${student.student_id}` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={handleClose} disabled={addMember.isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={addMember.isPending}
            disabled={unassignedMembers.length === 0 || !selectedUserId || addMember.isPending}
          >
            Add Member
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
