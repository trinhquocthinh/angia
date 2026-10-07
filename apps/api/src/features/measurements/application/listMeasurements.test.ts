import { describe, expect, it } from 'vitest';
import type { Measurement } from '../domain/Measurement.js';
import { listMeasurements } from './listMeasurements.js';
import type { MeasurementRepository } from './ports.js';

const measurement = { id: 'm-1', kind: 'blood_pressure' } as Measurement;
const repository: MeasurementRepository = {
  withFamily: (familyId, work) =>
    work({
      profileExists: async (id) => familyId === 'family-a' && id === 'me',
      listMeasurements: async (_id, kind) => (kind === 'glucose' ? [] : [measurement]),
    }),
};

describe('Danh sách số đo đã duyệt của hồ sơ', () => {
  it('trả số đo theo loại chỉ số của hồ sơ trong gia đình', async () => {
    expect(await listMeasurements(repository, { familyId: 'family-a', profileId: 'me' })).toEqual({
      ok: true,
      value: [measurement],
    });
    expect(
      await listMeasurements(repository, { familyId: 'family-a', profileId: 'me', kind: 'glucose' }),
    ).toEqual({
      ok: true,
      value: [],
    });
  });

  it('SPEC-006: hồ sơ gia đình khác → ERR_NOT_FOUND', async () => {
    expect(await listMeasurements(repository, { familyId: 'family-b', profileId: 'me' })).toEqual({
      ok: false,
      code: 'ERR_NOT_FOUND',
    });
  });
});
