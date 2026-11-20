import { describe, expect, it } from 'vitest';
import { leaveHouseholdRequestSchema } from './leaveHouseholdRequestSchema.js';

describe('SPEC-067: DTO tự rời nhà', () => {
  it('TC-790: chấp nhận body rỗng hoặc lựa chọn giữ/xoá', () => {
    for (const body of [{}, { ownProfileDisposition: 'keep' }, { ownProfileDisposition: 'delete' }])
      expect(leaveHouseholdRequestSchema.safeParse(body).success).toBe(true);
  });
  it('TC-792: từ chối lựa chọn sai và mọi trường thừa', () => {
    for (const body of [
      { ownProfileDisposition: null },
      { ownProfileDisposition: 'other' },
      { accountId: 'other' },
      { ownProfileDisposition: 'keep', familyId: 'other' },
    ])
      expect(leaveHouseholdRequestSchema.safeParse(body).success).toBe(false);
  });
});
