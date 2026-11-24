import { asc, eq, or } from 'drizzle-orm';
import { accounts, families } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';

type Failure = {
  ok: false;
  code: 'ERR_UNAUTHENTICATED' | 'ERR_FORBIDDEN' | 'ERR_NOT_FOUND' | 'ERR_OWNER_PROTECTED';
};

// Dùng chung thứ tự khoá và kiểm quyền cho đổi vai trò/gỡ thành viên/đặt lại mật khẩu.
export async function lockFamilyMemberChange(
  tx: FamilyScopedTx,
  actor: { accountId: string; familyId: string },
  targetId: string,
): Promise<{ ok: true; target: typeof accounts.$inferSelect } | Failure> {
  // Khoá account theo UUID trước family; khoá cả nhà vì trigger giám hộ cập nhật account khác.
  const members = await tx
    .select()
    .from(accounts)
    .where(or(eq(accounts.familyId, actor.familyId), eq(accounts.id, actor.accountId)))
    .orderBy(asc(accounts.id))
    .for('update');
  const caller = members.find((row) => row.id === actor.accountId);
  if (!caller || caller.lockedAt) return { ok: false, code: 'ERR_UNAUTHENTICATED' };
  if (
    caller.familyId !== actor.familyId ||
    caller.familyRole !== 'main' ||
    caller.isSystemAdmin ||
    targetId === actor.accountId
  )
    return { ok: false, code: 'ERR_FORBIDDEN' };
  const [family] = await tx
    .select({ ownerId: families.ownerAccountId })
    .from(families)
    .where(eq(families.id, actor.familyId))
    .for('update');
  const target = members.find((row) => row.id === targetId && row.familyId === actor.familyId);
  if (!family || !target) return { ok: false, code: 'ERR_NOT_FOUND' };
  if (family.ownerId === targetId) return { ok: false, code: 'ERR_OWNER_PROTECTED' };
  return { ok: true, target };
}
