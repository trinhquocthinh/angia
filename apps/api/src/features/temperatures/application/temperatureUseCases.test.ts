import { describe, expect, it } from 'vitest';
import type { TemperatureReading } from '../domain/TemperatureReading.js';
import { deleteTemperature } from './deleteTemperature.js';
import { listTemperatures } from './listTemperatures.js';
import type { TemperatureRepository } from './ports.js';
import { recordTemperature } from './recordTemperature.js';

// 2026-11-03 15:00 giờ Việt Nam.
const now = () => new Date('2026-11-03T08:00:00Z');

function fake(consentStatus: 'confirmed' | 'withdrawn' = 'confirmed') {
  const readings: TemperatureReading[] = [];
  const ranges: unknown[] = [];
  const repository: TemperatureRepository = {
    withFamily: (familyId, work) =>
      work({
        findProfile: async (id) => (familyId === 'family-a' && id === 'me' ? { consentStatus } : null),
        insertReading: async ({ healthProfileId: _p, ...input }) => {
          const reading = { ...input, id: `reading-${readings.length + 1}`, recordedAt: now() };
          readings.push(reading);
          return reading;
        },
        deleteReading: async (_profileId, id) =>
          readings.splice(
            readings.findIndex((r) => r.id === id),
            1,
          ).length > 0,
        listReadings: async (_profileId, range) => (ranges.push(range), readings),
      }),
  };
  return { repository, readings, ranges };
}
const target = { familyId: 'family-a', profileId: 'me' };
const record = { ...target, accountId: 'acc-main', confirmOutOfRange: false };

describe('Nhiệt độ cơ thể (SPEC-048)', () => {
  it('TC-500: ghi 38,46 °C lúc 13:50 lưu 38,5 kèm người ghi, không có trường nhận định', async () => {
    const f = fake();
    const measuredAt = new Date('2026-11-03T06:50:00Z');
    const result = await recordTemperature(f.repository, { ...record, celsius: 38.46, measuredAt }, now);
    expect(result).toEqual({
      ok: true,
      value: { id: 'reading-1', celsius: 38.5, measuredAt, recordedBy: 'acc-main', recordedAt: now() },
    });
  });

  it('TC-501: ngoài khoảng chưa xác nhận trả fields, không ghi; giờ tương lai ERR_VALIDATION', async () => {
    const f = fake();
    const measuredAt = new Date('2026-11-03T06:50:00Z');
    expect(await recordTemperature(f.repository, { ...record, celsius: 48, measuredAt }, now)).toEqual({
      ok: false,
      code: 'ERR_OUT_OF_RANGE_UNCONFIRMED',
      fields: ['celsius'],
    });
    const future = new Date(now().getTime() + 60_000);
    expect(
      await recordTemperature(f.repository, { ...record, celsius: 37, measuredAt: future }, now),
    ).toEqual({
      ok: false,
      code: 'ERR_VALIDATION',
    });
    expect(f.readings).toEqual([]);
  });

  it('SPEC-048: hồ sơ chưa đồng thuận ERR_CONSENT_REQUIRED, hồ sơ ngoài gia đình ERR_NOT_FOUND', async () => {
    const f = fake('withdrawn');
    const body = { ...record, celsius: 37, measuredAt: now() };
    expect(await recordTemperature(f.repository, body, now)).toEqual({
      ok: false,
      code: 'ERR_CONSENT_REQUIRED',
    });
    const other = { ...target, familyId: 'family-b' };
    expect(await deleteTemperature(f.repository, { ...other, readingId: 'x' })).toEqual({
      ok: false,
      code: 'ERR_NOT_FOUND',
    });
  });

  it('SPEC-048: đọc theo ngày Việt Nam [from, to] tính cả hai đầu; xóa bản ghi không có → ERR_NOT_FOUND', async () => {
    const f = fake();
    expect(await listTemperatures(f.repository, { ...target, from: '2026-11-01', to: '2026-11-03' })).toEqual(
      {
        ok: true,
        value: [],
      },
    );
    expect(f.ranges).toEqual([
      { from: new Date('2026-10-31T17:00:00Z'), to: new Date('2026-11-03T17:00:00Z') },
    ]);
    expect(await deleteTemperature(f.repository, { ...target, readingId: 'none' })).toEqual({
      ok: false,
      code: 'ERR_NOT_FOUND',
    });
  });
});
