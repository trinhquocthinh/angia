import { describe, expect, it } from 'vitest';
import type { ConsentStatus } from '@src/features/profiles/domain/HealthProfile.js';
import { listRevisits } from './listRevisits.js';
import { setRevisitDate } from './setRevisitDate.js';
import type { RevisitRepository, RevisitStore } from './revisitPorts.js';

function setup(consent: ConsentStatus | null = 'confirmed', exists = true) {
  const events: unknown[] = [];
  const store: RevisitStore = {
    findProfile: async () => consent && { consentStatus: consent },
    lockProfile: async () => {
      events.push('lock');
    },
    listRevisits: async (_id, from) => {
      events.push(from);
      return [];
    },
    findPrescription: async () => (exists ? { issuedDate: '2026-01-01', revisitDate: '2026-11-20' } : null),
    updateDate: async (_id, date) => {
      events.push(date);
    },
    cleanReminders: async (_id, date) => {
      events.push(['clean', date]);
    },
    ensureReminder: async (_id, date, today) => {
      events.push(['ensure', date, today]);
    },
  };
  const repository: RevisitRepository = { withFamily: (_family, work) => work(store) };
  const now = () => new Date('2026-10-30T17:30:00Z');
  return { repository, events, now };
}

describe('Đọc và sửa ngày hẹn qua application (SPEC-043)', () => {
  it('TC-473: mặc định from theo ngày VN tại ranh giới UTC, nhận from quá khứ', async () => {
    const f = setup();
    expect(await listRevisits(f.repository, 'f', 'p', undefined, f.now)).toEqual({ ok: true, value: [] });
    await listRevisits(f.repository, 'f', 'p', '2026-01-01', f.now);
    expect(f.events).toEqual(['2026-10-31', '2026-01-01']);
  });

  it.each([null, 'pending', 'withdrawn'] as const)(
    'TC-473/474: cổng đồng thuận %s chặn cả đọc và sửa',
    async (consent) => {
      const f = setup(consent);
      const expected = { ok: false, code: consent === null ? 'ERR_NOT_FOUND' : 'ERR_CONSENT_REQUIRED' };
      expect(await listRevisits(f.repository, 'f', 'p', undefined, f.now)).toEqual(expected);
      expect(
        await setRevisitDate(
          f.repository,
          {
            familyId: 'f',
            profileId: 'p',
            prescriptionId: 'r',
            revisitDate: null,
          },
          f.now,
        ),
      ).toEqual(expected);
      expect(f.events).toEqual([]);
    },
  );

  it('TC-474: khóa trước khi đọc đơn, sửa rồi dọn ngày cũ và sinh nhắc ngày mới trong transaction', async () => {
    const f = setup();
    expect(
      await setRevisitDate(
        f.repository,
        {
          familyId: 'f',
          profileId: 'p',
          prescriptionId: 'r',
          revisitDate: '2026-11-02',
        },
        f.now,
      ),
    ).toEqual({ ok: true, value: { revisitDate: '2026-11-02' } });
    expect(f.events).toEqual([
      'lock',
      '2026-11-02',
      ['clean', '2026-11-20'],
      ['ensure', '2026-11-02', '2026-10-31'],
    ]);
  });

  it('TC-472/474: không thấy đơn hoặc ngày sai không ghi và không dọn nhắc', async () => {
    for (const exists of [true, false]) {
      const f = setup('confirmed', exists);
      expect(
        await setRevisitDate(
          f.repository,
          {
            familyId: 'f',
            profileId: 'p',
            prescriptionId: 'r',
            revisitDate: '2025-12-31',
          },
          f.now,
        ),
      ).toEqual({ ok: false, code: exists ? 'ERR_VALIDATION' : 'ERR_NOT_FOUND' });
      expect(f.events).toEqual(['lock']);
    }
  });
});
