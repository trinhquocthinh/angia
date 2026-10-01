import type { DependencyStatus, HealthReport } from './HealthReport.js';

// Hệ thống chỉ "ok" khi mọi phụ thuộc hạ tầng đều phản hồi.
export function summarizeHealth(db: DependencyStatus, storage: DependencyStatus): HealthReport {
  const status = db === 'ok' && storage === 'ok' ? 'ok' : 'degraded';
  return { status, db, storage };
}
