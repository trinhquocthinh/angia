import { describe, expect, it, vi } from 'vitest';
import { getSelfMeasurementSeries } from './getSelfMeasurementSeries.js';
import { getSelfProfile } from './getSelfProfile.js';
import { listSelfReminders } from './listSelfReminders.js';
import type { SelfProfileRow, SelfProfileScope } from './ports.js';

const FAMILY = 'family-1';
const ACTOR = { accountId: 'account-1', isMain: false };
// 2026-11-01 17:30 UTC đã là 2026-11-02 ở Việt Nam.
const now = () => new Date('2026-11-01T17:30:00.000Z');
const adult: SelfProfileRow = {
  id: 'profile-1',
  displayName: 'Mẹ',
  birthYear: 1950,
  consentStatus: 'confirmed',
  vitalsEnabled: null,
};
const stored = {
  id: 'reminder-1',
  date: '2026-11-02',
  slot: 'morning' as const,
  scheduledAt: '2026-11-02T00:00:00.000Z',
  medications: [{ courseId: 'c', name: 'Canxi', strength: null, quantityPerDose: null, doseUnit: null }],
  confirmation: null,
};

function scopeOf(row: SelfProfileRow | null) {
  const reminders = vi.fn(() => Promise.resolve([stored]));
  const seriesWork = vi.fn(() =>
    Promise.resolve({
      profileConsent: () => Promise.resolve(row?.consentStatus ?? null),
      listMeasurementsBetween: () => Promise.resolve([]),
      listAdherencePeriodsBetween: () => Promise.resolve([]),
    }),
  );
  const scope = {
    withFamily: (_family: string, work: never) =>
      (work as (store: unknown) => Promise<unknown>)({ profile: () => Promise.resolve(row), reminders }),
    measurements: {
      withFamily: async (_family: string, work: never) =>
        (work as (store: unknown) => Promise<unknown>)(await seriesWork()),
    },
  } as unknown as SelfProfileScope;
  return { scope, reminders, seriesWork };
}
const seriesRequest = {
  profileId: 'profile-1',
  kind: 'blood_pressure',
  from: '2026-10-01',
  to: '2026-10-31',
};
const series = (scope: SelfProfileScope) =>
  getSelfMeasurementSeries(
    scope,
    FAMILY,
    seriesRequest as Parameters<typeof getSelfMeasurementSeries>[2],
    now,
  );

describe('getSelfProfile', () => {
  it('TC-571: trả trạng thái kể cả khi hồ sơ đã rút đồng thuận', async () => {
    const { scope } = scopeOf({ ...adult, consentStatus: 'withdrawn' });
    expect(await getSelfProfile(scope, FAMILY, now)).toEqual({
      ok: true,
      value: {
        id: 'profile-1',
        displayName: 'Mẹ',
        birthYear: 1950,
        consentStatus: 'withdrawn',
        showsVitals: true,
      },
    });
  });

  it('TC-571: tính showsVitals theo năm Việt Nam; hồ sơ không còn thấy được trả ERR_NOT_FOUND', async () => {
    // UTC còn năm 2026 (15 tuổi) nhưng Việt Nam đã sang 2027 (đủ 16 tuổi).
    const newYear = () => new Date('2026-12-31T17:30:00.000Z');
    const turning = scopeOf({ ...adult, birthYear: 2011 });
    expect(await getSelfProfile(turning.scope, FAMILY, newYear)).toMatchObject({
      value: { showsVitals: true },
    });
    const younger = scopeOf({ ...adult, birthYear: 2012 });
    expect(await getSelfProfile(younger.scope, FAMILY, newYear)).toMatchObject({
      value: { showsVitals: false },
    });
    expect(await getSelfProfile(scopeOf(null).scope, FAMILY, now)).toEqual({
      ok: false,
      code: 'ERR_NOT_FOUND',
    });
  });
});

describe('listSelfReminders', () => {
  it('mặc định hôm nay theo giờ Việt Nam, không lộ courseId', async () => {
    const { scope, reminders } = scopeOf(adult);
    const result = await listSelfReminders(scope, FAMILY, ACTOR, undefined, now);
    expect(reminders).toHaveBeenCalledWith('2026-11-02');
    expect(result).toEqual({
      ok: true,
      value: [
        {
          ...stored,
          medications: [{ name: 'Canxi', strength: null, quantityPerDose: null, doseUnit: null }],
          canConfirm: true,
          canUndo: false,
        },
      ],
    });
  });

  it('TC-571: hồ sơ chưa đồng thuận nhận ERR_CONSENT_REQUIRED, không đọc lời nhắc', async () => {
    const { scope, reminders } = scopeOf({ ...adult, consentStatus: 'withdrawn' });
    expect(await listSelfReminders(scope, FAMILY, ACTOR, '2026-10-23', now)).toEqual({
      ok: false,
      code: 'ERR_CONSENT_REQUIRED',
    });
    expect(reminders).not.toHaveBeenCalled();
  });
});

describe('getSelfMeasurementSeries', () => {
  it('TC-571: chưa bật số đo trả ERR_NOT_FOUND, không đọc số đo (BR-049)', async () => {
    const { scope, seriesWork } = scopeOf({ ...adult, birthYear: 2021 });
    expect(await series(scope)).toEqual({ ok: false, code: 'ERR_NOT_FOUND' });
    expect(seriesWork).not.toHaveBeenCalled();
  });

  it('TC-571: chưa đồng thuận ưu tiên ERR_CONSENT_REQUIRED trước số đo', async () => {
    const { scope } = scopeOf({ ...adult, birthYear: 2021, consentStatus: 'declined' });
    expect(await series(scope)).toEqual({ ok: false, code: 'ERR_CONSENT_REQUIRED' });
  });

  it('được xem số đo thì đọc chuỗi của hồ sơ', async () => {
    const { scope, seriesWork } = scopeOf(adult);
    expect(await series(scope)).toMatchObject({ ok: true, value: { points: [] } });
    expect(seriesWork).toHaveBeenCalledOnce();
  });
});
