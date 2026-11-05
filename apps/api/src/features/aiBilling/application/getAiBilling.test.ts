import { describe, expect, it } from 'vitest';
import { getAiBilling } from './getAiBilling.js';
import type { AiBillingRepository, AiBillingSource } from './ports.js';

type AiBillingSnapshot = Awaited<ReturnType<AiBillingRepository['readMonth']>>;

const now = new Date('2026-10-31T17:01:00Z');
// CP5.6: chỉ nguồn OpenRouter; `n` phân biệt nhiều key cùng provider.
const source = (n: 1 | 2 | 3, changes = {}): AiBillingSource => ({
  id: `019a1111-1111-7111-8111-11111111111${n}`,
  provider: 'openrouter',
  status: 'complete',
  confirmedSpendUsd: '0.000000000000',
  lastAttemptAt: now.toISOString(),
  lastCompleteAt: now.toISOString(),
  ...changes,
});
const read = (sources: AiBillingSource[], confirmedSpendUsd = '0.000000000000') => {
  let month = '';
  const snapshot: AiBillingSnapshot = { sources, confirmedSpendUsd };
  return getAiBilling({
    repository: {
      readMonth: (value) => {
        month = value;
        return Promise.resolve(snapshot);
      },
    },
    now: () => now,
  }).then((view) => ({ view, month }));
};
describe('Tổng phí thực và mức đầy đủ nguồn', () => {
  it('TC-540: không có nguồn trả actual null và tháng Việt Nam', async () => {
    const { view, month } = await read([]);
    expect(month).toBe('2026-11');
    expect(view).toMatchObject({ month, status: 'unconfigured', actualSpendUsd: null });
  });
  it('TC-649: một nguồn OpenRouter đủ và mới là ready', async () => {
    expect((await read([source(1)])).view).toMatchObject({
      status: 'ready',
      actualSpendUsd: '0.000000000000',
    });
  });
  it('TC-540: thiếu một lần đồng bộ không được ready 0', async () => {
    expect((await read([source(1), source(2, { lastCompleteAt: null })])).view).toMatchObject({
      status: 'incomplete',
      actualSpendUsd: null,
    });
  });
  it.each([
    'gap',
    'error',
    'counter_reset',
    'credential_changed',
    'receipt_conflict',
    'missing_credential',
    'unverified',
  ] as const)('TC-540: nguồn %s không được tính là đủ', async (status) => {
    expect((await read([source(1), source(2, { status })])).view.status).toBe('incomplete');
  });
  it('TC-540: nguồn cũ hơn 180 giây trả stale và timestamp cũ nhất', async () => {
    const earlier = new Date(now.getTime() - 181_000).toISOString();
    expect((await read([source(1, { lastCompleteAt: earlier }), source(2)])).view).toMatchObject({
      status: 'stale',
      lastSyncedAt: earlier,
      actualSpendUsd: null,
    });
  });
  it('TC-540: mọi nguồn đủ và mới thì trả tổng chính xác từ SQL', async () => {
    const spend = '9007199254740993.123456789012';
    expect((await read([source(1), source(2)], spend)).view).toMatchObject({
      status: 'ready',
      actualSpendUsd: spend,
      confirmedSpendUsd: spend,
    });
  });
  it('TC-540: mốc đồng bộ ở tương lai không được ready', async () => {
    const future = new Date(now.getTime() + 1).toISOString();
    expect((await read([source(1), source(2, { lastCompleteAt: future })])).view).toMatchObject({
      status: 'incomplete',
      actualSpendUsd: null,
    });
  });
  it('TC-540: nguồn thứ ba lỗi làm tổng chưa đầy đủ', async () => {
    expect((await read([source(1), source(2), source(3, { status: 'error' })])).view.status).toBe(
      'incomplete',
    );
  });
});
