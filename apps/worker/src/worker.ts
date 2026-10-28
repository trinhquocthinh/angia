import { createBillingRepository } from '@src/features/aiBilling/infrastructure/createBillingRepository.js';
import { createProviderBillingReader } from '@src/features/aiBilling/infrastructure/createProviderBillingReader.js';
import { registerSyncProviderBillingJob } from '@src/jobs/registerSyncProviderBillingJob.js';
import { createAiRoutingReader } from '@src/features/aiRouting/infrastructure/createAiRoutingReader.js';
import { createExtractionAttempts } from '@src/features/aiRouting/infrastructure/createExtractionAttempts.js';
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
import { createHeicImageConverter } from '@src/features/extraction/infrastructure/createHeicImageConverter.js';
import { createS3ObjectReader } from '@src/features/extraction/infrastructure/createS3ObjectReader.js';
import { createBudgetRequeueRepository } from '@src/features/extraction/infrastructure/createBudgetRequeueRepository.js';
import { handleExtractDocumentJob } from '@src/jobs/handleExtractDocumentJob.js';
import { handleRecoverDeadExtractionJob } from '@src/jobs/handleRecoverDeadExtractionJob.js';
import { registerExtractDocumentJob } from '@src/jobs/registerExtractDocumentJob.js';
import { registerRecoverDeadExtractionJob } from '@src/jobs/registerRecoverDeadExtractionJob.js';
import { registerRequeueAwaitingBudgetJob } from '@src/jobs/registerRequeueAwaitingBudgetJob.js';
import { registerSweepOrphanObjectsJob } from '@src/jobs/registerSweepOrphanObjectsJob.js';
import { registerPurgeProfileObjectsJob } from '@src/jobs/registerPurgeProfileObjectsJob.js';
import { createPurgeRepository } from '@src/features/purgeProfileObjects/infrastructure/createPurgeRepository.js';
import { createOrphanRepository } from '@src/features/orphanObjects/infrastructure/createOrphanRepository.js';
import { createOrphanStorage } from '@src/features/orphanObjects/infrastructure/createOrphanStorage.js';
import { createReminderRepository } from '@src/features/reminderGeneration/infrastructure/createReminderRepository.js';
import { createWebPushSender } from '@angia/web-push';
import { createDeliveryRepository } from '@src/features/reminderDelivery/infrastructure/createDeliveryRepository.js';
import { createReminderNotifier } from '@src/features/reminderDelivery/infrastructure/createReminderNotifier.js';
import { registerSendRemindersJob } from '@src/jobs/registerSendRemindersJob.js';
import { registerGenerateRemindersJob } from '@src/jobs/registerGenerateRemindersJob.js';
import { createAccountSessionStore } from '@src/features/idpSessionSync/infrastructure/createAccountSessionStore.js';
import { createAuthentikDirectory } from '@src/features/idpSessionSync/infrastructure/createAuthentikDirectory.js';
import {
  registerSyncIdpSessionsJob,
  unregisterSyncIdpSessionsJob,
} from '@src/jobs/registerSyncIdpSessionsJob.js';
import { loadWorkerConfig, type WorkerConfig } from '@src/shared/config/loadWorkerConfig.js';
import { createPgBoss } from '@src/shared/queue/createPgBoss.js';
import { createS3Client } from '@src/shared/storage/createS3Client.js';

// Composition root của worker: pg-boss (role app, migrate:false) + job extract-document (SPEC-009),
// dead-letter phục hồi chứng từ kẹt, job đầu tháng đưa awaiting_budget vào lại hàng đợi (BR-018)
// job hằng ngày dọn object S3 mồ côi (BR-044), job 00:05 sinh lời nhắc thuốc, job mỗi phút gửi lời nhắc qua Web Push (SPEC-027; tắt nếu thiếu WEB_PUSH_*) và job 5 phút đồng bộ phiên với Authentik (BR-045).
const config = loadWorkerConfig(process.env);
const logger = pino({ level: config.LOG_LEVEL, base: { service: 'angia-worker', stack: config.STACK } });

// BR-045/SPEC-033: config bắt buộc đủ biến ở sit/prod; dev không có token thì tắt job và gỡ lịch cũ.
// Trả về job có được bật hay không.
async function registerIdpSessionSync(workerConfig: WorkerConfig, pool: pg.Pool): Promise<boolean> {
  const {
    AUTHENTIK_URL: baseUrl,
    AUTHENTIK_API_TOKEN: token,
    IDP_ACCESS_GROUP_NAME: accessGroupName,
  } = workerConfig;
  if (!baseUrl || !token || !accessGroupName) {
    await unregisterSyncIdpSessionsJob(boss);
    logger.info('Chưa cấu hình AUTHENTIK_API_TOKEN — tắt đồng bộ phiên với IdP');
    return false;
  }
  await registerSyncIdpSessionsJob(
    boss,
    { directory: createAuthentikDirectory({ baseUrl, token }), store: createAccountSessionStore(pool) },
    {
      accessGroupName,
      adminGroupName: workerConfig.ADMIN_GROUP_NAME,
      maxRevokes: workerConfig.IDP_SYNC_MAX_REVOKES,
      dryRun: workerConfig.IDP_SYNC_DRY_RUN,
      now: () => new Date(),
    },
    logger,
  );
  return true;
}

const pool = new pg.Pool({ connectionString: config.DATABASE_URL, max: 4, connectionTimeoutMillis: 5_000 });
// Client rảnh bị ngắt khi DB khởi động lại: phải bắt lỗi, nếu không tiến trình sẽ sập.
pool.on('error', (error) => logger.warn({ reason: error.message }, 'Kết nối PostgreSQL rảnh bị ngắt'));
const boss = createPgBoss(config.DATABASE_URL, logger);

try {
  await boss.start();
  const billing = createBillingRepository(pool);
  await billing.register(config.AI_BILLING_SOURCES_JSON);
  await registerSyncProviderBillingJob(
    boss,
    config.AI_BILLING_SOURCES_JSON,
    billing,
    createProviderBillingReader(),
    logger,
  );
  const billingSource = config.AI_BILLING_SOURCES_JSON.find(
    (source) => source.provider === 'openrouter' && source.apiKey === config.OPENROUTER_API_KEY?.trim(),
  );
  const extraction = {
    repository: createExtractionRepository(pool),
    budget: {
      defaultMonthlyCapUsd: config.AI_DEFAULT_MONTHLY_CAP_USD,
      defaultMonthlyScans: config.SCAN_QUOTA_DEFAULT_MONTHLY,
      now: () => new Date(),
    },
    storage: createS3ObjectReader(createS3Client(config), config.S3_BUCKET),
    images: createHeicImageConverter(),
    extractor: createFakeExtractor(),
    ocrImages: createApprovedOcrImageReader(createS3ObjectReader(createS3Client(config), config.S3_BUCKET)),
  };
  const attempts = createExtractionAttempts(extraction, createAiRoutingReader(pool), {
    runMode: config.AI_RUN_MODE,
    openRouterBaseUrl: config.OPENROUTER_BASE_URL,
    openRouterApiKey: config.OPENROUTER_API_KEY,
    observeCharge: billingSource ? (charge) => billing.observe(billingSource, charge) : undefined,
    onBillingObservationError: (code) => logger.warn({ code }, 'Không thể ghi metadata phí OpenRouter'),
  });
  await registerExtractDocumentJob(boss, handleExtractDocumentJob(extraction, logger, attempts));
  await registerRecoverDeadExtractionJob(boss, handleRecoverDeadExtractionJob(extraction, logger));
  await registerRequeueAwaitingBudgetJob(
    boss,
    createBudgetRequeueRepository(pool, boss),
    extraction.budget,
    logger,
  );
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
  await registerSweepOrphanObjectsJob(
    boss,
    {
      repository: createOrphanRepository(pool),
      storage: createOrphanStorage(createS3Client(config), config.S3_BUCKET),
    },
    {
      graceHours: config.ORPHAN_OBJECT_GRACE_HOURS,
      maxDeletes: config.ORPHAN_OBJECT_MAX_DELETES,
      dryRun: config.ORPHAN_OBJECT_DRY_RUN,
      now: () => new Date(),
    },
    logger,
  );
  // Cùng adapter list/delete của quét mồ côi; key worker đã có quyền đọc bucket (d22).
  await registerPurgeProfileObjectsJob(
    boss,
    {
      repository: createPurgeRepository(pool),
      storage: createOrphanStorage(createS3Client(config), config.S3_BUCKET),
    },
    logger,
  );
  await registerGenerateRemindersJob(
    boss,
    createReminderRepository(pool, newId),
    { now: () => new Date() },
    logger,
  );
  if (config.webPush)
    await registerSendRemindersJob(
      boss,
      createDeliveryRepository(pool, newId),
      createReminderNotifier(createWebPushSender(config.webPush)),
      { now: () => new Date() },
      logger,
    );
  else logger.warn('Chưa cấu hình WEB_PUSH_*, không gửi lời nhắc');
  const idpSyncEnabled = await registerIdpSessionSync(config, pool);
  logger.info(
    { aiRunMode: config.AI_RUN_MODE, aiRoutingSource: 'database', idpSyncEnabled },
    `Worker sẵn sàng — đã đăng ký job convert-heic, prepare-ocr-image, extract-document, ngân sách AI, dọn object mồ côi, sinh lời nhắc${idpSyncEnabled ? ' và đồng bộ phiên IdP' : ''}`,
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
