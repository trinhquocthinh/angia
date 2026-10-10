import { createPrivacyRepository } from '@src/features/documentPrivacy/infrastructure/createPrivacyRepository.js';
import { createPrivacyStorage } from '@src/features/documentPrivacy/infrastructure/createPrivacyStorage.js';
import { createPrivacyImageRenderer } from '@src/features/documentPrivacy/infrastructure/createPrivacyImageRenderer.js';
import { handlePrepareOcrImageJob } from '@src/jobs/handlePrepareOcrImageJob.js';
import { registerPrepareOcrImageJob } from '@src/jobs/registerPrepareOcrImageJob.js';
import { v7 as newId } from 'uuid';
import { createApprovedOcrImageReader } from '@src/features/extraction/infrastructure/createApprovedOcrImageReader.js';
import { createDocumentPreviewConverter } from '@src/features/extraction/infrastructure/createDocumentPreviewConverter.js';
import { createPreviewRepository } from '@src/features/documentPreview/infrastructure/createPreviewRepository.js';
import { createPreviewStorage } from '@src/features/documentPreview/infrastructure/createPreviewStorage.js';
import { handleConvertHeicJob } from '@src/jobs/handleConvertHeicJob.js';
import { registerConvertHeicJob } from '@src/jobs/registerConvertHeicJob.js';
import pg from 'pg';
import { pino } from 'pino';
import { createExtractionRepository } from '@src/features/extraction/infrastructure/createExtractionRepository.js';
import { createFakeExtractor } from '@src/features/extraction/infrastructure/createFakeExtractor.js';
import { createFallbackExtractor } from '@src/features/extraction/infrastructure/createFallbackExtractor.js';
import { createHeicImageConverter } from '@src/features/extraction/infrastructure/createHeicImageConverter.js';
import { createOpenRouterExtractor } from '@src/features/extraction/infrastructure/createOpenRouterExtractor.js';
import { createS3ObjectReader } from '@src/features/extraction/infrastructure/createS3ObjectReader.js';
import { createBudgetRequeueRepository } from '@src/features/extraction/infrastructure/createBudgetRequeueRepository.js';
import { handleExtractDocumentJob } from '@src/jobs/handleExtractDocumentJob.js';
import { handleRecoverDeadExtractionJob } from '@src/jobs/handleRecoverDeadExtractionJob.js';
import { registerExtractDocumentJob } from '@src/jobs/registerExtractDocumentJob.js';
import { registerRecoverDeadExtractionJob } from '@src/jobs/registerRecoverDeadExtractionJob.js';
import { registerRequeueAwaitingBudgetJob } from '@src/jobs/registerRequeueAwaitingBudgetJob.js';
import { loadWorkerConfig, type WorkerConfig } from '@src/shared/config/loadWorkerConfig.js';
import { createPgBoss } from '@src/shared/queue/createPgBoss.js';
import { createS3Client } from '@src/shared/storage/createS3Client.js';

// Composition root của worker: pg-boss (role app, migrate:false) + job extract-document (SPEC-009),
// dead-letter phục hồi chứng từ kẹt và job đầu tháng đưa awaiting_budget vào lại hàng đợi (BR-018).
const config = loadWorkerConfig(process.env);
const logger = pino({ level: config.LOG_LEVEL, base: { service: 'angia-worker', stack: config.STACK } });

function createExtractor(workerConfig: WorkerConfig) {
  if (workerConfig.AI_PROVIDER === 'fake') return createFakeExtractor();
  const openRouter = (model: string) =>
    createOpenRouterExtractor({
      baseUrl: workerConfig.OPENROUTER_BASE_URL,
      apiKey: workerConfig.OPENROUTER_API_KEY ?? '',
      model,
    });
  return createFallbackExtractor(
    openRouter(workerConfig.AI_PRIMARY_MODEL),
    openRouter(workerConfig.AI_FALLBACK_MODEL),
  );
}

const pool = new pg.Pool({ connectionString: config.DATABASE_URL, max: 4, connectionTimeoutMillis: 5_000 });
// Client rảnh bị ngắt khi DB khởi động lại: phải bắt lỗi, nếu không tiến trình sẽ sập.
pool.on('error', (error) => logger.warn({ reason: error.message }, 'Kết nối PostgreSQL rảnh bị ngắt'));
const boss = createPgBoss(config.DATABASE_URL, logger);

try {
  await boss.start();
  const extraction = {
    repository: createExtractionRepository(pool),
    budget: {
      estimatedCostUsd: config.AI_ESTIMATED_COST_USD,
      defaultMonthlyCapUsd: config.AI_DEFAULT_MONTHLY_CAP_USD,
      now: () => new Date(),
    },
    storage: createS3ObjectReader(createS3Client(config), config.S3_BUCKET),
    images: createHeicImageConverter(),
    extractor: createExtractor(config),
    ocrImages: createApprovedOcrImageReader(createS3ObjectReader(createS3Client(config), config.S3_BUCKET)),
  };
  await registerExtractDocumentJob(boss, handleExtractDocumentJob(extraction, logger));
  await registerRecoverDeadExtractionJob(boss, handleRecoverDeadExtractionJob(extraction, logger));
  await registerRequeueAwaitingBudgetJob(boss, createBudgetRequeueRepository(pool, boss), logger);
  await registerConvertHeicJob(
    boss,
    handleConvertHeicJob(
      {
        repository: createPreviewRepository(pool),
        storage: createPreviewStorage(createS3Client(config), config.S3_BUCKET),
        images: createDocumentPreviewConverter(),
        newId,
      },
      logger,
    ),
  );
  await registerPrepareOcrImageJob(
    boss,
    handlePrepareOcrImageJob(
      {
        repository: createPrivacyRepository(pool),
        storage: createPrivacyStorage(createS3Client(config), config.S3_BUCKET),
        images: createPrivacyImageRenderer(),
        newId,
      },
      logger,
    ),
  );
  logger.info(
    { aiProvider: config.AI_PROVIDER },
    'Worker sẵn sàng — đã đăng ký job convert-heic, prepare-ocr-image, extract-document và ngân sách AI',
  );
} catch (error) {
  logger.error({ reason: (error as Error).message }, 'Worker không khởi động được');
  process.exitCode = 1;
  await boss.stop({ graceful: false }).catch(() => undefined);
  await pool.end();
}

const shutdown = (signal: string) => {
  logger.info({ signal }, 'Đang dừng worker');
  void boss
    .stop({ graceful: true })
    .finally(() => pool.end())
    .finally(() => process.exit(0));
};
process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
