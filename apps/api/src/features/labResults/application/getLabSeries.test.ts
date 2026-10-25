import { describe, expect, it } from 'vitest';
import type { LabResult } from '../domain/LabResult.js';
import { getLabSeries } from './getLabSeries.js';
import type { LabResultRepository } from './ports.js';

const stored = [
  { id: 'a', testName: 'HbA1c', resultDate: '2026-06-12', createdAt: new Date(0) },
  { id: 'b', testName: 'Glucose', resultDate: '2026-10-01', createdAt: new Date(0) },
] as LabResult[];
const calls: unknown[][] = [];
const repository: LabResultRepository = {
  withFamily: (familyId, work) =>
    work({
      profileConsent: async (id) =>
        familyId !== 'family-a' ? null : id === 'me' ? 'confirmed' : id === 'rut' ? 'withdrawn' : null,
      listLabResults: async (...args) => {
        calls.push(args);
        return stored;
      },
    }),
};

describe('getLabSeries — SPEC-021', () => {
  it('trả các nhóm chỉ số của hồ sơ, nhóm mới nhất trước', async () => {
    const result = await getLabSeries(repository, { familyId: 'family-a', profileId: 'me' });
    if (!result.ok) throw new Error(result.code);
    expect(result.value.map((group) => group.testName)).toEqual(['Glucose', 'HbA1c']);
    expect(calls.at(-1)).toEqual(['me', undefined]);
  });

  it('TC-258 — lọc testName so khớp tên chuẩn hóa (không phân biệt hoa thường, dấu, khoảng trắng)', async () => {
    await getLabSeries(repository, { familyId: 'family-a', profileId: 'me', testName: '  Đường   HUYẾT ' });
    expect(calls.at(-1)).toEqual(['me', 'duong huyet']);
  });

  it('SPEC-006: hồ sơ gia đình khác → ERR_NOT_FOUND, không đọc kết quả', async () => {
    const before = calls.length;
    expect(await getLabSeries(repository, { familyId: 'family-b', profileId: 'me' })).toEqual({
      ok: false,
      code: 'ERR_NOT_FOUND',
    });
    expect(calls).toHaveLength(before);
  });

  it('TC-380: hồ sơ đã rút đồng thuận → ERR_CONSENT_REQUIRED, không đọc kết quả', async () => {
    const before = calls.length;
    expect(await getLabSeries(repository, { familyId: 'family-a', profileId: 'rut' })).toEqual({
      ok: false,
      code: 'ERR_CONSENT_REQUIRED',
    });
    expect(calls).toHaveLength(before);
  });
});
