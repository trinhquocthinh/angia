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
import { createMeasurementRepository } from '@src/features/measurements/infrastructure/createMeasurementRepository.js';
import { createProfileRepository } from '@src/features/profiles/infrastructure/createProfileRepository.js';
import { randomBytes, randomUUID } from 'node:crypto';
import {
  CONVERT_HEIC_QUEUE,
  CONVERT_HEIC_QUEUE_OPTIONS,
  PREPARE_OCR_IMAGE_QUEUE,
  PREPARE_OCR_IMAGE_QUEUE_OPTIONS,
  EXTRACT_DOCUMENT_QUEUE,
  EXTRACT_DOCUMENT_QUEUE_OPTIONS,
} from '@angia/contracts';
import { serve } from '@hono/node-server';
import { pino } from 'pino';
import { createApp } from '@src/createApp.js';
import { createFamilyAdminRepository } from '@src/features/family/infrastructure/createFamilyAdminRepository.js';
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
await boss.createQueue(EXTRACT_DOCUMENT_QUEUE, EXTRACT_DOCUMENT_QUEUE_OPTIONS);
const privacyQueue = createPrivacyQueue(boss);

const app = createApp({
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
  },
  review: { repository: createReviewRepository(db), reader: createS3ObjectReader(s3, config.S3_BUCKET) },
  privacy: {
    repository: createPrivacyRepository(db, privacyQueue),
    queue: privacyQueue,
    reader: createS3ObjectReader(s3, config.S3_BUCKET),
    hashPng: hashPrivacyPng,
    newId: randomUUID,
    now: () => new Date(),
  },
  measurements: createMeasurementRepository(db),
});

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
