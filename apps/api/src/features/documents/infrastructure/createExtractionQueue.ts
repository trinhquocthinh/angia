import { EXTRACT_DOCUMENT_QUEUE, type ExtractDocumentJob } from '@angia/contracts';
import type { PgBoss } from 'pg-boss';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import { toPgBossDb } from '@src/shared/queue/toPgBossDb.js';

export type ExtractionQueue = (tx: FamilyScopedTx, job: ExtractDocumentJob) => Promise<void>;

export function createExtractionQueue(boss: PgBoss): ExtractionQueue {
  return async (tx, job) => {
    await boss.send(EXTRACT_DOCUMENT_QUEUE, job, { db: toPgBossDb(tx) });
  };
}
