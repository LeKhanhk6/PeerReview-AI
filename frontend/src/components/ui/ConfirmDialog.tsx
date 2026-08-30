import React, { useState } from 'react';
import { Dialog } from './Dialog';
import { Button } from './Button';
import { layoutMessages } from '../../constants/messages/layout';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  requireConfirmationText?: boolean;
  confirmationText?: string;
  children?: React.ReactNode;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  isDestructive = false,
  isLoading = false,
  requireConfirmationText = false,
  confirmationText = 'DELETE',
  children,
}) => {

  const [inputText, setInputText] = useState('');

  const handleConfirm = () => {
    if (requireConfirmationText && inputText !== confirmationText) {
      return;
    }
    onConfirm();
  };

  const isConfirmDisabled = requireConfirmationText && inputText !== confirmationText;

  // Reset input when dialog closes
  React.useEffect(() => {
    if (!open) {
      setInputText('');
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={isLoading ? () => {} : onClose}
      title={title}
      description={description}
      closeOnBackdrop={!isLoading}
      closeOnEscape={!isLoading}
    >
      <div className="space-y-6">
        {children}
        {requireConfirmationText && (

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {layoutMessages.admin.actionGuard.typeToConfirm.replace('DELETE', confirmationText)}
            </label>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder={confirmationText}
              disabled={isLoading}
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {layoutMessages.action.cancel}
          </Button>
          <Button
            variant={isDestructive ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={isConfirmDisabled || isLoading}
            isLoading={isLoading}
          >
            {layoutMessages.action.confirm}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
