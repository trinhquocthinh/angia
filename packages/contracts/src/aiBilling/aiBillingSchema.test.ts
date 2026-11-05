import { describe, expect, it } from 'vitest';
import { aiBillingViewSchema } from './aiBillingSchema.js';

const view = {
  month: '2026-10',
  unit: 'USD',
  status: 'unconfigured',
  confirmedSpendUsd: '0.000000000000',
  actualSpendUsd: null,
  lastSyncedAt: null,
  sources: [],
};
describe('Hợp đồng phí thực nhà cung cấp', () => {
  it('TC-538: chấp nhận trạng thái chưa cấu hình và tiền thập phân 12 chữ số', () => {
    expect(aiBillingViewSchema.parse(view)).toEqual(view);
  });
  it('TC-538: chặn secret, tiền âm, tháng sai và trạng thái không biết', () => {
    for (const invalid of [
      { ...view, apiKey: 'secret' },
      { ...view, confirmedSpendUsd: '-1.000000000000' },
      { ...view, month: '2026-13' },
      { ...view, status: 'unknown' },
    ])
      expect(aiBillingViewSchema.safeParse(invalid).success).toBe(false);
  });
});
