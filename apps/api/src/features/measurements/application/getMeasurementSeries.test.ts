import { describe, expect, it } from 'vitest';
import type { AdherencePeriod } from '@src/features/adherence/domain/AdherencePeriod.js';
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
const period = (fromDate: string, toDate: string | null) =>
  ({
    id: `p-${fromDate}`,
    medicationName: 'Amlodipin',
    status: 'taking',
    fromDate,
    toDate,
  }) as AdherencePeriod;
const periods = [
  period('2026-07-01', '2026-08-31'),
  period('2026-09-01', '2026-09-30'),
  period('2026-10-01', null),
];
const calls: unknown[][] = [];
const periodCalls: unknown[][] = [];
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
      listAdherencePeriodsBetween: async (...args) => {
        periodCalls.push(args);
        const [, from, to] = args;
        return periods.filter((p) => p.fromDate <= to && (p.toDate === null || p.toDate >= from));
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
        periods: [periods[1], periods[2]],
        weeks: [
          { weekStart: '2026-09-28', hasMeasurement: false },
          { weekStart: '2026-10-05', hasMeasurement: false },
        ],
      },
    });
  });

  it('TC-064 — SPEC-023: kèm giai đoạn dùng thuốc giao với [from, to], cùng khoảng với số đo', async () => {
    const result = await getMeasurementSeries(repository, {
      ...request,
      from: '2026-09-15',
      to: '2026-10-11',
    });
    if (!result.ok) throw new Error(result.code);
    expect(result.value.periods.map((p) => p.id)).toEqual(['p-2026-09-01', 'p-2026-10-01']);
    expect(periodCalls.at(-1)).toEqual(['me', '2026-09-15', '2026-10-11']);
  });

  it('SPEC-006: hồ sơ gia đình khác → ERR_NOT_FOUND, không đọc số đo', async () => {
    const [before, periodsBefore] = [calls.length, periodCalls.length];
    expect(await getMeasurementSeries(repository, { ...request, familyId: 'family-b' })).toEqual({
      ok: false,
      code: 'ERR_NOT_FOUND',
    });
    expect(calls).toHaveLength(before);
    expect(periodCalls).toHaveLength(periodsBefore);
  });
});
