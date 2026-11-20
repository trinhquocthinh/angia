import { and, asc, desc, eq, isNull, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { accounts, families } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { HouseholdMember, MembershipActor } from '../application/membershipPorts.js';

export async function readHouseholdMembers(
  tx: FamilyScopedTx,
  actor: MembershipActor & { familyId: string },
) {
  const caller = alias(accounts, 'caller');
  const isOwner = sql<boolean>`coalesce(${families.ownerAccountId} = ${accounts.id}, false)`;
  // Kiểm lại membership trong cùng câu SELECT để không đọc nhà cũ nếu phiên đã đổi nhà.
  const value = await tx
    .select({
      accountId: accounts.id,
      displayName: accounts.displayName,
      role: sql<HouseholdMember['role']>`${accounts.familyRole}`,
      isOwner,
      isSelf: sql<boolean>`${accounts.id} = ${actor.accountId}`,
    })
    .from(accounts)
    .innerJoin(families, eq(families.id, accounts.familyId))
    .innerJoin(
      caller,
      and(eq(caller.id, actor.accountId), eq(caller.familyId, accounts.familyId), isNull(caller.lockedAt)),
    )
    .where(eq(accounts.familyId, actor.familyId))
    .orderBy(
      desc(isOwner),
      sql`CASE WHEN ${accounts.familyRole} = 'main' THEN 0 ELSE 1 END`,
      asc(accounts.displayName),
      asc(accounts.id),
    );
  if (!value.length) return { ok: false, code: 'ERR_FORBIDDEN' } as const;
  return { ok: true, value } as const;
}
