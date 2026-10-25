import { CONVERT_HEIC_QUEUE, type ConvertHeicJob } from '@angia/contracts';
import type { PgBoss } from 'pg-boss';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import { toPgBossDb } from '@src/shared/queue/toPgBossDb.js';
export type PreviewQueue = (tx: FamilyScopedTx, job: ConvertHeicJob) => Promise<void>;
export function createPreviewQueue(boss: PgBoss): PreviewQueue {
  return async (tx, job) => {
    await boss.send(CONVERT_HEIC_QUEUE, job, { db: toPgBossDb(tx) });
  };
}
