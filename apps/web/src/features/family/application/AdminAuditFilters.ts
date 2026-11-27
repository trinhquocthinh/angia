import type { AdminAuditAction } from './ports';
export type AdminAuditFilters = {
  from: string;
  to: string;
  familyId: string;
  accountId: string;
  action: AdminAuditAction | '';
};
export type AdminAuditFilterErrors = Partial<Record<'dates' | 'familyId' | 'accountId', string>>;
export const emptyAdminAuditFilters: AdminAuditFilters = {
  from: '',
  to: '',
  familyId: '',
  accountId: '',
  action: '',
};
