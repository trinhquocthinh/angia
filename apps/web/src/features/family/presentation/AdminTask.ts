import type { Account } from '../application/ports';

export type AdminTask = { kind: 'create' } | { kind: 'assign' | 'role' | 'remove'; account: Account };
