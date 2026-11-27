import type { AdminAuditFilterErrors, AdminAuditFilters } from './AdminAuditFilters';
import type { AdminAuditQuery } from './ports';
import { isAdminUuid } from './isAdminUuid';
export function mapAdminAuditFilters(filters: AdminAuditFilters): {
  query: AdminAuditQuery | null;
  errors: AdminAuditFilterErrors;
} {
  const errors: AdminAuditFilterErrors = {};
  const query: AdminAuditQuery = { limit: 50 };
  for (const key of ['familyId', 'accountId'] as const) {
    const value = filters[key].trim();
    if (value && !isAdminUuid(value)) errors[key] = 'Mã không hợp lệ.';
    else if (value) query[key] = value;
  }
  for (const key of ['from', 'to'] as const) {
    const value = filters[key];
    if (!value) continue;
    const day = new Date(`${value}T00:00:00Z`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      !Number.isFinite(day.getTime()) ||
      day.toISOString().slice(0, 10) !== value
    ) {
      errors.dates = 'Khoảng ngày không hợp lệ.';
      continue;
    }
    // Giờ Việt Nam cố định UTC+7; cận trên loại trừ là đầu ngày kế tiếp.
    query[key] = new Date(day.getTime() - 7 * 3_600_000 + (key === 'to' ? 86_400_000 : 0)).toISOString();
  }
  if (filters.from && filters.to && filters.from > filters.to) errors.dates = 'Khoảng ngày không hợp lệ.';
  if (filters.action) query.action = filters.action;
  return { query: Object.keys(errors).length ? null : query, errors };
}
