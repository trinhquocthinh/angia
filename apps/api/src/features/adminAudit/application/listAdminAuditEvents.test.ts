import type { AdminAuditEvent } from '@angia/contracts';
import { describe, expect, it, vi } from 'vitest';
import { listAdminAuditEvents } from './listAdminAuditEvents.js';

const event: AdminAuditEvent = {
  id: 'ab476456-4d26-4efe-a751-5abb4b413975',
  occurredAt: '2026-11-01T00:00:00.123456Z',
  actorAccountId: 'system_admin',
  familyId: null,
  targetAccountId: null,
  targetProfileId: null,
  action: 'family_created',
  metadata: {},
};

describe('SPEC-076: phân trang nhật ký', () => {
  it('TC-841: cursor giữ nguyên thời gian chính xác và id giữa hai trang', async () => {
    const list = vi
      .fn()
      .mockResolvedValueOnce([event, { ...event, id: 'bb476456-4d26-4efe-a751-5abb4b413975' }])
      .mockResolvedValueOnce([]);
    const first = await listAdminAuditEvents({ list }, { limit: 1 });
    expect(first).toMatchObject({ ok: true, value: { items: [event], nextCursor: expect.any(String) } });
    if (!first.ok) throw new Error('Không đọc được trang đầu');
    await listAdminAuditEvents({ list }, { limit: 1, cursor: first.value.nextCursor! });
    expect(list.mock.calls[1]?.[0].before).toEqual({ at: event.occurredAt, id: event.id });
    expect(list.mock.calls[0]?.[0].limit).toBe(2);
  });
  it('TC-841: hết trang trả cursor null', async () => {
    expect(await listAdminAuditEvents({ list: async () => [event] }, { limit: 2 })).toEqual({
      ok: true,
      value: { items: [event], nextCursor: null },
    });
  });
  it('TC-841: cursor hỏng hoặc khoảng thời gian ngược trả ERR_VALIDATION trước truy vấn', async () => {
    const list = vi.fn();
    const invalid = [
      '!',
      '',
      Buffer.from('{}').toString('base64url'),
      Buffer.from(JSON.stringify({ at: event.occurredAt, id: 'sai' })).toString('base64url'),
      Buffer.from(JSON.stringify({ at: event.occurredAt, id: event.id, extra: 1 })).toString('base64url'),
    ];
    for (const cursor of invalid)
      expect(await listAdminAuditEvents({ list }, { limit: 1, cursor })).toEqual({
        ok: false,
        code: 'ERR_VALIDATION',
      });
    expect(
      await listAdminAuditEvents(
        { list },
        { limit: 1, from: '2026-02-01T00:00:00Z', to: '2026-01-01T00:00:00Z' },
      ),
    ).toEqual({ ok: false, code: 'ERR_VALIDATION' });
    expect(list).not.toHaveBeenCalled();
  });
});
