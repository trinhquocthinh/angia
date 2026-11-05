import { describe, expect, it } from 'vitest';
import { extractionPayloadSchema } from '../extraction/extractionPayloadSchema.js';
import { prescriptionApprovalSchema } from './approvalDataSchemas.js';

const prescription = {
  type: 'prescription',
  issuedDate: '2026-10-01',
  facility: null,
  diagnosis: null,
  items: [
    {
      name: 'Thuốc A',
      strength: null,
      quantityPerDose: 1,
      doseUnit: 'viên',
      slots: ['morning'],
      durationDays: 30,
      longTerm: false,
      note: null,
      totalQuantity: null,
    },
  ],
};

describe('Hợp đồng ngày hẹn tái khám (SPEC-043)', () => {
  for (const [name, schema] of [
    ['trích xuất', extractionPayloadSchema],
    ['duyệt/nhập tay', prescriptionApprovalSchema],
  ] as const) {
    it.each(['2026-10-31', null])(`TC-573: ${name} giữ nguyên ngày hẹn %s`, (revisitDate) => {
      expect(schema.parse({ ...prescription, revisitDate })).toMatchObject({ revisitDate });
    });
    it(`TC-573: ${name} đọc bản cũ thành ngày hẹn null`, () => {
      expect(schema.parse(prescription)).toMatchObject({ revisitDate: null });
    });
    it.each(['2026-02-30', '31/10/2026', ''])(
      `TC-472: ${name} từ chối ngày không hợp lệ %s`,
      (revisitDate) => {
        expect(schema.safeParse({ ...prescription, revisitDate }).success).toBe(false);
      },
    );
  }
});
