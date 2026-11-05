import { describe, expect, it } from 'vitest';
import { createMemoryReviewRepository } from '@src/shared/test/createMemoryReviewRepository.js';
import type { ApprovalDraft } from './approvalDrafts.js';
import { createManualRecords } from './createManualRecords.js';
import type { ReviewRepository } from './reviewPorts.js';

const drafts: ApprovalDraft[] = [
  {
    type: 'lab_result',
    data: {
      type: 'lab_result',
      resultDate: '2026-10-01',
      facility: null,
      items: [{ testName: 'HbA1c', value: '7.2', unit: null, referenceRange: null }],
    },
  },
  {
    type: 'device_reading',
    data: {
      type: 'device_reading',
      measuredAt: '2026-10-01',
      measuredTime: null,
      kind: 'blood_pressure',
      systolic: 130,
      diastolic: 85,
      pulse: null,
      glucoseValue: null,
      glucoseUnit: null,
    },
  },
  {
    type: 'prescription',
    data: {
      type: 'prescription',
      issuedDate: '2026-10-01',
      facility: null,
      diagnosis: null,
      items: [
        {
          name: 'Canxi',
          strength: null,
          quantityPerDose: 1,
          externalUse: false,
          doseUnit: 'viên',
          slots: ['morning'],
          durationDays: 1,
          longTerm: false,
          note: null,
          totalQuantity: null,
        },
      ],
    },
  },
];

describe('SPEC-012: lỗi khóa kiểm trùng không được ghi dữ liệu', () => {
  for (const draft of drafts) {
    it.each([false, true])(
      `${draft.type}: chờ khóa kể cả khi xác nhận trùng = %s`,
      async (confirmDuplicate) => {
        const memory = createMemoryReviewRepository([]);
        const repository: ReviewRepository = {
          withFamily: (familyId, work) =>
            memory.repository.withFamily(familyId, (store) =>
              work({
                ...store,
                lockDuplicateRecord: async () => {
                  throw new Error('Không lấy được khóa kiểm trùng');
                },
              }),
            ),
        };
        await expect(
          createManualRecords(repository, {
            ...draft,
            confirmDuplicate,
            familyId: 'family-a',
            profileId: 'me',
          }),
        ).rejects.toThrow('Không lấy được khóa kiểm trùng');
        expect(memory.labResults).toEqual([]);
        expect(memory.measurements).toEqual([]);
        expect(memory.prescriptions).toEqual([]);
        expect(memory.medicationCourses).toEqual([]);
      },
    );
  }
});
