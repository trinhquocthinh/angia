import { describe, expect, it } from 'vitest';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import { writeAdminAuditEvent } from './writeAdminAuditEvent.js';

describe('SPEC-075: nhật ký khoá tài khoản', () => {
  it.each(['account_locked', 'account_unlocked'] as const)(
    'TC-835/836: chấp nhận %s và bỏ lý do khỏi metadata',
    async (action) => {
      const rows: unknown[] = [];
      const tx = {
        insert: () => ({
          values: async (value: unknown) => {
            rows.push(value);
          },
        }),
      };
      await writeAdminAuditEvent(tx as unknown as FamilyScopedTx, {
        actorAccountId: 'actor',
        targetAccountId: 'target',
        familyId: 'family',
        action: action as Parameters<typeof writeAdminAuditEvent>[1]['action'],
        ...{ metadata: { reason: 'Bí mật' }, reason: 'Bí mật' },
      });
      expect(rows).toEqual([
        {
          actorAccountId: 'actor',
          targetAccountId: 'target',
          familyId: 'family',
          targetProfileId: undefined,
          action,
          metadata: {},
        },
      ]);
    },
  );
});
