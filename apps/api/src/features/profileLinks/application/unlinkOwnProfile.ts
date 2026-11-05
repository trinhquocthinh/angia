import type { ProfileLinkDependencies } from './ports.js';
import type { ProfileLinkOutcome } from '../domain/ProfileLink.js';

// SPEC-050: chỉ chính tài khoản liên kết tự gỡ; không xóa dữ liệu sức khỏe, không đổi đồng thuận.
export function unlinkOwnProfile(
  deps: ProfileLinkDependencies,
  familyId: string,
  accountId: string,
  profileId: string,
): Promise<ProfileLinkOutcome<null, 'ERR_NOT_FOUND'>> {
  return deps.repository.withFamily(familyId, async (store) => {
    const profile = await store.lockProfile(profileId);
    const account = profile && (await store.lockAccount(accountId));
    // Kiểm lại sau khóa: phiên có thể đã cũ nếu quản trị vừa chuyển liên kết.
    if (account?.healthProfileId !== profileId) return { ok: false, code: 'ERR_NOT_FOUND' };
    await store.unlinkAccount(accountId);
    await store.clearReminderRecipients(profileId);
    await store.recordLinkEvent({
      profileId,
      action: 'unlink',
      actorAccountId: accountId,
      actorRole: 'owner',
      fromAccountId: accountId,
      toAccountId: null,
      at: deps.now(),
    });
    return { ok: true, value: null };
  });
}
