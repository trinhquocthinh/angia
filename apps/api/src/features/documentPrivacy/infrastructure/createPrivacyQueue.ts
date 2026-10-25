import {
  PREPARE_OCR_IMAGE_QUEUE,
  EXTRACT_DOCUMENT_QUEUE,
  type PrepareOcrImageJob,
  type ExtractDocumentJob,
} from '@angia/contracts';
import type { PgBoss } from 'pg-boss';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import { toPgBossDb } from '@src/shared/queue/toPgBossDb.js';
import type { PrivacyQueueReader } from '../application/ports.js';
export interface PrivacyQueue extends PrivacyQueueReader {
  prepare(tx: FamilyScopedTx, job: PrepareOcrImageJob): Promise<void>;
  extract(tx: FamilyScopedTx, job: ExtractDocumentJob): Promise<void>;
}
export function createPrivacyQueue(boss: PgBoss): PrivacyQueue {
  return {
    prepare: async (tx, job) => {
      const id = await boss.send(PREPARE_OCR_IMAGE_QUEUE, job, { id: job.draftId, db: toPgBossDb(tx) });
      if (!id) throw new Error('Không tạo được việc chuẩn bị ảnh');
    },
    extract: async (tx, job) => {
      const id = await boss.send(EXTRACT_DOCUMENT_QUEUE, job, { db: toPgBossDb(tx) });
      if (!id) throw new Error('Không tạo được việc đọc chứng từ');
    },
    state: async (draftId) => (await boss.getJobById(PREPARE_OCR_IMAGE_QUEUE, draftId))?.state ?? null,
  };
}
