import { z } from 'zod';

export const PURGE_PENDING_OBJECTS_QUEUE = 'purge-pending-objects';
export const PURGE_PENDING_OBJECTS_QUEUE_OPTIONS = {
  policy: 'singleton',
  retryLimit: 3,
  retryDelay: 60,
  retryBackoff: true,
} as const;

// familyId tuỳ chọn: job xoá nhà (SPEC-069) vét riêng nhà đã mất dòng families, không liệt kê được.
export const purgePendingObjectsJobSchema = z.object({ familyId: z.uuid().optional() });

export type PurgePendingObjectsJob = z.infer<typeof purgePendingObjectsJobSchema>;
