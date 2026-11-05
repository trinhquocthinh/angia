import { describe, expect, it } from 'vitest';
import { myRevisitReminderSchema } from './myRevisitReminderSchemas.js';

const value = {
  id: '0199a000-0000-7000-8000-000000000001',
  revisitDate: '2026-11-20',
  offset: 'two_days_before',
  profileId: '0199a000-0000-7000-8000-000000000002',
  profileName: 'Mẹ',
  prescriptions: [{ id: '0199a000-0000-7000-8000-000000000003', issuedDate: '2026-11-01', facility: null }],
  canOpenSummary: false,
};

describe('Hợp đồng chi tiết nhắc tái khám', () => {
  it('TC-479: hỗ trợ hai mốc và cơ sở y tế trống; từ chối ngày, mốc và ID sai', () => {
    expect(myRevisitReminderSchema.safeParse(value).success).toBe(true);
    expect(myRevisitReminderSchema.safeParse({ ...value, offset: 'same_day' }).success).toBe(true);
    for (const override of [
      { offset: 'tomorrow' },
      { revisitDate: '2026-02-30' },
      { id: 'invalid' },
      { canOpenSummary: 'true' },
    ])
      expect(myRevisitReminderSchema.safeParse({ ...value, ...override }).success).toBe(false);
  });
});
