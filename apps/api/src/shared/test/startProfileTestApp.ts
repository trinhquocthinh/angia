import { createPrivacyRepository } from '@src/features/documentPrivacy/infrastructure/createPrivacyRepository.js';
import { createPrivacyQueue } from '@src/features/documentPrivacy/infrastructure/createPrivacyQueue.js';
import { hashPrivacyPng } from '@src/features/documentPrivacy/infrastructure/hashPrivacyPng.js';
import { createInvitationRepository } from '@src/features/consentInvitations/infrastructure/createInvitationRepository.js';
import { createInvitationTokenCodec } from '@src/features/consentInvitations/infrastructure/createInvitationTokenCodec.js';
import { randomUUID } from 'node:crypto';
import {
  CONVERT_HEIC_QUEUE,
  CONVERT_HEIC_QUEUE_OPTIONS,
  PREPARE_OCR_IMAGE_QUEUE,
  PREPARE_OCR_IMAGE_QUEUE_OPTIONS,
  EXTRACT_DOCUMENT_QUEUE,
  EXTRACT_DOCUMENT_QUEUE_OPTIONS,
} from '@angia/contracts';
import pg from 'pg';
import type { PgBoss } from 'pg-boss';
import { createApp } from '@src/createApp.js';
import { createDocumentRepository } from '@src/features/documents/infrastructure/createDocumentRepository.js';
import { createReviewRepository } from '@src/features/documents/infrastructure/createReviewRepository.js';
import { createMeasurementRepository } from '@src/features/measurements/infrastructure/createMeasurementRepository.js';
import { createPreviewQueue } from '@src/features/documents/infrastructure/createPreviewQueue.js';
import { newId } from '@src/shared/db/schema/newId.js';
import { createProfileRepository } from '@src/features/profiles/infrastructure/createProfileRepository.js';
import { createSessionRepository } from '@src/shared/auth/infrastructure/createSessionRepository.js';
import { createDatabase, type Database } from '@src/shared/db/createDatabase.js';
import { runMigrations } from '@src/shared/db/runMigrations.js';
import { createPgBoss } from '@src/shared/queue/createPgBoss.js';
import { createMemoryObjectStorage } from './createMemoryObjectStorage.js';
import { createSilentLogger } from './createSilentLogger.js';
import { createStubAuthDeps } from './createStubAuthDeps.js';
import { createFakeFamilyAdminRepository } from './createFakeFamilyAdminRepository.js';
import { seedAccount, seedSession, TEST_COOKIE_SECRET, type SeededSession } from './seedAuthFixtures.js';
import { startTestDatabase } from './startTestDatabase.js';

function buildApp(
  database: Database,
  appBaseUrl: string,
  memory: ReturnType<typeof createMemoryObjectStorage>,
  boss: PgBoss,
) {
  const stub = createStubAuthDeps();
  const privacyQueue = createPrivacyQueue(boss);
  return createApp({
    healthProbes: { db: () => Promise.resolve(), storage: () => Promise.resolve() },
    auth: {
      ...stub,
      cookieSecret: TEST_COOKIE_SECRET,
      login: { ...stub.login, sessions: createSessionRepository(database) },
    },
    familyAdmin: createFakeFamilyAdminRepository().repository,
    profiles: createProfileRepository(database),
    consentInvitations: {
      repository: createInvitationRepository(database),
      codec: createInvitationTokenCodec(TEST_COOKIE_SECRET),
      now: () => new Date(),
      newId: randomUUID,
      appBaseUrl,
    },
    documents: {
      repository: createDocumentRepository(database, createPreviewQueue(boss)),
      newId,
      storage: memory.storage,
    },
    review: { repository: createReviewRepository(database), reader: memory.reader },
    privacy: {
      repository: createPrivacyRepository(database, privacyQueue),
      reader: memory.reader,
      queue: privacyQueue,
      hashPng: hashPrivacyPng,
      newId: randomUUID,
      now: () => new Date(),
    },
    measurements: createMeasurementRepository(database),
  });
}

export async function startProfileTestApp(appBaseUrl = 'http://localhost:5173') {
  const db = await startTestDatabase();
  await runMigrations(db.ownerUrl);
  const owner = new pg.Client({ connectionString: db.ownerUrl });
  await owner.connect();
  const pool = new pg.Pool({ connectionString: db.appUrl });
  const database = createDatabase(pool);
  const memory = createMemoryObjectStorage();
  // pg-boss thật trên role app (migrate:false) như server.ts; job chỉ được gửi, không có worker xử lý.
  const boss = createPgBoss(db.appUrl, createSilentLogger());
  await boss.start();
  await boss.createQueue(CONVERT_HEIC_QUEUE, CONVERT_HEIC_QUEUE_OPTIONS);
  await boss.createQueue(PREPARE_OCR_IMAGE_QUEUE, PREPARE_OCR_IMAGE_QUEUE_OPTIONS);
  await boss.createQueue(EXTRACT_DOCUMENT_QUEUE, EXTRACT_DOCUMENT_QUEUE_OPTIONS);
  const app = buildApp(database, appBaseUrl, memory, boss);
  const family = async () => {
    const id = randomUUID();
    await owner.query('INSERT INTO families(id,name) VALUES ($1,$2)', [id, 'Nhà']);
    return id;
  };
  const session = async (
    familyId: string,
    role: 'main' | 'member' = 'main',
    displayName = 'Người chăm',
    admin = false,
  ) => seedSession(owner, await seedAccount(owner, { familyId, familyRole: role, displayName, admin }));
  const call = (user: SeededSession, method: string, path: string, body?: unknown) =>
    app.request(path, {
      method,
      headers: { cookie: user.cookie, 'x-csrf-token': user.csrf, 'content-type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  const stop = async () => {
    await boss.stop({ graceful: false });
    await pool.end();
    await owner.end();
    await db.container.stop();
  };
  return {
    app,
    owner,
    pool,
    family,
    session,
    call,
    stop,
    database,
    boss,
    objects: memory.objects,
    codec: createInvitationTokenCodec(TEST_COOKIE_SECRET),
  };
}
export type ProfileTestApp = Awaited<ReturnType<typeof startProfileTestApp>>;
