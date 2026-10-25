import { profileObjectPrefix, type PurgeProfileObjectsJob } from '@angia/contracts';
import type { PurgeDependencies, PurgeResult } from './ports.js';

// BR-010: vét object còn sót sau khi API xóa hồ sơ. Lan can: hồ sơ còn tồn tại thì không xóa gì
// (job giả/nhầm không được xóa ảnh đang dùng). Lỗi S3 ném ra để pg-boss thử lại.
export async function purgeProfileObjects(
  deps: PurgeDependencies,
  job: PurgeProfileObjectsJob,
): Promise<PurgeResult> {
  if (await deps.repository.profileExists(job.familyId, job.profileId)) {
    return { outcome: 'skipped', removed: 0 };
  }
  let removed = 0;
  for await (const { key } of deps.storage.list(profileObjectPrefix(job.familyId, job.profileId))) {
    await deps.storage.delete(key);
    removed += 1;
  }
  return { outcome: 'purged', removed };
}
