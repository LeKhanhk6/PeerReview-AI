import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  closeOnEscape?: boolean;
  closeOnBackdrop?: boolean;
  title?: string;
  description?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  className?: string;
}

// Registry to keep track of open dialogs
const openDialogs: Set<HTMLElement> = new Set();

export const Dialog: React.FC<DialogProps> = ({
  open,
  onClose,
  children,
  closeOnEscape = true,
  closeOnBackdrop = true,
  title,
  description,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  className,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (open) {
      // Save the element that triggered the dialog
      triggerRef.current = document.activeElement as HTMLElement;

      if (dialogRef.current) {
        openDialogs.add(dialogRef.current);
        // Focus the dialog itself or its first focusable element
        dialogRef.current.focus();
      }

      // Prevent scrolling on the body
      document.body.style.overflow = 'hidden';
    } else {
      if (dialogRef.current) {
        openDialogs.delete(dialogRef.current);
      }
      
      if (openDialogs.size === 0) {
        document.body.style.overflow = '';
      }

      // Restore focus
      if (triggerRef.current && document.body.contains(triggerRef.current)) {
        triggerRef.current.focus();
      } else {
        // Fallback if trigger is unmounted
        document.body.focus();
      }
    }

    return () => {
      if (dialogRef.current) {
        openDialogs.delete(dialogRef.current);
      }
      if (openDialogs.size === 0) {
        document.body.style.overflow = '';
      }
    };
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open || !dialogRef.current) return;

      // Only handle events if this is the top-most dialog
      const dialogsArray = Array.from(openDialogs);
      if (dialogsArray[dialogsArray.length - 1] !== dialogRef.current) {
        return;
      }

      if (e.key === 'Escape' && closeOnEscape) {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        const focusableElements = dialogRef.current.querySelectorAll(
          'a[href], button:not([disabled]), textarea:not([disabled]), input[type="text"]:not([disabled]), input[type="radio"]:not([disabled]), input[type="checkbox"]:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) as NodeListOf<HTMLElement>;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement || document.activeElement === dialogRef.current) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, closeOnEscape]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnBackdrop) {
      onClose();
    }
  };

  if (!mounted || !open) return null;

  const content = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6"
      onClick={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel || title}
        aria-labelledby={ariaLabelledBy}
        tabIndex={-1}
        className={cn(
          "relative bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 focus:outline-none",
          className
        )}
      >
        {(title || description) && (
          <div className="px-6 py-5 border-b border-gray-100">
            {title && (
              <h2 className="text-xl font-semibold text-gray-900 pr-8">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-2 text-sm text-gray-600">
                {description}
              </p>
            )}
            {closeOnEscape && (
              <button
                onClick={onClose}
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};
