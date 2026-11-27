import type { AdminAuditEvent, AdminAuditQuery } from '@angia/contracts';

export interface AdminAuditPosition {
  at: string;
  id: string;
}
export type AdminAuditFilter = Omit<AdminAuditQuery, 'cursor'> & { before?: AdminAuditPosition };
export interface AdminAuditRepository {
  list(filter: AdminAuditFilter): Promise<AdminAuditEvent[]>;
}
export interface AdminAuditDependencies {
  repository: AdminAuditRepository;
}
