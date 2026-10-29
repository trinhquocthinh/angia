import { expect, it } from 'vitest';
import { deleteDocumentRequestSchema, documentDeletionImpactSchema } from './documentDeletionSchemas.js';

const impact = {
  prescriptions: 1,
  prescriptionItems: 2,
  labResults: 0,
  measurements: 0,
  medicationCourses: 2,
  activeMedicationCourses: 1,
};

it('TC-413: chỉ nhận từ khóa xác nhận chính xác XÓA', () => {
  expect(deleteDocumentRequestSchema.parse({ confirm: 'XÓA' })).toEqual({ confirm: 'XÓA' });
  for (const input of [{}, { confirm: 'xoa' }, { confirm: 'xóa' }, { confirm: ' XÓA ' }]) {
    expect(deleteDocumentRequestSchema.safeParse(input).success).toBe(false);
  }
});

it('TC-412: cả sáu số đếm bắt buộc là số nguyên không âm', () => {
  expect(documentDeletionImpactSchema.parse(impact)).toEqual(impact);
  for (const key of Object.keys(impact)) {
    expect(documentDeletionImpactSchema.safeParse({ ...impact, [key]: 0 }).success).toBe(true);
    for (const value of [-1, 0.5, '1', null, undefined]) {
      expect(documentDeletionImpactSchema.safeParse({ ...impact, [key]: value }).success).toBe(false);
    }
  }
});
