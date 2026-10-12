import { describe, expect, it } from 'vitest';
import type { Measurement, MeasurementKind } from '../domain/Measurement.js';
import { getMeasurementSeries } from './getMeasurementSeries.js';
import type { MeasurementRepository } from './ports.js';

const reading = (measuredOn: string, kind: MeasurementKind = 'blood_pressure') =>
  ({ id: `m-${measuredOn}`, kind, measuredOn }) as Measurement;
// Số đo tại 6 trong 8 tuần (17/08 → 11/10/2026), thiếu tuần 24/08 và 14/09; kèm 1 số đo đường huyết.
const stored = [
  ...['2026-08-17', '2026-08-31', '2026-09-08', '2026-09-21', '2026-09-28', '2026-10-11'].map((d) =>
    reading(d),
  ),
  reading('2026-09-01', 'glucose'),
];
const calls: unknown[][] = [];
const repository: MeasurementRepository = {
  withFamily: (familyId, work) =>
    work({
      profileExists: async (id) => familyId === 'family-a' && id === 'me',
      listMeasurementPage: async () => ({ items: [], nextCursor: null }),
      listMeasurementsBetween: async (...args) => {
        calls.push(args);
        const [, kind, from, to] = args;
        return stored.filter((m) => m.kind === kind && m.measuredOn >= from && m.measuredOn <= to);
      },
    }),
};
const request = {
  familyId: 'family-a',
  profileId: 'me',
  kind: 'blood_pressure',
  from: '2026-08-17',
  to: '2026-10-11',
} as const;

describe('getMeasurementSeries — SPEC-020', () => {
  it('TC-058 — chuỗi 8 tuần có số đo tại 6 tuần: 6 điểm, đúng 2 tuần hasMeasurement = false', async () => {
    const result = await getMeasurementSeries(repository, request);
    if (!result.ok) throw new Error(result.code);
    expect(result.value.points).toHaveLength(6);
    expect(result.value.weeks).toHaveLength(8);
    expect(result.value.weeks.filter((week) => !week.hasMeasurement)).toHaveLength(2);
    expect(calls.at(-1)).toEqual(['me', 'blood_pressure', '2026-08-17', '2026-10-11']);
  });

  it('TC-250 — chỉ lấy số đo trong [from, to]; tuần chứa from/to vẫn được liệt kê', async () => {
    const result = await getMeasurementSeries(repository, {
      ...request,
      from: '2026-09-29',
      to: '2026-10-10',
    });
    expect(result).toEqual({
      ok: true,
      value: {
        points: [],
        weeks: [
          { weekStart: '2026-09-28', hasMeasurement: false },
          { weekStart: '2026-10-05', hasMeasurement: false },
        ],
      },
    });
  });

  it('SPEC-006: hồ sơ gia đình khác → ERR_NOT_FOUND, không đọc số đo', async () => {
    const before = calls.length;
    expect(await getMeasurementSeries(repository, { ...request, familyId: 'family-b' })).toEqual({
      ok: false,
      code: 'ERR_NOT_FOUND',
    });
    expect(calls).toHaveLength(before);
  });
});
