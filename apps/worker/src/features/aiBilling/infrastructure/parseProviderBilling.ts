import { z } from 'zod';
import type { ProviderCharge } from '../application/ports.js';
const quota = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const counterSchema = z.object({ code: z.literal(true), data: z.object({ total_used: quota }) });
const divisorSchema = z.object({ billing_quota_per_unit: quota.positive() });
const rowsSchema = z.object({ success: z.literal(true), data: z.array(z.unknown()).max(10_000) });
const rowSchema = z.object({
  id: z.union([quota, z.string().min(1).max(200)]),
  type: z.literal(2),
  created_at: quota.max(253402300799),
  quota,
  other: z.union([z.string().max(10_000), divisorSchema]),
});
export function parseWokuCounter(value: unknown): string {
  return String(counterSchema.parse(value).data.total_used);
}
export function parseWokuCharges(value: unknown): ProviderCharge[] {
  const rows = rowsSchema.parse(value).data;
  const charges = new Map<string, ProviderCharge>();
  for (const raw of rows) {
    if (!raw || typeof raw !== 'object' || !('type' in raw) || raw.type !== 2) continue;
    const row = rowSchema.parse(raw);
    const other = divisorSchema.parse(typeof row.other === 'string' ? JSON.parse(row.other) : row.other);
    const charge = {
      externalId: String(row.id),
      chargedAt: new Date(row.created_at * 1000),
      counterAmount: String(row.quota),
      unitDivisor: String(other.billing_quota_per_unit),
    };
    const existing = charges.get(charge.externalId);
    if (existing && JSON.stringify(existing) !== JSON.stringify(charge)) throw new Error('receipt_conflict');
    charges.set(charge.externalId, charge);
  }
  return [...charges.values()];
}
export function decimalCost(value: number): string {
  if (!Number.isFinite(value) || value < 0 || value > Number.MAX_SAFE_INTEGER)
    throw new Error('billing_invalid_decimal');
  const decimal = value.toFixed(12).replace(/\.?0+$/, '');
  if (Number(decimal || '0') !== value) throw new Error('billing_invalid_decimal');
  return decimal || '0';
}
export function parseOpenRouterCounter(value: unknown): string {
  return decimalCost(
    z.object({ data: z.object({ usage: z.number().nonnegative() }) }).parse(value).data.usage,
  );
}
