import { createAdherenceRepository } from '@src/features/adherence/infrastructure/createAdherenceRepository.js';
import { createDoseSlotRepository } from '@src/features/reminders/infrastructure/createDoseSlotRepository.js';
import { createMedicationRepository } from '@src/features/medications/infrastructure/createMedicationRepository.js';
import { createPrivacyRepository } from '@src/features/documentPrivacy/infrastructure/createPrivacyRepository.js';
import { createPrivacyQueue } from '@src/features/documentPrivacy/infrastructure/createPrivacyQueue.js';
import { hashPrivacyPng } from '@src/features/documentPrivacy/infrastructure/hashPrivacyPng.js';
import { createInvitationRepository } from '@src/features/consentInvitations/infrastructure/createInvitationRepository.js';
import { createInvitationTokenCodec } from '@src/features/consentInvitations/infrastructure/createInvitationTokenCodec.js';
import { createDocumentRepository } from '@src/features/documents/infrastructure/createDocumentRepository.js';
import { createPreviewQueue } from '@src/features/documents/infrastructure/createPreviewQueue.js';
import { createReviewRepository } from '@src/features/documents/infrastructure/createReviewRepository.js';
import { createS3ObjectReader } from '@src/features/documents/infrastructure/createS3ObjectReader.js';
import { createS3ObjectStorage } from '@src/features/documents/infrastructure/createS3ObjectStorage.js';
import { createLabResultRepository } from '@src/features/labResults/infrastructure/createLabResultRepository.js';
import { createDocumentEntryRepository } from '@src/features/documents/infrastructure/createDocumentEntryRepository.js';
import { createVisitSummaryRepository } from '@src/features/visitSummary/infrastructure/createVisitSummaryRepository.js';
import { createMeasurementRepository } from '@src/features/measurements/infrastructure/createMeasurementRepository.js';
import { createProfileRepository } from '@src/features/profiles/infrastructure/createProfileRepository.js';
import { randomBytes, randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import {
  CONVERT_HEIC_QUEUE,
  CONVERT_HEIC_QUEUE_OPTIONS,
  PREPARE_OCR_IMAGE_QUEUE,
  PREPARE_OCR_IMAGE_QUEUE_OPTIONS,
  REQUEUE_AWAITING_BUDGET_QUEUE,
  REQUEUE_AWAITING_BUDGET_QUEUE_OPTIONS,
  ensureExtractDocumentQueues,
} from '@angia/contracts';
import { serve } from '@hono/node-server';
import { pino } from 'pino';
import { createApp } from '@src/createApp.js';
import { createFamilyCapRepository } from '@src/features/family/infrastructure/createFamilyCapRepository.js';
import { createFamilyUsageRepository } from '@src/features/familyQuota/infrastructure/createFamilyUsageRepository.js';
import { createFamilyAdminRepository } from '@src/features/family/infrastructure/createFamilyAdminRepository.js';
import { createAiBudgetRepository } from '@src/features/family/infrastructure/createAiBudgetRepository.js';
import { createPostgresProbe } from '@src/features/health/infrastructure/createPostgresProbe.js';
import { createS3BucketProbe } from '@src/features/health/infrastructure/createS3BucketProbe.js';
import { createAccountRepository } from '@src/shared/auth/infrastructure/createAccountRepository.js';
import { createOpenIdClient } from '@src/shared/auth/infrastructure/createOpenIdClient.js';
import { createSessionRepository } from '@src/shared/auth/infrastructure/createSessionRepository.js';
import { loadApiConfig } from '@src/shared/config/loadApiConfig.js';
import { createDatabase } from '@src/shared/db/createDatabase.js';
import { createPool } from '@src/shared/db/createPool.js';
import { newId } from '@src/shared/db/schema/newId.js';
import { createPgBoss } from '@src/shared/queue/createPgBoss.js';
import { createS3Client } from '@src/shared/storage/createS3Client.js';
import { sweepOrphanUploadDirs } from '@src/shared/http/sweepOrphanUploadDirs.js';

import { createPushDependencies } from '@src/features/pushSubscriptions/infrastructure/createPushDependencies.js';

// Composition root: đọc config, khởi tạo adapter hạ tầng và tiêm vào app.
const config = loadApiConfig(process.env);
const logger = pino({ level: config.LOG_LEVEL, base: { service: 'angia-api', stack: config.STACK } });

const pool = createPool(config.DATABASE_URL, logger);
const db = createDatabase(pool);
const s3 = createS3Client(config);
const boss = createPgBoss(config.DATABASE_URL, logger);
await boss.start();
// Idempotent: worker cũng tạo queue này; bên nào khởi động trước đều gửi được job.
await boss.createQueue(CONVERT_HEIC_QUEUE, CONVERT_HEIC_QUEUE_OPTIONS);

await boss.createQueue(PREPARE_OCR_IMAGE_QUEUE, PREPARE_OCR_IMAGE_QUEUE_OPTIONS);
await ensureExtractDocumentQueues(boss);
await boss.createQueue(REQUEUE_AWAITING_BUDGET_QUEUE, REQUEUE_AWAITING_BUDGET_QUEUE_OPTIONS);
const privacyQueue = createPrivacyQueue(boss);

// F03b (SPEC-030): ngưỡng quota dùng chung cho upload, bước riêng tư và route mức đã dùng.
const quotaPolicy = {
  limits: {
    storageBytes: config.QUOTA_FAMILY_STORAGE_BYTES,
    dailyUploads: config.QUOTA_FAMILY_DAILY_UPLOADS,
    pendingJobs: config.QUOTA_FAMILY_PENDING_JOBS,
  },
  now: () => new Date(),
};
// SPEC-031: tham số ngân sách AI dùng chung cho duyệt riêng tư và mức dùng (trùng env worker).
const aiPolicy = {
  estimatedCostUsd: config.AI_ESTIMATED_COST_USD,
  defaultMonthlyCapUsd: config.AI_DEFAULT_MONTHLY_CAP_USD,
  defaultFamilyCapUsd: config.AI_DEFAULT_FAMILY_MONTHLY_CAP_USD,
  now: () => new Date(),
};
const app = createApp({
  push: createPushDependencies(db, config),
  healthProbes: {
    db: createPostgresProbe(pool),
    storage: createS3BucketProbe(s3, config.S3_BUCKET),
  },
  auth: {
    login: {
      oidc: createOpenIdClient({
        issuerUrl: config.OIDC_ISSUER_URL,
        clientId: config.OIDC_CLIENT_ID,
        clientSecret: config.OIDC_CLIENT_SECRET,
        redirectUri: config.OIDC_REDIRECT_URI,
      }),
      accounts: createAccountRepository(db),
      sessions: createSessionRepository(db),
      adminGroupName: config.ADMIN_GROUP_NAME,
      generateToken: () => randomBytes(32).toString('base64url'),
      now: () => new Date(),
    },
    cookieSecret: config.SESSION_COOKIE_SECRET,
    // Dev chạy http://localhost:5173: Safari không lưu cookie Secure trên http nên chỉ bật Secure ở SIT/Prod (HTTPS).
    secureCookies: config.STACK !== 'dev',
    logger,
  },
  familyAdmin: createFamilyAdminRepository(db),
  aiBudget: {
    repository: createAiBudgetRepository(db, boss),
    defaultMonthlyCapUsd: config.AI_DEFAULT_MONTHLY_CAP_USD,
    now: () => new Date(),
  },
  profiles: createProfileRepository(db),
  consentInvitations: {
    repository: createInvitationRepository(db),
    codec: createInvitationTokenCodec(config.SESSION_COOKIE_SECRET),
    now: () => new Date(),
    newId: randomUUID,
    appBaseUrl: config.APP_BASE_URL,
  },
  documents: {
    repository: createDocumentRepository(db, createPreviewQueue(boss)),
    storage: createS3ObjectStorage(s3, config.S3_BUCKET),
    newId,
    quota: quotaPolicy,
  },
  review: { repository: createReviewRepository(db), reader: createS3ObjectReader(s3, config.S3_BUCKET) },
  privacy: {
    repository: createPrivacyRepository(db, privacyQueue),
    queue: privacyQueue,
    reader: createS3ObjectReader(s3, config.S3_BUCKET),
    hashPng: hashPrivacyPng,
    newId: randomUUID,
    now: () => new Date(),
    quota: quotaPolicy,
    ai: aiPolicy,
  },
  measurements: createMeasurementRepository(db),
  labResults: createLabResultRepository(db),
  documentEntries: createDocumentEntryRepository(db),
  medications: createMedicationRepository(db),
  adherence: createAdherenceRepository(db),
  doseSlots: createDoseSlotRepository(db),
  visitSummary: createVisitSummaryRepository(db),
  familyUsage: { repository: createFamilyUsageRepository(db), quota: quotaPolicy, ai: aiPolicy },
  familyCaps: {
    repository: createFamilyCapRepository(db, boss),
    defaultFamilyCapUsd: config.AI_DEFAULT_FAMILY_MONTHLY_CAP_USD,
    now: () => new Date(),
  },
  heavyRateLimit: { perMinute: config.RATE_LIMIT_HEAVY_PER_MINUTE, now: () => Date.now() },
});

// F08b (nợ #21): dọn ảnh chứng từ tạm còn lại khi tiến trình trước chết giữa request, trước khi nhận request mới.
const swept = await sweepOrphanUploadDirs({
  root: tmpdir(),
  graceMs: config.UPLOAD_ORPHAN_GRACE_MINUTES * 60_000,
  now: () => new Date(),
  uid: process.getuid?.() ?? -1,
});
if (swept.removed > 0 || swept.failed > 0) logger.warn(swept, 'Đã dọn thư mục tải lên tạm mồ côi');

const server = serve({ fetch: app.fetch, port: config.PORT }, (info) => {
  logger.info({ port: info.port }, 'API đã sẵn sàng');
});

const shutdown = (signal: string) => {
  logger.info({ signal }, 'Đang dừng API');
  server.close(() => {
    void boss
      .stop({ graceful: true })
      .finally(() => pool.end())
      .finally(() => process.exit(0));
  });
};
process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
