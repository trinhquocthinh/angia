import type { Account, AdminCommand, Family } from '../application/ports';
import type { AdminTask } from './AdminTask';

export interface AdminDialogProps {
  task: AdminTask;
  families: Family[];
  accounts: Account[];
  pending: boolean;
  error: Error | null;
  onSubmit: (command: AdminCommand) => void;
  onClose: () => void;
}
