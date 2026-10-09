import { describe, expect, it } from 'vitest';
import { createMemoryReviewRepository } from '@src/shared/test/createMemoryReviewRepository.js';
import { createManualRecords, type ManualRecordsRequest } from './createManualRecords.js';

const bloodPressure = (measuredAt: string | null = '2026-10-06'): ManualRecordsRequest => ({
  familyId: 'family-a',
  profileId: 'me',
  type: 'device_reading',
  data: {
    type: 'device_reading',
    measuredAt,
    measuredTime: null,
    kind: 'blood_pressure',
    systolic: 130,
    diastolic: 85,
    pulse: null,
    glucoseValue: null,
    glucoseUnit: null,
  },
});

describe('Nhập trực tiếp không qua ảnh (SPEC-011, BR-014, BR-009)', () => {
  it('TC-037: huyết áp 130/85 ngày 06/10 → lưu với manualWithoutSource = true, không gắn chứng từ', async () => {
    const memory = createMemoryReviewRepository([]);
    const result = await createManualRecords(memory.repository, bloodPressure());
    expect(result.ok).toBe(true);
    expect(memory.measurements).toEqual([
      expect.objectContaining({
        healthProfileId: 'me',
        sourceDocumentId: null,
        manualWithoutSource: true,
        measuredOn: '2026-10-06',
        systolic: 130,
        diastolic: 85,
      }),
    ]);
    expect(result.ok && result.value.measurements).toHaveLength(1);
  });

  it('đơn thuốc nhập trực tiếp → đơn không gắn chứng từ, gắn cờ manualWithoutSource', async () => {
    const memory = createMemoryReviewRepository([]);
    const result = await createManualRecords(memory.repository, {
      familyId: 'family-a',
      profileId: 'me',
      type: 'prescription',
      data: {
        type: 'prescription',
        issuedDate: '2026-10-01',
        facility: null,
        diagnosis: null,
        items: [
          {
            name: 'Amlodipin',
            strength: '5mg',
            quantityPerDose: 1,
            doseUnit: 'viên',
            slots: ['morning'],
            durationDays: null,
            longTerm: true,
            note: null,
            totalQuantity: null,
          },
        ],
      },
    });
    expect(result.ok && result.value.prescription).toMatchObject({
      sourceDocumentId: null,
      manualWithoutSource: true,
    });
  });

  it('phiếu xét nghiệm nhập trực tiếp → mỗi chỉ số gắn cờ manualWithoutSource', async () => {
    const memory = createMemoryReviewRepository([]);
    await createManualRecords(memory.repository, {
      familyId: 'family-a',
      profileId: 'me',
      type: 'lab_result',
      data: {
        type: 'lab_result',
        resultDate: '2026-10-02',
        facility: null,
        items: [{ testName: 'HbA1c', value: '7,2', unit: '%', referenceRange: null }],
      },
    });
    expect(memory.labResults).toEqual([
      expect.objectContaining({ sourceDocumentId: null, manualWithoutSource: true, value: '7,2' }),
    ]);
  });

  it('kế thừa SPEC-010: thiếu ngày đo → ERR_DOCUMENT_DATE_REQUIRED, không lưu', async () => {
    const memory = createMemoryReviewRepository([]);
    expect(await createManualRecords(memory.repository, bloodPressure(null))).toEqual({
      ok: false,
      code: 'ERR_DOCUMENT_DATE_REQUIRED',
    });
    expect(memory.measurements).toEqual([]);
  });

  it('SPEC-006: hồ sơ của gia đình khác → ERR_NOT_FOUND', async () => {
    const memory = createMemoryReviewRepository([], {}, [
      { id: 'me', familyId: 'family-b', consentStatus: 'confirmed' },
    ]);
    expect(await createManualRecords(memory.repository, bloodPressure())).toEqual({
      ok: false,
      code: 'ERR_NOT_FOUND',
    });
  });

  it('BR-009: hồ sơ chưa đồng thuận → ERR_CONSENT_REQUIRED, không lưu', async () => {
    const memory = createMemoryReviewRepository([], {}, [
      { id: 'me', familyId: 'family-a', consentStatus: 'invited' },
    ]);
    expect(await createManualRecords(memory.repository, bloodPressure())).toEqual({
      ok: false,
      code: 'ERR_CONSENT_REQUIRED',
    });
    expect(memory.measurements).toEqual([]);
  });
});
