import type { Account, AdminCommand, Family } from '../application/ports';

export interface PendingAssignmentProps {
  account: Account;
  waiting: Account[];
  accounts: Account[];
  families: Family[];
  pending: boolean;
  error: Error | null;
  onSubmit: (command: AdminCommand) => void;
  onSelect: (id: string) => void;
}
