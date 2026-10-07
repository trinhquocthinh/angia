import { asc, eq, sql } from 'drizzle-orm';
import type { Database } from '@src/shared/db/createDatabase.js';
import { accounts, families } from '@src/shared/db/schema/index.js';
import type { FamilyAdminRepository, MembershipStore } from '../application/ports.js';
import type { MemberAccount } from '../domain/Membership.js';

type Executor = Pick<Database, 'select' | 'update'>;

const memberAccountColumns = {
  id: accounts.id,
  displayName: accounts.displayName,
  isSystemAdmin: accounts.isSystemAdmin,
  familyId: accounts.familyId,
  role: accounts.familyRole,
};

async function updateAccount(
  tx: Executor,
  accountId: string,
  patch: Partial<typeof accounts.$inferInsert>,
): Promise<MemberAccount> {
  const [row] = await tx
    .update(accounts)
    .set(patch)
    .where(eq(accounts.id, accountId))
    .returning(memberAccountColumns);
  if (!row) {
    throw new Error('UPDATE accounts không trả về dòng nào');
  }
  return row;
}

function createMembershipStore(tx: Executor): MembershipStore {
  return {
    async lockAccount(accountId) {
      const [row] = await tx
        .select(memberAccountColumns)
        .from(accounts)
        .where(eq(accounts.id, accountId))
        .for('update');
      return row ?? null;
    },

    async lockFamilyMembers(familyId) {
      const [family] = await tx
        .select({ id: families.id })
        .from(families)
        .where(eq(families.id, familyId))
        .for('update');
      if (!family) {
        return null;
      }
      const [counts] = await tx
        .select({
          total: sql<number>`count(*)::int`,
          mains: sql<number>`(count(*) FILTER (WHERE ${accounts.familyRole} = 'main'))::int`,
        })
        .from(accounts)
        .where(eq(accounts.familyId, familyId));
      return counts ?? { total: 0, mains: 0 };
    },

    assign: (accountId, familyId, role) => updateAccount(tx, accountId, { familyId, familyRole: role }),
    changeRole: (accountId, role) => updateAccount(tx, accountId, { familyRole: role }),
    remove: (accountId) =>
      updateAccount(tx, accountId, { familyId: null, familyRole: null, healthProfileId: null }),
  };
}

// families/accounts không áp RLS (cấu trúc nhóm, không phải dữ liệu sức khỏe) nên chạy thẳng trên role app.
export function createFamilyAdminRepository(db: Database): FamilyAdminRepository {
  return {
    async createFamily(name) {
      const [row] = await db.insert(families).values({ name }).returning();
      if (!row) {
        throw new Error('INSERT families không trả về dòng nào');
      }
      return row;
    },

    listFamilies: () => db.select().from(families).orderBy(asc(families.createdAt), asc(families.id)),

    listAccounts: () =>
      db.select(memberAccountColumns).from(accounts).orderBy(asc(accounts.createdAt), asc(accounts.id)),

    inTransaction: (work) => db.transaction((tx) => work(createMembershipStore(tx))),
  };
}
