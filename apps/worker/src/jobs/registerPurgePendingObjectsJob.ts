import { PURGE_PENDING_OBJECTS_QUEUE, PURGE_PENDING_OBJECTS_QUEUE_OPTIONS } from '@angia/contracts';
import type { PgBoss } from 'pg-boss';
import type { Logger } from 'pino';
import type { ObjectPurgeDependencies } from '@src/features/objectPurges/application/ports.js';
import { handlePurgePendingObjectsJob } from './handlePurgePendingObjectsJob.js';

export async function registerPurgePendingObjectsJob(
  boss: PgBoss,
  deps: ObjectPurgeDependencies,
  logger: Pick<Logger, 'info' | 'warn' | 'error'>,
): Promise<void> {
  await boss.createQueue(PURGE_PENDING_OBJECTS_QUEUE, PURGE_PENDING_OBJECTS_QUEUE_OPTIONS);
  const handle = handlePurgePendingObjectsJob(deps, logger);
  await boss.work(PURGE_PENDING_OBJECTS_QUEUE, { batchSize: 1 }, async ([job]) => {
    if (job) await handle(job);
  });
  for (const familyId of await deps.repository.listFamilies()) {
    const pending = await deps.repository.withFamily(
      familyId,
      async (store) => (await store.next(1, 10)).length > 0,
    );
    if (pending) {
      if (!(await boss.send(PURGE_PENDING_OBJECTS_QUEUE, {})))
        throw new Error('object_purges_enqueue_failed');
      break;
    }
  }
}
