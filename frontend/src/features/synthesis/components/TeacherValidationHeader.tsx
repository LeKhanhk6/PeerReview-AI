import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { synthesisMessages } from '@/constants/messages/synthesis';
import type { SynthesisStatus } from '../types/synthesis.types';

interface TeacherValidationHeaderProps {
  status: SynthesisStatus;
  updatedBy?: string | null;
  updatedAt?: string;
  isApproving: boolean;
  onApprove: () => Promise<void>;
}

export const TeacherValidationHeader: React.FC<TeacherValidationHeaderProps> = ({
  status,
  updatedBy,
  updatedAt,
  isApproving,
  onApprove,
}) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const isApproved = status === 'APPROVED';
  const formattedUpdatedAt = updatedAt ? new Date(updatedAt).toLocaleString('vi-VN') : '';

  const getStatusBadge = () => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="px-3 py-1 text-xs font-black bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
            ✓ {synthesisMessages.status.approved}
          </span>
        );
      case 'REVIEWING':
        return (
          <span className="px-3 py-1 text-xs font-black bg-blue-100 text-blue-800 rounded-full border border-blue-300">
            ✏️ {synthesisMessages.status.reviewing}
          </span>
        );
      case 'DRAFT':
      default:
        return (
          <span className="px-3 py-1 text-xs font-black bg-gray-100 text-gray-700 rounded-full border border-gray-300">
            📝 {synthesisMessages.status.draft}
          </span>
        );
    }
  };

  const handleConfirmApprove = async () => {
    setIsConfirmOpen(false);
    await onApprove();
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-base font-bold text-gray-900">
                {synthesisMessages.validation.headerTitle}
              </h2>
              {getStatusBadge()}
            </div>

            <p className="text-xs text-gray-500 mt-1">
              {synthesisMessages.validation.headerSubtitle}
            </p>
          </div>

          {/* Approve Button */}
          <div className="relative group">
            <Button
              type="button"
              variant={isApproved ? 'secondary' : 'default'}
              disabled={isApproved || isApproving}
              isLoading={isApproving}
              onClick={() => setIsConfirmOpen(true)}
              className={isApproved ? '' : 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold'}
            >
              {isApproved
                ? `✓ ${synthesisMessages.validation.approveDisabledApproved}`
                : `✅ ${synthesisMessages.validation.approveButton}`}
            </Button>

            {/* Approved Disabled Tooltip */}
            {isApproved && (
              <span className="absolute right-0 -bottom-8 hidden group-hover:block z-10 whitespace-nowrap bg-gray-900 text-white text-[11px] px-2 py-1 rounded shadow-lg">
                {synthesisMessages.status.approvedTooltip}
              </span>
            )}
          </div>
        </div>

        {/* Audit Trail Footer Header */}
        {updatedAt && (
          <div className="text-[11px] text-gray-500 border-t border-gray-100 pt-2 flex flex-wrap justify-between items-center gap-2">
            <span>
              🕒 {synthesisMessages.itemCard.updatedAt} <strong>{formattedUpdatedAt}</strong>
            </span>
            {updatedBy && (
              <span>
                👤 {synthesisMessages.itemCard.updatedBy} <strong>{updatedBy}</strong>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Red Destructive Confirm Dialog */}
      <ConfirmDialog
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmApprove}
        title={synthesisMessages.validation.confirmApproveTitle}
        description={synthesisMessages.validation.confirmApproveDescription}
        isDestructive={true}
      />

    </>
  );
};
