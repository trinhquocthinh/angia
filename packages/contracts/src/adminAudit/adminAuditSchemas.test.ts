import { describe, expect, it } from 'vitest';
import { adminAuditEventSchema, adminAuditQuerySchema } from './adminAuditSchemas.js';

describe('SPEC-076: hợp đồng đọc nhật ký', () => {
  it('TC-841: kiểm tra bộ lọc, giới hạn và khoảng thời gian', () => {
    expect(adminAuditQuerySchema.parse({}).limit).toBe(50);
    for (const input of [
      { limit: 0 },
      { limit: 101 },
      { familyId: 'sai' },
      { accountId: 'sai' },
      { action: 'sai' },
      { from: 'hôm nay' },
      { from: '2026-02-01T00:00:00Z', to: '2026-01-01T00:00:00Z' },
    ]) {
      expect(adminAuditQuerySchema.safeParse(input).success).toBe(false);
    }
  });
  it('TC-841: so sánh thời gian giữ microsecond và hiểu múi giờ', () => {
    expect(
      adminAuditQuerySchema.safeParse({
        from: '2026-11-01T00:00:00.123457Z',
        to: '2026-11-01T00:00:00.123456Z',
      }).success,
    ).toBe(false);
    expect(
      adminAuditQuerySchema.safeParse({
        from: '2026-11-01T07:00:00.123456+07:00',
        to: '2026-11-01T00:00:00.123457Z',
      }).success,
    ).toBe(true);
  });
  it('TC-841: sự kiện strict và chấp nhận actor hệ thống', () => {
    const event = {
      id: 'ab476456-4d26-4efe-a751-5abb4b413975',
      occurredAt: '2026-11-01T00:00:00.123456Z',
      actorAccountId: 'system_admin',
      familyId: null,
      targetAccountId: null,
      targetProfileId: null,
      action: 'family_created',
      metadata: {},
    };
    expect(adminAuditEventSchema.parse(event)).toEqual(event);
    expect(adminAuditEventSchema.safeParse({ ...event, secret: 'bí mật' }).success).toBe(false);
    expect(adminAuditEventSchema.safeParse({ ...event, actorAccountId: 'sai' }).success).toBe(false);
  });
});
