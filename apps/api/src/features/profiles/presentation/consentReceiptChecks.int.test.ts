import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import { profileConsentFixture } from '@src/shared/test/profileConsentFixture.js';

describe('LG-02: CHECK receipt trong PostgreSQL', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });
  it.each(['main_attested', 'self'] as const)(
    'TC-552: receipt %s hợp lệ được lưu, thiếu từng trường bị chặn',
    async (source) => {
      const f = await profileConsentFixture(t);
      const profile = await f.create();
      const receipt: Record<string, unknown> = {
        consent_status: 'confirmed',
        consent_source: source,
        consent_confirmed_at: new Date(),
        consent_confirmed_by: f.main.accountId,
        consent_basis: 'self',
        consent_respondent_name: 'An',
      };
      const write = (changes: Record<string, unknown>) => {
        const entries = Object.entries({ ...receipt, ...changes });
        return t.owner.query(
          `UPDATE health_profiles SET ${entries.map(([key], i) => `${key}=$${i + 2}`).join(',')} WHERE id=$1`,
          [profile.id, ...entries.map(([, value]) => value)],
        );
      };
      await write({});
      for (const key of [
        'consent_source',
        'consent_confirmed_at',
        'consent_confirmed_by',
        'consent_basis',
        'consent_respondent_name',
      ]) {
        await expect(write({ [key]: null })).rejects.toMatchObject({ code: '23514' });
      }
      for (const name of ['', '  ', ' An ', 'a'.repeat(61)]) {
        await expect(write({ consent_respondent_name: name })).rejects.toMatchObject({ code: '23514' });
      }
      if (source === 'self')
        await expect(write({ consent_basis: 'guardian' })).rejects.toMatchObject({ code: '23514' });
      await expect(write({ consent_source: 'legacy_attestation' })).rejects.toMatchObject({ code: '23514' });
      await expect(write({ consent_source: 'invitation' })).rejects.toMatchObject({ code: '23514' });
      await write({ consent_source: 'invitation', consent_confirmed_by: null });
    },
  );
  it('TC-552: main_attested ở trạng thái khác confirmed vẫn cần người, tư cách và tên', async () => {
    const f = await profileConsentFixture(t);
    const profile = await f.create();
    for (const column of ['consent_confirmed_by', 'consent_basis', 'consent_respondent_name']) {
      const fields: Record<string, unknown> = {
        consent_confirmed_by: f.main.accountId,
        consent_basis: 'self',
        consent_respondent_name: 'An',
        [column]: null,
      };
      await expect(
        t.owner.query(
          `UPDATE health_profiles SET consent_source='main_attested',consent_confirmed_by=$2,consent_basis=$3,consent_respondent_name=$4 WHERE id=$1`,
          [profile.id, fields.consent_confirmed_by, fields.consent_basis, fields.consent_respondent_name],
        ),
      ).rejects.toMatchObject({ code: '23514' });
    }
  });
});
