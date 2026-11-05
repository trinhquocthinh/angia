import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startAdminTestApp, type AdminTestApp } from '@src/shared/test/startAdminTestApp.js';

const openrouter = { primaryModel: 'moonshotai/kimi-k2.6', fallbackModel: 'google/gemini-3.1-flash-lite' };
const legacy = {
  selectedProvider: 'woku',
  woku: { primaryModel: 'gemini-3-flash-preview', fallbackModel: 'gemini-3.8-flash' },
  openrouter,
};
const migration = () =>
  readFile(new URL('../../../../drizzle/0032_remove_woku.sql', import.meta.url), 'utf8');

describe('Migration bỏ Woku (CP5.6)', () => {
  let t: AdminTestApp;
  beforeAll(async () => {
    t = await startAdminTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });

  it('TC-648: giữ model OpenRouter đã lưu, xóa nguồn/phí Woku, chặn provider woku; chạy lặp an toàn', async () => {
    const savedAt = '2026-10-28T08:00:00.000Z';
    await t.owner.query(
      'UPDATE ai_routing_settings SET version=2, settings=$1::jsonb, updated_at=$2, updated_by=$3 WHERE id=1',
      [JSON.stringify(legacy), savedAt, t.admin.accountId],
    );
    await t.owner.query('ALTER TABLE ai_billing_sources DROP CONSTRAINT ai_billing_sources_provider_valid');
    const [woku, kept] = [randomUUID(), randomUUID()];
    for (const [id, provider] of [
      [woku, 'woku'],
      [kept, 'openrouter'],
    ])
      await t.owner.query(
        'INSERT INTO ai_billing_sources(id,provider,credential_fingerprint) VALUES($1,$2,$3)',
        [id, provider, randomUUID()],
      );
    await t.owner.query(
      `INSERT INTO ai_provider_charges(source_id,external_id,charged_at,counter_amount,unit_divisor)
      VALUES($1,'log-1',now(),6543,500000)`,
      [woku],
    );
    await t.owner.query(await migration());
    await t.owner.query(await migration());
    const row = (await t.owner.query('SELECT * FROM ai_routing_settings WHERE id=1')).rows[0];
    expect(row).toMatchObject({ version: '2', settings: { openrouter }, updated_by: t.admin.accountId });
    expect(row.updated_at.toISOString()).toBe(savedAt);
    expect((await t.owner.query('SELECT id FROM ai_billing_sources')).rows).toEqual([{ id: kept }]);
    expect((await t.owner.query('SELECT count(*)::int AS n FROM ai_provider_charges')).rows[0].n).toBe(0);
    await expect(
      t.owner.query(
        "INSERT INTO ai_billing_sources(id,provider,credential_fingerprint) VALUES($1,'woku','x')",
        [randomUUID()],
      ),
    ).rejects.toMatchObject({ code: '23514' });
  });
});
