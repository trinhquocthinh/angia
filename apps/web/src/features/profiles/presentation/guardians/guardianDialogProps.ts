import type { ReactNode } from 'react';

export type GuardianDialogProps = {
  title: string;
  closeLabel: string;
  pending: boolean;
  error: string | null;
  confirmLabel: string;
  confirmTone: 'primary' | 'danger';
  confirmDisabled: boolean;
  onClose: () => void;
  onConfirm: () => void;
  children: ReactNode;
};
