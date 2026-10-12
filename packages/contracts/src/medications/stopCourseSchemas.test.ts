import { describe, expect, it } from 'vitest';
import { stopCourseRequestSchema } from './stopCourseSchemas.js';
describe('Hợp đồng dừng đợt thuốc', () => {
  it('TC-051: chỉ nhận ngày lịch hợp lệ và trường của lệnh dừng', () => {
    expect(stopCourseRequestSchema.parse({ stopDate: '2026-10-01' })).toEqual({ stopDate: '2026-10-01' });
    for (const body of [
      { stopDate: '2026-02-30' },
      { stopDate: '2026-10-01', status: 'stopped' },
      { stopDate: '2026-10-01', familyId: 'other' },
      {},
    ])
      expect(stopCourseRequestSchema.safeParse(body).success).toBe(false);
  });
});
