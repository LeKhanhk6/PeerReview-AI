import React, { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { adminMessages } from '@/constants/messages/admin';
import type { AdminUserItem, UserRole } from '../types/admin.types';

interface UserRoleModalProps {
  user: AdminUserItem | null;
  isOpen: boolean;
  isUpdating: boolean;
  onClose: () => void;
  onConfirmRoleChange: (userId: string, newRole: UserRole) => Promise<void>;
}

export const UserRoleModal: React.FC<UserRoleModalProps> = ({
  user,
  isOpen,
  isUpdating,
  onClose,
  onConfirmRoleChange,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('STUDENT');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  React.useEffect(() => {
    if (user) {
      setSelectedRole(user.role);
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole === user.role) return;
    setIsConfirmOpen(true);
  };

  const handleFinalConfirm = async () => {
    setIsConfirmOpen(false);
    await onConfirmRoleChange(user.id, selectedRole);
    onClose();
  };

  return (
    <>
      <Dialog
        open={isOpen}
        onClose={isUpdating ? () => {} : onClose}
        title={adminMessages.userRoleModal.title}
        description={adminMessages.userRoleModal.subtitle}
      >
        <form onSubmit={handleOpenConfirm} className="space-y-4 pt-2">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1">
            <p className="text-xs text-gray-500">Tài khoản đang chọn:</p>
            <p className="text-sm font-bold text-gray-900">{user.fullName}</p>
            <p className="text-xs text-gray-600">{user.email}</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {adminMessages.userRoleModal.selectRoleLabel}
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
              disabled={isUpdating}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="STUDENT">{adminMessages.roles.STUDENT} (STUDENT)</option>
              <option value="TEACHER">{adminMessages.roles.TEACHER} (TEACHER)</option>
              <option value="ADMIN">{adminMessages.roles.ADMIN} (ADMIN)</option>
            </select>
          </div>

          {/* Consequence warning */}
          <div className="bg-amber-50 border-l-2 border-amber-400 p-2.5 rounded-r text-xs text-amber-900 font-medium">
            {adminMessages.userRoleModal.consequencesWarning}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isUpdating}
            >
              {adminMessages.userRoleModal.cancelBtn}
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              disabled={selectedRole === user.role || isUpdating}
              isLoading={isUpdating}
            >
              {adminMessages.userRoleModal.confirmBtn}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleFinalConfirm}
        title={adminMessages.userRoleModal.confirmTitle}
        description={adminMessages.userRoleModal.confirmDesc}
        isDestructive={false}
      />
    </>
  );
};
