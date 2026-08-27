import React, { useState, useMemo } from 'react';
import { useGroups } from '../hooks/useGroups';
import type { Group } from '../types/group';
import { GroupCard } from './GroupCard';
import { CreateGroupDialog } from './CreateGroupDialog';
import { AddMemberDialog } from './AddMemberDialog';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Plus, Users } from 'lucide-react';

interface GroupListProps {
  classId: string;
}

export const GroupList: React.FC<GroupListProps> = ({ classId }) => {
  const { data: groups, isLoading, error } = useGroups(classId);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedGroupForAdd, setSelectedGroupForAdd] = useState<Group | null>(null);

  // Compute set of user IDs already assigned to any group in this class
  const assignedUserIds = useMemo(() => {
    const set = new Set<string>();
    if (groups) {
      groups.forEach((g) => {
        g.members?.forEach((m) => {
          set.add(m.id);
        });
      });
    }
    return set;
  }, [groups]);

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="flex justify-between items-center mb-6">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-9 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-48 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">
        Failed to load groups for this class.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Study Groups ({groups?.length || 0})
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage study groups and assign group leaders for peer review assignments.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Group
        </Button>
      </div>

      {/* Grid */}
      {groups && groups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              classId={classId}
              assignedUserIds={assignedUserIds}
              onAddMemberClick={(g) => setSelectedGroupForAdd(g)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          type="no_data"
          title="No groups created yet"
          description="Create study groups for this class to start organizing students for peer review."
          actionLabel="Create Group"
          onAction={() => setIsCreateOpen(true)}
        />
      )}

      {/* Create Dialog */}
      <CreateGroupDialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        classId={classId}
      />

      {/* Add Member Dialog */}
      {selectedGroupForAdd && (
        <AddMemberDialog
          open={Boolean(selectedGroupForAdd)}
          onClose={() => setSelectedGroupForAdd(null)}
          classId={classId}
          groupId={selectedGroupForAdd.id}
          assignedUserIds={assignedUserIds}
        />
      )}
    </div>
  );
};
