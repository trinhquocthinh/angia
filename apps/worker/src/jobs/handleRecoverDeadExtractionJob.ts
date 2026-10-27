import { ExtractionBusyError } from '@src/features/extraction/application/ExtractionBusyError.js';
import { extractDocumentJobSchema } from '@angia/contracts';
import type { Logger } from 'pino';
import type { ExtractionDependencies } from '@src/features/extraction/application/ports.js';
import {
  recoverDeadExtraction,
  type DeadExtractionOutcome,
} from '@src/features/extraction/application/recoverDeadExtraction.js';

// Job dead-letter mang nguyên payload extract-document; log chỉ ID và kết quả.
export function handleRecoverDeadExtractionJob(
  deps: Pick<ExtractionDependencies, 'repository' | 'budget'>,
  logger: Logger,
) {
  return async (job: { id: string; data: unknown }): Promise<DeadExtractionOutcome> => {
    const { documentId, familyId } = extractDocumentJobSchema.parse(job.data);
    const work = (repository: typeof deps.repository) =>
      recoverDeadExtraction({ ...deps, repository }, { documentId, familyId });
    const outcome: DeadExtractionOutcome = deps.repository.runExclusive
      ? ((await deps.repository.runExclusive(familyId, documentId, work)) ?? failBusy())
      : await work(deps.repository);
    logger.warn({ jobId: job.id, documentId, ...outcome }, 'Đã xử lý job extract-document chết');
    return outcome;
  };
}

function failBusy(): never {
  throw new ExtractionBusyError();
}
