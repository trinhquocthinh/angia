import { PURGE_PENDING_OBJECTS_QUEUE } from '@angia/contracts';
import type { PgBoss } from 'pg-boss';
import type { PurgeQueue } from '../application/deletionPorts.js';

// Hàng đợi singleton: send trả null khi đã có job chờ — vẫn đủ để dọn dòng object_purges vừa ghi.
export function createPurgeQueue(boss: PgBoss): PurgeQueue {
  return {
    enqueue: async () => {
      await boss.send(PURGE_PENDING_OBJECTS_QUEUE, {});
    },
  };
}
