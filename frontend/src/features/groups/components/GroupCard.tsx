import React, { useState } from 'react';
import type { Group, GroupMember } from '../types/group';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useRemoveMember, useAssignLeader } from '../hooks/useGroups';
import { Crown, UserPlus, UserX, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

interface GroupCardProps {
  group: Group;
  classId: string;
  assignedUserIds: Set<string>;
  onAddMemberClick: (group: Group) => void;
}

export const GroupCard: React.FC<GroupCardProps> = ({
  group,
  classId,
  assignedUserIds,
  onAddMemberClick,
}) => {
  const removeMember = useRemoveMember(classId);
  const assignLeader = useAssignLeader(classId);

  const [memberToRemove, setMemberToRemove] = useState<GroupMember | null>(null);
  const [assigningLeaderUserId, setAssigningLeaderUserId] = useState<string | null>(null);

  const handleConfirmRemove = async () => {
    if (!memberToRemove) return;
    try {
      await removeMember.mutateAsync({ groupId: group.id, userId: memberToRemove.id });
      toast.success(`Removed ${memberToRemove.full_name} from group`);
      setMemberToRemove(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove member');
    }
  };

  const handleAssignLeader = async (member: GroupMember) => {
    if (member.is_leader) return;
    setAssigningLeaderUserId(member.id);
    try {
      await assignLeader.mutateAsync({ groupId: group.id, user_id: member.id });
      toast.success(`Set ${member.full_name} as Group Leader`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign leader');
    } finally {
      setAssigningLeaderUserId(null);
    }
  };

  const leader = group.members?.find((m) => m.is_leader);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
        <div>
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            {group.name}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {group.members?.length || 0} Member{(group.members?.length || 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAddMemberClick(group)}
          className="gap-1.5 text-xs h-8"
          aria-label={`Add member to ${group.name}`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          Add Member
        </Button>
      </div>

      {/* Leader Banner */}
      <div className="px-5 py-2.5 bg-amber-50/60 border-b border-amber-100 flex items-center justify-between text-xs text-amber-900">
        <span className="font-medium flex items-center gap-1.5">
          <Crown className="w-4 h-4 text-amber-600 fill-amber-400" />
          Leader:
        </span>
        {leader ? (
          <span className="font-semibold">{leader.full_name}</span>
        ) : (
          <span className="italic text-amber-700/70">No leader assigned</span>
        )}
      </div>

      {/* Member List */}
      <div className="p-5 flex-1 space-y-3">
        {group.members && group.members.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {group.members.map((member) => (
              <li key={member.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                    {member.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate flex items-center gap-1.5">
                      {member.full_name}
                      {member.is_leader && (
                        <Crown
                          className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0"
                          aria-label="Group Leader"
                        />
                      )}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{member.email}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {!member.is_leader && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAssignLeader(member)}
                      isLoading={assigningLeaderUserId === member.id}
                      className="text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-50 h-7 px-2"
                      title="Set as Group Leader"
                      aria-label={`Set ${member.full_name} as Group Leader`}
                    >
                      Make Leader
                    </Button>
                  )}
                  <button
                    onClick={() => setMemberToRemove(member)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Remove from group"
                    aria-label={`Remove ${member.full_name} from group`}
                  >
                    <UserX className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-6 text-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg">
            No members in this group yet. Click "Add Member" to assign students.
          </div>
        )}
      </div>

      {/* Remove Confirm Dialog */}
      <ConfirmDialog
        open={Boolean(memberToRemove)}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleConfirmRemove}
        title="Remove Member from Group"
        description={`Are you sure you want to remove ${memberToRemove?.full_name} from ${group.name}? They will become available to be assigned to another group.`}
        isDestructive
        isLoading={removeMember.isPending}
      />
    </div>
  );
};
