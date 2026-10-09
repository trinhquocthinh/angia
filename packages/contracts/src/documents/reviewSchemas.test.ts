import { describe, expect, it } from 'vitest';
import { approveDocumentRequestSchema, documentListQuerySchema } from './reviewSchemas.js';

const item = {
  name: ' Amlodipin ',
  strength: '5mg',
  quantityPerDose: 1,
  doseUnit: 'viên',
  slots: ['morning'],
  durationDays: 30,
  longTerm: false,
  note: null,
  totalQuantity: 30,
};
const prescription = (overrides: object = {}) => ({
  type: 'prescription',
  data: {
    type: 'prescription',
    issuedDate: '2026-10-01',
    facility: null,
    diagnosis: null,
    items: [item],
    ...overrides,
  },
});

describe('ApproveDocumentRequest (SPEC-010, E3-S3-T3)', () => {
  it('nhận đơn thuốc đủ trường và cắt khoảng trắng tên thuốc', () => {
    const parsed = approveDocumentRequestSchema.parse(prescription());
    expect(parsed.type === 'prescription' && parsed.data.items[0]!.name).toBe('Amlodipin');
  });

  it('để API trả ERR_DOSE_INFO_MISSING đúng dòng: liều/buổi/số ngày trống vẫn qua hợp đồng', () => {
    const missing = { ...item, quantityPerDose: null, slots: [], durationDays: null };
    expect(approveDocumentRequestSchema.safeParse(prescription({ items: [missing] })).success).toBe(true);
  });

  it('từ chối đơn không có dòng thuốc, tên thuốc rỗng hoặc buổi lặp', () => {
    for (const items of [[], [{ ...item, name: '  ' }], [{ ...item, slots: ['morning', 'morning'] }]]) {
      expect(approveDocumentRequestSchema.safeParse(prescription({ items })).success).toBe(false);
    }
  });

  it('nhận phiếu xét nghiệm, từ chối chỉ số thiếu tên hoặc giá trị (BR-022 giữ nguyên văn)', () => {
    const lab = (items: object[]) => ({
      type: 'lab_result',
      data: { type: 'lab_result', resultDate: null, facility: null, items },
    });
    const row = { testName: 'HbA1c', value: '7.2', unit: '%', referenceRange: '4.0 - 6.0' };
    expect(approveDocumentRequestSchema.safeParse(lab([row])).success).toBe(true);
    expect(approveDocumentRequestSchema.safeParse(lab([{ ...row, value: ' ' }])).success).toBe(false);
    expect(approveDocumentRequestSchema.safeParse(lab([])).success).toBe(false);
  });

  it('từ chối loại lệnh khác loại dữ liệu bên trong', () => {
    const mixed = { type: 'lab_result', data: prescription().data };
    expect(approveDocumentRequestSchema.safeParse(mixed).success).toBe(false);
  });
});

describe('Truy vấn danh sách chứng từ phân trang (F09a)', () => {
  it('mặc định 50 bản, tối đa 100, cursor là UUID', () => {
    expect(documentListQuerySchema.parse({}).limit).toBe(50);
    expect(documentListQuerySchema.parse({ limit: '100' }).limit).toBe(100);
    expect(documentListQuerySchema.safeParse({ limit: '101' }).success).toBe(false);
    expect(documentListQuerySchema.safeParse({ limit: '0' }).success).toBe(false);
    expect(documentListQuerySchema.safeParse({ cursor: 'abc' }).success).toBe(false);
  });
});
