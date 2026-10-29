import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createSanitizePgFixture } from '@src/shared/test/createSanitizePgFixture.test-helper.js';
import { createBillingRepository } from './createBillingRepository.js';
import type { BillingSource } from '../application/ports.js';
let fixture: Awaited<ReturnType<typeof createSanitizePgFixture>>;
beforeAll(async () => {
  fixture = await createSanitizePgFixture();
});
afterAll(async () => {
  await fixture?.close();
});
const source = (): BillingSource => ({ id: randomUUID(), provider: 'openrouter', apiKey: randomUUID() });
const charge = (externalId: string, counterAmount = '20') => ({
  externalId,
  chargedAt: new Date('2026-09-30T17:01:00Z'),
  counterAmount,
  unitDivisor: '100',
});
const status = async (id: string) =>
  (await fixture.owner.query('SELECT * FROM ai_billing_sources WHERE id=$1', [id])).rows[0];
describe('Sổ phí toàn cục PostgreSQL', () => {
  it('TC-543: nhập lặp không nhân đôi; log về muộn giữ ngày phí gốc và đóng gap', async () => {
    const repo = createBillingRepository(fixture.pool);
    const a = source();
    await repo.register([a]);
    const first = (await repo.claim(a.id))!;
    await repo.finish(first, { counter: '20', charges: [] });
    expect((await status(a.id)).status).toBe('gap');
    const second = (await repo.claim(a.id))!;
    await repo.finish(second, { counter: '20', charges: [charge('1'), charge('1')] });
    expect((await status(a.id)).status).toBe('complete');
    const rows = (await fixture.owner.query('SELECT * FROM ai_provider_charges WHERE source_id=$1', [a.id]))
      .rows;
    expect(rows).toHaveLength(1);
    expect(rows[0].charged_at).toEqual(charge('1').chargedAt);
  });
  it('TC-543: receipt xung đột, reset đồng hồ và key đổi là trạng thái dính', async () => {
    const repo = createBillingRepository(fixture.pool);
    const a = source();
    await repo.register([a]);
    await repo.finish((await repo.claim(a.id))!, { counter: '20', charges: [charge('1')] });
    await repo.finish((await repo.claim(a.id))!, { counter: '21', charges: [charge('1', '21')] });
    expect((await status(a.id)).status).toBe('receipt_conflict');
    await repo.register([a]);
    expect(await repo.claim(a.id)).toBeNull();
    const b = source();
    await repo.register([b]);
    await repo.finish((await repo.claim(b.id))!, { counter: '20', charges: [charge('1')] });
    await repo.finish((await repo.claim(b.id))!, { counter: '19', charges: [] });
    expect((await status(b.id)).status).toBe('counter_reset');
    const c = source();
    await repo.register([c]);
    const fingerprint = (await status(c.id)).credential_fingerprint;
    await repo.register([{ ...c, apiKey: 'changed' }]);
    expect(await status(c.id)).toMatchObject({
      status: 'credential_changed',
      credential_fingerprint: fingerprint,
    });
  });
  it('TC-543: lease cũ không ghi đè thành công/lỗi của lease mới hoặc ghi receipt', async () => {
    const repo = createBillingRepository(fixture.pool);
    const a = source();
    await repo.register([a]);
    const old = (await repo.claim(a.id))!;
    expect(await repo.claim(a.id)).toBeNull();
    await fixture.owner.query(
      "UPDATE ai_billing_sources SET lease_expires_at=now()-interval '1 second' WHERE id=$1",
      [a.id],
    );
    const current = (await repo.claim(a.id))!;
    await repo.finish(current, { counter: '0', charges: [] });
    await repo.finish(old, { counter: '20', charges: [charge('old')] });
    await repo.fail(old, 'error');
    expect(await status(a.id)).toMatchObject({ status: 'complete', last_counter: '0.000000000000' });
    expect(
      (await fixture.owner.query('SELECT * FROM ai_provider_charges WHERE source_id=$1', [a.id])).rowCount,
    ).toBe(0);
  });
  it('TC-543: observer khớp key, dedupe và đánh dấu thiếu credential mà giữ lịch sử', async () => {
    const repo = createBillingRepository(fixture.pool);
    const a = { ...source(), provider: 'openrouter' as const };
    await repo.observe(a, { ...charge('or'), unitDivisor: '1', counterAmount: '0.3' });
    await repo.observe(a, { ...charge('or'), unitDivisor: '1', counterAmount: '0.3' });
    await repo.finish((await repo.claim(a.id))!, { counter: '0.3', charges: [] });
    expect((await status(a.id)).status).toBe('complete');
    await repo.register([]);
    expect((await status(a.id)).status).toBe('missing_credential');
    expect(
      (await fixture.owner.query('SELECT * FROM ai_provider_charges WHERE source_id=$1', [a.id])).rowCount,
    ).toBe(1);
  });
});

it('TC-543: đổi UUID cùng credential bị từ chối, không gán lại nguồn hoặc nhân đôi lịch sử', async () => {
  const repo = createBillingRepository(fixture.pool);
  const a = source();
  await repo.register([a]);
  await repo.finish((await repo.claim(a.id))!, { counter: '20', charges: [charge('stable')] });
  const before = await status(a.id);
  const b = { ...a, id: randomUUID() };
  await expect(repo.register([b])).rejects.toThrow('billing_registration_failed');
  expect(await status(a.id)).toEqual(before);
  expect(await status(b.id)).toBeUndefined();
  expect(
    (
      await fixture.owner.query('SELECT * FROM ai_provider_charges WHERE source_id=ANY($1::uuid[])', [
        [a.id, b.id],
      ])
    ).rowCount,
  ).toBe(1);
});
