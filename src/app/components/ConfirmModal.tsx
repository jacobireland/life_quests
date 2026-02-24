import React from 'react';
import { ScrollModal } from './ScrollModal';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  /** When true, confirm button uses destructive styling. */
  danger?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  title,
  children,
  confirmLabel,
  onConfirm,
  danger = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <ScrollModal isOpen onClose={onClose} title={title}>
      <p className="text-[#6b5344] text-sm mb-4">{children}</p>
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded border border-[#8b5a2b] text-[#3d1f05] bg-[#faf0dc] hover:bg-[#f5e6c0] transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          aria-label={confirmLabel}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            danger
              ? 'text-white bg-destructive hover:bg-destructive-hover'
              : 'text-white bg-[#b8860b] hover:brightness-110'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </ScrollModal>
  );
}
