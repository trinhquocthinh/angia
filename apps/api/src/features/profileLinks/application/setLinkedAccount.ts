import type { ProfileLinkDependencies } from './ports.js';
import type { AdminProfileLink, ProfileLinkOutcome } from '../domain/ProfileLink.js';

interface SetLinkedAccountInput {
  familyId: string;
  profileId: string;
  accountId: string | null;
  actorId: string;
}
// SPEC-050: quản trị gỡ (accountId null) hoặc chuyển liên kết, không cần tài khoản mới xác nhận.
// Không xóa dữ liệu sức khỏe, không đổi đồng thuận. Khóa hồ sơ → tài khoản đích như các luồng link khác.
export function setLinkedAccount(
  deps: ProfileLinkDependencies,
  input: SetLinkedAccountInput,
): Promise<ProfileLinkOutcome<AdminProfileLink>> {
  const { familyId, profileId, accountId, actorId } = input;
  return deps.repository.withFamily(familyId, async (store) => {
    const profile = await store.lockProfile(profileId);
    if (!profile) return { ok: false, code: 'ERR_NOT_FOUND' };
    const target = accountId ? await store.lockAccount(accountId) : null;
    if (accountId && !target) return { ok: false, code: 'ERR_NOT_FOUND' };
    if (target?.healthProfileId) return { ok: false, code: 'ERR_PROFILE_ALREADY_LINKED' };
    const current = await store.findLinkedAccount(profileId);
    const value = {
      id: profile.id,
      displayName: profile.displayName,
      linkedAccount: target && { id: target.id, displayName: target.displayName },
    };
    if (!current && !target) return { ok: true, value };
    // health_profile_id là UNIQUE theo hồ sơ nên phải gỡ tài khoản cũ trước.
    if (current) await store.unlinkAccount(current.id);
    if (target) await store.linkAccount(target.id, profileId);
    await store.clearReminderRecipients(profileId);
    // Hồ sơ đã có chủ thì link đang chờ không còn ý nghĩa; không để nó sống lại khi gỡ sau này.
    await store.revokePending(profileId, deps.now());
    await store.recordLinkEvent({
      profileId,
      action: target ? 'transfer' : 'unlink',
      actorAccountId: actorId,
      actorRole: 'admin',
      fromAccountId: current?.id ?? null,
      toAccountId: target?.id ?? null,
      at: deps.now(),
    });
    return { ok: true, value };
  });
}
