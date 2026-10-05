import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import type { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '@src/createApp.js';
import { createPool } from '@src/shared/db/createPool.js';
import { createStubAuthDeps } from '@src/shared/test/createStubAuthDeps.js';
import { createSilentLogger } from '@src/shared/test/createSilentLogger.js';
import { findFreePort } from '@src/shared/test/findFreePort.js';
import { createPostgresProbe } from '../infrastructure/createPostgresProbe.js';

const POSTGRES_IMAGE = 'postgres:16-alpine';

// Cố định host port để container mới (sau khi "bật lại") nhận đúng địa chỉ pool đang giữ.
async function startPostgres(hostPort: number): Promise<StartedPostgreSqlContainer> {
  return new PostgreSqlContainer(POSTGRES_IMAGE)
    .withDatabase('angia_test')
    .withUsername('angia')
    .withPassword('angia')
    .withExposedPorts({ container: 5432, host: hostPort })
    .start();
}

describe('GET /api/health với PostgreSQL thật', () => {
  let hostPort: number;
  let container: StartedPostgreSqlContainer;
  let pool: Pool;
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    hostPort = await findFreePort();
    container = await startPostgres(hostPort);
    pool = createPool(container.getConnectionUri(), createSilentLogger());
    app = createApp({
      healthProbes: { db: createPostgresProbe(pool), storage: () => Promise.resolve() },
      auth: createStubAuthDeps(),
    });
  });

  afterAll(async () => {
    await pool?.end();
    await container?.stop();
  });

  it('trả 200 khi DB sống, 503 khi DB tắt và 200 lại khi DB bật mà không tạo lại app', async () => {
    const healthy = await app.request('/api/health');
    expect(healthy.status).toBe(200);
    expect(await healthy.json()).toEqual({ status: 'ok', db: 'ok', storage: 'ok' });

    await container.stop();
    const down = await app.request('/api/health');
    expect(down.status).toBe(503);
    expect(await down.json()).toEqual({ status: 'degraded', db: 'down', storage: 'ok' });

    container = await startPostgres(hostPort);
    const recovered = await app.request('/api/health');
    expect(recovered.status).toBe(200);
  });
});
