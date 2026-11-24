import { and, eq, gt, sql } from 'drizzle-orm';
import type { Database } from '@src/shared/db/createDatabase.js';
import { accounts, deletedUsernames, legalAcceptances } from '@src/shared/db/schema/index.js';
import { createCredentialRepository } from '@src/shared/identity/infrastructure/createCredentialRepository.js';
import { checkRegistrationInvitation } from './checkRegistrationInvitation.js';
import { acceptRegistrationInvitation } from './acceptRegistrationInvitation.js';
import { RegistrationRejected } from './RegistrationRejected.js';
import type {
  AccountRegistrationUnitOfWork,
  NewLocalAccountRecord,
  RegisterLocalAccountRecordOutcome,
  RegisteredLocalAccount,
} from '../application/ports.js';

type TransactionHandle = Parameters<Parameters<Database['transaction']>[0]>[0];

async function insertRegistrationEntities(
  tx: TransactionHandle,
  record: NewLocalAccountRecord,
): Promise<RegisteredLocalAccount> {
  const invitation = await checkRegistrationInvitation(tx, record);
  const [account] = await tx
    .insert(accounts)
    .values({
      usernameNormalized: record.usernameNormalized,
      displayName: record.displayName,
      email: record.email ?? null,
    })
    .returning({
      id: accounts.id,
      usernameNormalized: accounts.usernameNormalized,
      displayName: accounts.displayName,
      familyId: accounts.familyId,
      legalRef: accounts.legalRef,
    });

  if (!account || !account.usernameNormalized) {
    throw new Error('INSERT accounts không trả về tài khoản hợp lệ');
  }

  const credentials = createCredentialRepository(tx);
  await credentials.insert(account.id, record.passwordHash);

  await tx.insert(legalAcceptances).values([
    { accountRef: account.legalRef, versionId: record.legalAcceptance.termsVersionId },
    { accountRef: account.legalRef, versionId: record.legalAcceptance.privacyVersionId },
  ]);

  const familyId =
    invitation?.kind === 'join_family' && record.invitationToken
      ? await acceptRegistrationInvitation(tx, account.id, record.invitationToken)
      : null;
  return {
    id: account.id,
    username: account.usernameNormalized,
    displayName: account.displayName,
    familyId,
  };
}

// Race giữa kiểm trước và INSERT: chỉ unique username mới là ERR_USERNAME_TAKEN, lỗi khác ném tiếp.
function isUsernameUniqueViolation(error: unknown): boolean {
  const target = (error as { cause?: unknown } | null)?.cause ?? error;
  const pgError = target as { code?: string; constraint?: string } | null;
  return pgError?.code === '23505' && pgError.constraint === 'accounts_username_normalized_unique';
}

export function createAccountRegistrationUnitOfWork(
  db: Database,
  hashUsername: (usernameNormalized: string) => string,
): AccountRegistrationUnitOfWork {
  return {
    async isUsernameTaken(usernameNormalized: string): Promise<boolean> {
      const [existing] = await db
        .select({ id: accounts.id })
        .from(accounts)
        .where(eq(accounts.usernameNormalized, usernameNormalized))
        .limit(1);
      return Boolean(existing);
    },

    async register(record: NewLocalAccountRecord): Promise<RegisterLocalAccountRecordOutcome> {
      try {
        const account = await db.transaction(async (tx) => {
          const rejectReservedUsername = async () => {
            const [reserved] = await tx
              .select({ usernameHash: deletedUsernames.usernameHash })
              .from(deletedUsernames)
              .where(
                and(
                  eq(deletedUsernames.usernameHash, hashUsername(record.usernameNormalized)),
                  gt(deletedUsernames.deletedAt, sql`now() - interval '90 days'`),
                ),
              )
              .limit(1);
            if (reserved) throw new RegistrationRejected({ ok: false, code: 'ERR_USERNAME_TAKEN' });
          };
          await rejectReservedUsername();
          const registered = await insertRegistrationEntities(tx, record);
          // INSERT có thể chờ giao dịch xoá giải phóng unique username; đọc lại sau khi giao dịch đó commit.
          await rejectReservedUsername();
          return registered;
        });
        return { ok: true, account };
      } catch (error) {
        if (error instanceof RegistrationRejected) return error.outcome;
        if (isUsernameUniqueViolation(error)) {
          return { ok: false, code: 'ERR_USERNAME_TAKEN' };
        }
        throw error;
      }
    },
  };
}
