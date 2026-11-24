import { createHash } from 'node:crypto';
import { and, eq, gt, isNull } from 'drizzle-orm';
import type { PgBoss } from 'pg-boss';
import type { Database } from '@src/shared/db/createDatabase.js';
import { accounts, passwordResetTokens } from '@src/shared/db/schema/index.js';
import type { EmailPasswordResets } from '../application/passwordResetPorts.js';
import { createPasswordResetRequester } from './createPasswordResetRequester.js';
import { createPasswordResetConsumer } from './createPasswordResetConsumer.js';

export function createEmailPasswordResets(
  db: Database,
  boss: PgBoss,
  appBaseUrl: string,
): EmailPasswordResets {
  return {
    request: createPasswordResetRequester(db, boss, appBaseUrl),
    consume: createPasswordResetConsumer(db),
    findValid: async (token, now) => {
      const [account] = await db
        .select({ accountId: accounts.id, usernameNormalized: accounts.usernameNormalized })
        .from(passwordResetTokens)
        .innerJoin(accounts, eq(accounts.id, passwordResetTokens.accountId))
        .where(
          and(
            eq(passwordResetTokens.tokenHash, createHash('sha256').update(token).digest('hex')),
            isNull(passwordResetTokens.usedAt),
            gt(passwordResetTokens.expiresAt, now),
            isNull(accounts.lockedAt),
          ),
        );
      return account ?? null;
    },
  };
}
