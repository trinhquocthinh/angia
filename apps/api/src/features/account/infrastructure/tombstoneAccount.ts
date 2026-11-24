import { and, eq, sql } from 'drizzle-orm';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import { writeAdminAuditEvent } from '@src/shared/audit/writeAdminAuditEvent.js';
import {
  accountCredentials,
  accounts,
  dataExports,
  deletedUsernames,
  emailVerificationTokens,
  passwordResetTokens,
  sessions,
} from '@src/shared/db/schema/index.js';

// SPEC-073: giữ dòng accounts (FK lịch sử, nhật ký) nhưng không còn định danh nào.
export async function tombstoneAccount(
  tx: FamilyScopedTx,
  input: { accountId: string; expectedCredentialVersion: number; usernameHash: string },
): Promise<boolean> {
  // Mật khẩu đổi trong lúc xác nhận → coi như sai mật khẩu, không xoá gì.
  const [credential] = await tx
    .delete(accountCredentials)
    .where(
      and(
        eq(accountCredentials.accountId, input.accountId),
        eq(accountCredentials.credentialVersion, input.expectedCredentialVersion),
      ),
    )
    .returning({ accountId: accountCredentials.accountId });
  if (!credential) return false;
  const [tombstone] = await tx
    .update(accounts)
    .set({
      usernameNormalized: null,
      email: null,
      pendingEmail: null,
      emailVerifiedAt: null,
      oidcSubject: null,
      familyId: null,
      familyRole: null,
      healthProfileId: null,
      mustChangePassword: false,
      tempPasswordExpiresAt: null,
      lockReason: null,
      displayName: '',
      isSystemAdmin: false,
      deletedAt: sql`now()`,
    })
    .where(and(eq(accounts.id, input.accountId), sql`${accounts.deletedAt} IS NULL`))
    .returning({ id: accounts.id });
  if (!tombstone) throw new Error('Tài khoản đã đổi trạng thái trong lúc xoá');
  // App không có UPDATE trên bảng này: hash trùng chỉ còn khi dòng cũ đã quá 90 ngày.
  await tx.delete(deletedUsernames).where(eq(deletedUsernames.usernameHash, input.usernameHash));
  await tx.insert(deletedUsernames).values({ usernameHash: input.usernameHash, deletedAt: sql`now()` });
  await tx.delete(sessions).where(eq(sessions.accountId, input.accountId));
  await tx.delete(passwordResetTokens).where(eq(passwordResetTokens.accountId, input.accountId));
  await tx.delete(emailVerificationTokens).where(eq(emailVerificationTokens.accountId, input.accountId));
  // Object ZIP mồ côi do job dọn tệp tải về (E29-S3-T2) vét.
  await tx.delete(dataExports).where(eq(dataExports.accountId, input.accountId));
  await tx.execute(sql`SELECT public.purge_deleted_account_rows(${input.accountId}::uuid)`);
  await writeAdminAuditEvent(tx, {
    actorAccountId: input.accountId,
    targetAccountId: input.accountId,
    action: 'account_deleted',
  });
  return true;
}
