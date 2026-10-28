import { z } from 'zod';
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
