import { describe, expect, it } from 'vitest';
import type { Measurement } from '../domain/Measurement.js';
import { listMeasurements } from './listMeasurements.js';
import type { MeasurementRepository } from './ports.js';

const measurement = { id: 'm-1', kind: 'blood_pressure' } as Measurement;
const repository: MeasurementRepository = {
  withFamily: (familyId, work) =>
    work({
      profileConsent: async (id) =>
        familyId !== 'family-a' ? null : id === 'me' ? 'confirmed' : id === 'rut' ? 'withdrawn' : null,
      listMeasurementPage: async (_id, kind, page) => ({
        items: kind === 'glucose' ? [] : [measurement],
        nextCursor: page.cursor ? null : 'm-1',
      }),
      listMeasurementsBetween: async () => [],
      listAdherencePeriodsBetween: async () => [],
    }),
};
const page = { limit: 50, cursor: undefined };

describe('Danh sách số đo đã duyệt của hồ sơ', () => {
  it('trả trang số đo theo loại chỉ số của hồ sơ trong gia đình', async () => {
    expect(await listMeasurements(repository, { familyId: 'family-a', profileId: 'me', page })).toEqual({
      ok: true,
      value: { items: [measurement], nextCursor: 'm-1' },
    });
    expect(
      await listMeasurements(repository, {
        familyId: 'family-a',
        profileId: 'me',
        kind: 'glucose',
        page: { limit: 50, cursor: 'm-1' },
      }),
    ).toEqual({ ok: true, value: { items: [], nextCursor: null } });
  });

  it('SPEC-006: hồ sơ gia đình khác → ERR_NOT_FOUND', async () => {
    expect(await listMeasurements(repository, { familyId: 'family-b', profileId: 'me', page })).toEqual({
      ok: false,
      code: 'ERR_NOT_FOUND',
    });
  });

  it('TC-380: hồ sơ đã rút đồng thuận → ERR_CONSENT_REQUIRED', async () => {
    expect(await listMeasurements(repository, { familyId: 'family-a', profileId: 'rut', page })).toEqual({
      ok: false,
      code: 'ERR_CONSENT_REQUIRED',
    });
  });
});
