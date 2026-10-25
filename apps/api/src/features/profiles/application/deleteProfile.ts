import { profileObjectPrefix } from '@angia/contracts';
import type { ProfileOutcome } from '../domain/HealthProfile.js';
import { matchesConfirmName } from '../domain/matchesConfirmName.js';
import type { ProfileDeletionDeps } from './ports.js';

type DeleteError = 'ERR_NOT_FOUND' | 'ERR_CONFIRMATION_MISMATCH';

// SPEC-007: xóa DB (cascade) và enqueue job vét trong cùng transaction; object S3 xóa sau COMMIT.
// S3 lỗi không hoàn tác được dữ liệu đã xóa → chỉ cảnh báo, job purge-profile-objects dọn nốt.
export async function deleteProfile(
  deps: ProfileDeletionDeps,
  familyId: string,
  profileId: string,
  confirmName: string,
): Promise<ProfileOutcome<void, DeleteError>> {
  const outcome = await deps.repository.withFamily(
    familyId,
    async (store): Promise<ProfileOutcome<void, DeleteError>> => {
      const profile = await store.lockProfile(profileId);
      if (!profile) return { ok: false, code: 'ERR_NOT_FOUND' };
      if (!matchesConfirmName(profile.displayName, confirmName)) {
        return { ok: false, code: 'ERR_CONFIRMATION_MISMATCH' };
      }
      await store.deleteProfile(profileId);
      await store.enqueuePurge({ familyId, profileId });
      return { ok: true, value: undefined };
    },
  );
  if (!outcome.ok) return outcome;
  try {
    await deps.storage.deletePrefix(profileObjectPrefix(familyId, profileId));
  } catch (error) {
    const reason = error instanceof Error ? error.name : 'unknown';
    deps.logger.warn({ familyId, profileId, reason }, 'Chưa xóa xong ảnh của hồ sơ đã xóa; chờ job vét');
  }
  return outcome;
}
