import { describe, expect, it } from 'vitest';
import { recordAdherencePeriodRequestSchema } from './adherencePeriodSchemas.js';

describe('Hợp đồng ghi nhận giai đoạn dùng thực tế', () => {
  it('TC-062: nhận tên, trạng thái và ngày lịch hợp lệ; cắt khoảng trắng tên', () => {
    expect(
      recordAdherencePeriodRequestSchema.parse({
        medicationName: ' Amlodipin ',
        status: 'stopped',
        fromDate: '2026-10-10',
      }),
    ).toEqual({ medicationName: 'Amlodipin', status: 'stopped', fromDate: '2026-10-10' });
  });
  it('TC-063: từ chối trạng thái lạ, ngày sai, tên rỗng và trường ngoài hợp đồng', () => {
    const valid = { medicationName: 'A', status: 'taking', fromDate: '2026-10-10' };
    for (const changes of [
      { status: 'paused' },
      { fromDate: '2026-02-30' },
      { medicationName: '   ' },
      { medicationName: 'a'.repeat(201) },
      { toDate: '2026-10-11' },
      { recordedBy: 'other' },
    ])
      expect(recordAdherencePeriodRequestSchema.safeParse({ ...valid, ...changes }).success).toBe(false);
  });
});
