import { and, eq, isNull } from 'drizzle-orm';
import type { PgBoss } from 'pg-boss';
import type { Database } from '@src/shared/db/createDatabase.js';
import { accounts } from '@src/shared/db/schema/index.js';
import { type FamilyScopedTx, withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import { leaveHouseholdInTx } from '../../household/infrastructure/leaveHouseholdInTx.js';
import type { AccountDeletionStore, AccountDeletionStoreResult } from '../application/deletionPorts.js';
import { tombstoneAccount } from './tombstoneAccount.js';

type DeletionInput = Parameters<AccountDeletionStore['deleteAccount']>[0];

// Ném ra để rollback phần rời nhà đã chạy khi credential đổi giữa chừng.
class StaleCredential extends Error {}

async function finish(
  tx: FamilyScopedTx,
  input: DeletionInput,
  familyId: string | null,
  deletedProfileId: string | null,
) {
  if (!(await tombstoneAccount(tx, input))) throw new StaleCredential();
  return { ok: true, familyId, deletedProfileId } as const;
}

export function createAccountDeletions(db: Database, boss: PgBoss): AccountDeletionStore {
  async function run(input: DeletionInput): Promise<AccountDeletionStoreResult> {
    // Nhà lấy từ DB, không từ phiên; nhánh có nhà kiểm lại dưới khoá trong lockHouseholdLeave.
    const [account] = await db
      .select({ familyId: accounts.familyId })
      .from(accounts)
      .where(and(eq(accounts.id, input.accountId), isNull(accounts.deletedAt)));
    if (!account) return { ok: false, code: 'ERR_INVALID_CREDENTIALS' };
    const familyId = account.familyId;
    if (!familyId)
      return db.transaction(async (tx) => {
        const [locked] = await tx
          .select({ familyId: accounts.familyId })
          .from(accounts)
          .where(eq(accounts.id, input.accountId))
          .for('update');
        if (locked?.familyId) throw new Error('Tài khoản vừa vào nhà trong lúc xoá');
        return finish(tx, input, null, null);
      });
    return withFamilyScope(db, familyId, async (tx) => {
      const left = await leaveHouseholdInTx(
        tx,
        boss,
        { accountId: input.accountId, familyId, role: null },
        { ownProfileDisposition: input.ownProfileDisposition },
      );
      if (!left.ok) return mapLeaveFailure(left);
      return finish(tx, input, familyId, left.deletedProfileId ?? null);
    });
  }
  return {
    async deleteAccount(input) {
      try {
        return await run(input);
      } catch (error) {
        if (error instanceof StaleCredential) return { ok: false, code: 'ERR_INVALID_CREDENTIALS' };
        throw error;
      }
    },
  };
}

function mapLeaveFailure(
  left: Extract<Awaited<ReturnType<typeof leaveHouseholdInTx>>, { ok: false }>,
): AccountDeletionStoreResult {
  switch (left.code) {
    case 'ERR_OWNER_MUST_TRANSFER':
    case 'ERR_OWNER_MUST_DELETE_FAMILY':
    case 'ERR_VALIDATION':
      return { ok: false, code: left.code };
    case 'ERR_LAST_GUARDIAN':
      return { ok: false, code: left.code, ...(left.details ? { details: left.details } : {}) };
    default:
      // Bị khoá, là SystemAdmin hoặc nhà đổi giữa chừng: không xoá, trả như sai xác nhận.
      return { ok: false, code: 'ERR_INVALID_CREDENTIALS' };
  }
}
