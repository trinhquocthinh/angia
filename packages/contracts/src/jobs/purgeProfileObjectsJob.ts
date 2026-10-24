import { z } from 'zod';

// BR-010/SPEC-007: API enqueue cùng transaction xóa hồ sơ, trễ 10 phút để vét object worker `put` muộn
// hoặc phần xóa ngay bị lỗi. API và worker cùng createQueue với options này.
export const PURGE_PROFILE_OBJECTS_QUEUE = 'purge-profile-objects';
export const PURGE_PROFILE_OBJECTS_QUEUE_OPTIONS = {
  retryLimit: 5,
  retryDelay: 60,
  retryBackoff: true,
} as const;
export const PURGE_PROFILE_OBJECTS_DELAY_SECONDS = 600;

export const purgeProfileObjectsJobSchema = z.object({ familyId: z.uuid(), profileId: z.uuid() });
export type PurgeProfileObjectsJob = z.infer<typeof purgeProfileObjectsJobSchema>;

// Kết thúc bằng "/" để tiền tố một hồ sơ không bao giờ khớp khóa của hồ sơ khác.
export function profileObjectPrefix(familyId: string, profileId: string): string {
  return `families/${familyId}/profiles/${profileId}/`;
}
