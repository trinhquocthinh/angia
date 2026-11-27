import type { AdminAuditEvent, AdminAuditQuery } from '@angia/contracts';

interface AdminAuditPosition {
  at: string;
  id: string;
}
type AdminAuditFilter = Omit<AdminAuditQuery, 'cursor'> & { before?: AdminAuditPosition };
export interface AdminAuditRepository {
  list(filter: AdminAuditFilter): Promise<AdminAuditEvent[]>;
}
export interface AdminAuditDependencies {
  repository: AdminAuditRepository;
}
