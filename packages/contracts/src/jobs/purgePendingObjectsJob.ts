import { z } from 'zod';

export const PURGE_PENDING_OBJECTS_QUEUE = 'purge-pending-objects';
export const PURGE_PENDING_OBJECTS_QUEUE_OPTIONS = {
  policy: 'singleton',
  retryLimit: 3,
  retryDelay: 60,
  retryBackoff: true,
} as const;

export const purgePendingObjectsJobSchema = z.object({});

export type PurgePendingObjectsJob = z.infer<typeof purgePendingObjectsJobSchema>;
