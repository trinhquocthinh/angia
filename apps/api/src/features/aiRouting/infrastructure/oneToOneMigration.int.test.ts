import { readFile } from 'node:fs/promises';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DEFAULT_AI_ROUTING_SETTINGS } from '@angia/contracts';
import { startAdminTestApp, type AdminTestApp } from '@src/shared/test/startAdminTestApp.js';

const legacy = {
  ...DEFAULT_AI_ROUTING_SETTINGS,
  woku: { ...DEFAULT_AI_ROUTING_SETTINGS.woku, usdPerCredit: '0.25' },
};
const migration = () =>
  readFile(new URL('../../../../drizzle/0026_ai_routing_one_to_one.sql', import.meta.url), 'utf8');

describe('Migration quy ước ngân sách1:1, bảo toàn lịch sử', () => {
  let t: AdminTestApp;
  beforeAll(async () => {
    t = await startAdminTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });

  it('TC-536: bootstrap bỏ hệ số, giữ version0 và metadata null; chạy lặp không thay đổi', async () => {
    await t.owner.query(
      `UPDATE ai_routing_settings SET version=0, settings=$1::jsonb,
      updated_at=NULL, updated_by=NULL WHERE id=1`,
      [JSON.stringify(legacy)],
    );
    await t.owner.query(await migration());
    const row = (await t.owner.query('SELECT * FROM ai_routing_settings WHERE id=1')).rows[0];
    expect(row).toMatchObject({
      version: '0',
      settings: DEFAULT_AI_ROUTING_SETTINGS,
      updated_at: null,
      updated_by: null,
    });
    expect(row.settings).toEqual(DEFAULT_AI_ROUTING_SETTINGS);
    expect(row.settings.woku).not.toHaveProperty('usdPerCredit');
    await t.owner.query(await migration());
    expect((await t.owner.query('SELECT * FROM ai_routing_settings WHERE id=1')).rows[0]).toEqual(row);
  });

  it('TC-537: cấu hình đã lưu được chuẩn hóa, không giả actor/audit và không viết lại tiền cũ', async () => {
    await t.owner.query('DELETE FROM ai_routing_audit');
    const savedAt = '2026-10-26T08:00:00.000Z';
    await t.owner.query(
      `UPDATE ai_routing_settings SET version=1, settings=$1::jsonb,
      updated_at=$2, updated_by=$3 WHERE id=1`,
      [JSON.stringify(legacy), savedAt, t.admin.accountId],
    );
    await t.owner.query(
      `INSERT INTO ai_routing_audit (version,settings,updated_at,updated_by)
      VALUES (1,$1::jsonb,$2,$3)`,
      [JSON.stringify(legacy), savedAt, t.admin.accountId],
    );
    await t.owner.query(`INSERT INTO extraction_spend (month,cap_usd,spent_usd) VALUES ('2026-09',5,1.25)
      ON CONFLICT (month) DO UPDATE SET spent_usd=1.25`);
    const oldAudit = (await t.owner.query('SELECT * FROM ai_routing_audit')).rows;
    await t.owner.query(await migration());
    const row = (await t.owner.query('SELECT * FROM ai_routing_settings WHERE id=1')).rows[0];
    expect(row).toMatchObject({
      version: '1',
      settings: DEFAULT_AI_ROUTING_SETTINGS,
      updated_by: t.admin.accountId,
    });
    expect(row.settings).toEqual(DEFAULT_AI_ROUTING_SETTINGS);
    expect(row.settings.woku).not.toHaveProperty('usdPerCredit');
    expect(row.updated_at.toISOString()).toBe(savedAt);
    expect((await t.owner.query('SELECT * FROM ai_routing_audit')).rows).toEqual(oldAudit);
    expect(
      (await t.owner.query("SELECT spent_usd FROM extraction_spend WHERE month='2026-09'")).rows[0].spent_usd,
    ).toBe('1.250000');
  });
});
