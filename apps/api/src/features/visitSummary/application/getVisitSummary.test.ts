import { describe, expect, it, vi } from 'vitest';
import type { AdherencePeriod } from '@src/features/adherence/domain/AdherencePeriod.js';
import type { LabResult } from '@src/features/labResults/domain/LabResult.js';
import type { CurrentMedicationCourse } from '@src/features/medications/application/managementPorts.js';
import type { Measurement } from '@src/features/measurements/domain/Measurement.js';
import { VISIT_SUMMARY_DISCLAIMER } from '../domain/VisitSummary.js';
import { getVisitSummary } from './getVisitSummary.js';
import type { VisitSummaryRepository } from './ports.js';

type VisitSummaryStore = Parameters<Parameters<VisitSummaryRepository['withFamily']>[1]>[0];

const course = (id: string, startDate: string, endDate: string | null): CurrentMedicationCourse => ({
  id,
  healthProfileId: 'p',
  prescriptionItemId: null,
  source: 'self_reported',
  name: id,
  nameNormalized: id,
  quantityPerDose: 1,
  doseUnit: 'viên',
  slots: ['morning'],
  startDate,
  endDate,
  status: 'active',
  prescriptionIssuedDate: null,
});
const measurement = (day: number): Measurement => ({
  id: `m${day}`,
  healthProfileId: 'p',
  sourceDocumentId: null,
  kind: 'blood_pressure',
  measuredOn: `2026-08-${String(day).padStart(2, '0')}`,
  measuredTime: null,
  systolic: 120,
  diastolic: 80,
  pulse: null,
  glucoseValue: null,
  glucoseUnit: null,
  manualWithoutSource: true,
  createdAt: new Date('2026-08-01T00:00:00Z'),
});
const hba1c = (id: string, resultDate: string): LabResult => ({
  id,
  healthProfileId: 'p',
  sourceDocumentId: null,
  resultDate,
  testName: 'HbA1c',
  value: '7.1',
  unit: '%',
  referenceRange: null,
  facility: null,
  manualWithoutSource: true,
  createdAt: new Date('2026-08-01T00:00:00Z'),
});
const period: AdherencePeriod = {
  id: 'a',
  healthProfileId: 'p',
  medicationName: 'Amlodipin',
  medicationNameNormalized: 'amlodipin',
  status: 'taking',
  fromDate: '2026-08-01',
  toDate: null,
};
// 17:30 UTC ngày 15/10 = 00:30 ngày 16/10 giờ Việt Nam.
const now = () => new Date('2026-10-15T17:30:00Z');

function setup(profile: Awaited<ReturnType<VisitSummaryStore['findProfile']>> | 'default' = 'default') {
  const store = {
    findProfile: vi.fn(async () =>
      profile === 'default'
        ? { id: 'p', displayName: 'Mẹ', birthYear: 1958, vitalsEnabled: null, consentStatus: 'confirmed' }
        : profile,
    ),
    findMedicationHistory: vi.fn(async () => [
      course('Amlodipin', '2026-09-01', null),
      course('Metformin', '2026-10-01', '2026-10-16'),
      course('Ended', '2026-09-01', '2026-10-15'),
    ]),
    listMeasurementsBetween: vi.fn(async () => Array.from({ length: 10 }, (_, i) => measurement(i + 1))),
    listLabResults: vi.fn(async () => [hba1c('old', '2026-07-01'), hba1c('new', '2026-09-20')]),
    listAdherencePeriodsBetween: vi.fn(async () => [period]),
  } satisfies VisitSummaryStore;
  const repository: VisitSummaryRepository = { withFamily: async (_familyId, work) => work(store) };
  return { store, repository };
}

describe('Kết xuất bản tóm tắt tái khám (SPEC-024, E6-S1-T1)', () => {
  it('TC-065: đủ 2 thuốc đang dùng, 10 số đo, đúng 1 HbA1c mới nhất, ngày tạo và dòng miễn trừ', async () => {
    const { store, repository } = setup();
    const result = await getVisitSummary(repository, { familyId: 'f', profileId: 'p' }, now);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const summary = result.value;
    expect(summary.showsVitals).toBe(true);
    expect(summary.profile).toEqual({ id: 'p', displayName: 'Mẹ', birthYear: 1958 });
    expect(summary.createdAt).toEqual(new Date('2026-10-15T17:30:00Z'));
    expect({ from: summary.from, to: summary.to }).toEqual({ from: '2026-07-16', to: '2026-10-16' });
    expect(summary.currentMedications.map((item) => item.name)).toEqual(['Amlodipin', 'Metformin']);
    expect(summary.measurements).toHaveLength(10);
    expect(summary.latestLabResults.map((item) => item.id)).toEqual(['new']);
    expect(summary.adherencePeriods).toEqual([period]);
    expect(summary.disclaimer).toBe('Tài liệu tổng hợp từ gia đình, không phải chỉ định y khoa.');
    expect(VISIT_SUMMARY_DISCLAIMER).toBe(summary.disclaimer);
    expect(store.listMeasurementsBetween).toHaveBeenCalledWith('p', '2026-07-16', '2026-10-16');
    expect(store.listAdherencePeriodsBetween).toHaveBeenCalledWith('p', '2026-07-16', '2026-10-16');
  });

  it('thuốc đang dùng tính tại ngày tạo; xét nghiệm mới nhất tính tới ngày to', async () => {
    const { repository } = setup();
    const result = await getVisitSummary(
      repository,
      { familyId: 'f', profileId: 'p', from: '2026-07-01', to: '2026-08-31' },
      now,
    );
    if (!result.ok) throw new Error(result.code);
    expect(result.value.currentMedications.map((item) => item.name)).toEqual(['Amlodipin', 'Metformin']);
    expect(result.value.latestLabResults.map((item) => item.id)).toEqual(['old']);
  });

  it('hồ sơ không thuộc gia đình → ERR_NOT_FOUND; chưa đồng thuận → ERR_CONSENT_REQUIRED', async () => {
    const request = { familyId: 'f', profileId: 'p' };
    expect(await getVisitSummary(setup(null).repository, request, now)).toEqual({
      ok: false,
      code: 'ERR_NOT_FOUND',
    });
    const pending = {
      id: 'p',
      displayName: 'Mẹ',
      birthYear: null,
      vitalsEnabled: null,
      consentStatus: 'pending',
    };
    const { store, repository } = setup(pending);
    expect(await getVisitSummary(repository, request, now)).toEqual({
      ok: false,
      code: 'ERR_CONSENT_REQUIRED',
    });
    expect(store.listMeasurementsBetween).not.toHaveBeenCalled();
  });

  it.each([
    { birthYear: 2021, vitalsEnabled: null, expected: false },
    { birthYear: 2021, vitalsEnabled: true, expected: true },
    { birthYear: 2010, vitalsEnabled: null, expected: true },
    { birthYear: null, vitalsEnabled: null, expected: true },
  ])(
    'TC-445: năm sinh $birthYear, lựa chọn $vitalsEnabled → hiển thị $expected',
    async ({ birthYear, vitalsEnabled, expected }) => {
      const { store, repository } = setup({
        id: 'p',
        displayName: 'Hồ sơ',
        birthYear,
        vitalsEnabled,
        consentStatus: 'confirmed',
      });
      const measurements = [measurement(1), measurement(2), measurement(3)];
      store.listMeasurementsBetween.mockResolvedValue(measurements);
      const result = await getVisitSummary(
        repository,
        { familyId: 'f', profileId: 'p', from: '2026-08-01', to: '2026-08-31' },
        now,
      );
      if (!result.ok) throw new Error(result.code);
      expect(result.value.showsVitals).toBe(expected);
      expect(result.value.measurements).toEqual(expected ? measurements : []);
      expect(store.listMeasurementsBetween).toHaveBeenCalledTimes(expected ? 1 : 0);
      if (expected) {
        expect(store.listMeasurementsBetween).toHaveBeenCalledWith('p', '2026-08-01', '2026-08-31');
      }
      expect(result.value.currentMedications.map((item) => item.name)).toEqual(['Amlodipin', 'Metformin']);
      expect(result.value.latestLabResults.map((item) => item.id)).toEqual(['old']);
      expect(result.value.adherencePeriods).toEqual([period]);
      expect(result.value.disclaimer).toBe(VISIT_SUMMARY_DISCLAIMER);
    },
  );

  it.each([
    { instant: '2026-12-31T16:59:59Z', expected: false },
    { instant: '2026-12-31T17:00:00Z', expected: true },
  ])('TC-445: tính tuổi theo năm Việt Nam tại $instant', async ({ instant, expected }) => {
    const { repository } = setup({
      id: 'p',
      displayName: 'Hồ sơ',
      birthYear: 2011,
      vitalsEnabled: null,
      consentStatus: 'confirmed',
    });
    const clock = vi.fn(() => new Date(instant));
    const result = await getVisitSummary(repository, { familyId: 'f', profileId: 'p' }, clock);
    if (!result.ok) throw new Error(result.code);
    expect(result.value.showsVitals).toBe(expected);
    expect(result.value.createdAt).toEqual(new Date(instant));
    expect(clock).toHaveBeenCalledTimes(1);
  });

  it('khoảng sai → ERR_VALIDATION trước khi đọc dữ liệu', async () => {
    const { store, repository } = setup();
    const request = { familyId: 'f', profileId: 'p', from: '2026-10-10', to: '2026-10-01' };
    expect(await getVisitSummary(repository, request, now)).toEqual({ ok: false, code: 'ERR_VALIDATION' });
    expect(store.findProfile).not.toHaveBeenCalled();
  });
});
