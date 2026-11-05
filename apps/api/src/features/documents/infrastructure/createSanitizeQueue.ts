import { SANITIZE_DOCUMENT_IMAGE_QUEUE, type SanitizeDocumentImageJob } from '@angia/contracts';
import type { PgBoss } from 'pg-boss';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import { toPgBossDb } from '@src/shared/queue/toPgBossDb.js';

export type SanitizeQueue = (tx: FamilyScopedTx, job: SanitizeDocumentImageJob) => Promise<void>;
export function createSanitizeQueue(boss: PgBoss): SanitizeQueue {
  return async (tx, job) => {
    const id = await boss.send(SANITIZE_DOCUMENT_IMAGE_QUEUE, job, {
      id: job.documentId,
      db: toPgBossDb(tx),
    });
    if (!id) throw new Error('Không tạo được job làm sạch ảnh');
  };
}
