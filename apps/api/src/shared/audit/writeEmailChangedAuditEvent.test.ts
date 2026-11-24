import { describe, expect, it } from 'vitest';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import { writeAdminAuditEvent } from './writeAdminAuditEvent.js';

describe('Nhật ký xác nhận đổi email', () => {
  it('TC-929: chấp nhận email_changed và chỉ ghi metadata rỗng', async () => {
    const rows: unknown[] = [];
    const tx = {
      insert: () => ({
        values: async (value: unknown) => {
          rows.push(value);
        },
      }),
    };
    await writeAdminAuditEvent(tx as unknown as FamilyScopedTx, {
      action: 'email_changed' as Parameters<typeof writeAdminAuditEvent>[1]['action'],
      actorAccountId: 'account',
      targetAccountId: 'account',
    });
    expect(rows).toEqual([
      {
        actorAccountId: 'account',
        targetAccountId: 'account',
        familyId: undefined,
        targetProfileId: undefined,
        action: 'email_changed',
        metadata: {},
      },
    ]);
  });
});
