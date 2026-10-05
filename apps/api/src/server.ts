import { randomBytes } from 'node:crypto';
import { serve } from '@hono/node-server';
import { pino } from 'pino';
import { createApp } from '@src/createApp.js';
import { createPostgresProbe } from '@src/features/health/infrastructure/createPostgresProbe.js';
import { createS3BucketProbe } from '@src/features/health/infrastructure/createS3BucketProbe.js';
import { createAccountRepository } from '@src/shared/auth/infrastructure/createAccountRepository.js';
import { createOpenIdClient } from '@src/shared/auth/infrastructure/createOpenIdClient.js';
import { createSessionRepository } from '@src/shared/auth/infrastructure/createSessionRepository.js';
import { loadApiConfig } from '@src/shared/config/loadApiConfig.js';
import { createDatabase } from '@src/shared/db/createDatabase.js';
import { createPool } from '@src/shared/db/createPool.js';
import { createS3Client } from '@src/shared/storage/createS3Client.js';

// Composition root: đọc config, khởi tạo adapter hạ tầng và tiêm vào app.
const config = loadApiConfig(process.env);
const logger = pino({ level: config.LOG_LEVEL, base: { service: 'angia-api', stack: config.STACK } });

const pool = createPool(config.DATABASE_URL, logger);
const db = createDatabase(pool);
const s3 = createS3Client(config);

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
});

const server = serve({ fetch: app.fetch, port: config.PORT }, (info) => {
  logger.info({ port: info.port }, 'API đã sẵn sàng');
});

const shutdown = (signal: string) => {
  logger.info({ signal }, 'Đang dừng API');
  server.close(() => {
    void pool.end().finally(() => process.exit(0));
  });
};
process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
