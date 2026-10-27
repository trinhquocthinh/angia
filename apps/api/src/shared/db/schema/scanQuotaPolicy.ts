import { sql } from 'drizzle-orm';
import { bigint, check, numeric, pgTable, smallint, timestamp, uuid } from 'drizzle-orm/pg-core';
import { accounts } from './accounts.js';
// Cấu hình toàn hệ thống giữ qua tháng; không có mặc định nghiệp vụ hay định danh gia đình.
export const scanQuotaPolicy = pgTable(
  'scan_quota_policy',
  {
    id: smallint('id').primaryKey(),
    version: bigint('version', { mode: 'number' }).notNull().default(0),
    estimatedCostPerScanUsd: numeric('estimated_cost_per_scan_usd'),
    reserveBasisPoints: smallint('reserve_basis_points'),
    trialScans: bigint('trial_scans', { mode: 'number' }),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
    updatedBy: uuid('updated_by').references(() => accounts.id),
  },
  (table) => [
    check('scan_quota_policy_singleton', sql`${table.id} = 1`),
    check('scan_quota_policy_version', sql`${table.version} BETWEEN 0 AND 9007199254740991`),
    check(
      'scan_quota_policy_settings',
      sql`(${table.estimatedCostPerScanUsd} IS NULL AND ${table.reserveBasisPoints} IS NULL AND ${table.trialScans} IS NULL) OR (${table.estimatedCostPerScanUsd} IS NOT NULL AND ${table.reserveBasisPoints} IS NOT NULL AND ${table.trialScans} IS NOT NULL AND ${table.estimatedCostPerScanUsd} > 0 AND scale(${table.estimatedCostPerScanUsd}) <= 12 AND ${table.estimatedCostPerScanUsd} < 10000000000000000000000000000 AND ${table.reserveBasisPoints} BETWEEN 0 AND 10000 AND ${table.trialScans} BETWEEN 0 AND 9007199254740991)`,
    ),
  ],
);
