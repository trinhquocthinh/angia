import { describe, expect, it } from 'vitest';
import { adminAccountDetailSchema, adminAccountLockRequestSchema } from './accountLockSchemas.js';

describe('SPEC-075: hợp đồng khoá tài khoản', () => {
  it('TC-837: lý do trim và giới hạn 1–200, không nhận trường thừa', () => {
    expect(adminAccountLockRequestSchema.parse({ reason: '  Lý do  ' })).toEqual({ reason: 'Lý do' });
    expect(adminAccountLockRequestSchema.safeParse({ reason: 'x'.repeat(200) }).success).toBe(true);
    for (const body of [
      { reason: '' },
      { reason: '   ' },
      { reason: 'x'.repeat(201) },
      { reason: 'Lý do', extra: 1 },
      { reason: 1 },
      {},
    ]) {
      expect(adminAccountLockRequestSchema.safeParse(body).success).toBe(false);
    }
  });
  it('TC-837: chi tiết chỉ nhận năm trường, cho phép username và nhà rỗng', () => {
    const view = {
      id: 'ab476456-4d26-4efe-a751-5abb4b413975',
      username: null,
      displayName: 'Người thử',
      familyName: null,
      lockedAt: null,
    };
    expect(adminAccountDetailSchema.parse(view)).toEqual(view);
    for (const field of ['healthProfileId', 'lockReason', 'email', 'hash', 'role']) {
      expect(adminAccountDetailSchema.safeParse({ ...view, [field]: 'bí mật' }).success).toBe(false);
    }
  });
});
