import React, { useState, cloneElement } from 'react';
import type { ReactElement } from 'react';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { layoutMessages } from '../../../constants/messages/layout';

interface AdminActionGuardProps {
  auditEnabled?: boolean;
  title: string;
  description?: string;
  onConfirm: () => void;
  children: ReactElement<any>;
  isDestructive?: boolean;
}

export const AdminActionGuard: React.FC<AdminActionGuardProps> = ({
  auditEnabled,
  title,
  description,
  onConfirm,
  children,
  isDestructive = true,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const isAuditLoading = auditEnabled === undefined;
  const isAuditDisabled = auditEnabled === false;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isAuditLoading || isAuditDisabled) {
      return;
    }
    
    setIsDialogOpen(true);
  };

  const handleConfirm = () => {
    setIsDialogOpen(false);
    onConfirm();
  };

  // Determine tooltip or title
  let wrapperTitle = children.props.title || '';
  if (isAuditDisabled) {
    wrapperTitle = `${layoutMessages.admin.actionGuard.lockedTitle} (${layoutMessages.admin.actionGuard.lockedDesc})`;
  }

  const modifiedChild = cloneElement(children, {
    onClick: handleClick,
    disabled: children.props.disabled || isAuditLoading || isAuditDisabled,
    title: wrapperTitle,
    className: `${children.props.className || ''} ${isAuditDisabled ? 'opacity-50 cursor-not-allowed' : ''}`.trim(),
  } as React.HTMLAttributes<HTMLElement> & { disabled?: boolean });

  return (
    <>
      {modifiedChild}
      {auditEnabled === true && (
        <ConfirmDialog
          open={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onConfirm={handleConfirm}
          title={title}
          description={description}
          isDestructive={isDestructive}
        />
      )}
    </>
  );
};
