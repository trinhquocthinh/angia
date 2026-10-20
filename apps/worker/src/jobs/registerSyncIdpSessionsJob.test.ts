import type { PgBoss } from 'pg-boss';
import type { Logger } from 'pino';
import { describe, expect, it, vi } from 'vitest';
import { IdpDirectoryError } from '@src/features/idpSessionSync/application/IdpDirectoryError.js';
import type {
  IdpDirectory,
  IdpSyncDependencies,
  IdpSyncPolicy,
} from '@src/features/idpSessionSync/application/ports.js';
import type { LocalAccount } from '@src/features/idpSessionSync/domain/planIdpSync.js';
import { registerSyncIdpSessionsJob } from './registerSyncIdpSessionsJob.js';

const SECRET_UID = 'uid-secret';
const policy: IdpSyncPolicy = {
  accessGroupName: 'angia-sit-users',
  adminGroupName: 'angia-admins',
  maxRevokes: 10,
  dryRun: false,
  now: () => new Date('2026-10-20T08:00:00Z'),
};
const accounts: LocalAccount[] = [
  { id: 'acc-locked', oidcSubject: SECRET_UID, isSystemAdmin: true, hasSession: true },
  { id: 'acc-ok', oidcSubject: 'uid-ok', isSystemAdmin: false, hasSession: true },
];
const healthy: IdpDirectory = {
  fetchGroupMembers: async (name) =>
    name === 'angia-sit-users'
      ? [
          { uid: SECRET_UID, isActive: false },
          { uid: 'uid-ok', isActive: true },
        ]
      : [],
};

async function runJob(directory: IdpDirectory, accountList = accounts, maxRevokes = 10) {
  const deps: IdpSyncDependencies = {
    directory,
    store: { listAccounts: async () => accountList, apply: async () => undefined },
  };
  const boss = { createQueue: vi.fn(), schedule: vi.fn(), work: vi.fn() };
  const logger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
  await registerSyncIdpSessionsJob(
    boss as unknown as PgBoss,
    deps,
    { ...policy, maxRevokes },
    logger as unknown as Logger,
  );
  const handler = boss.work.mock.calls[0]?.[2] as (jobs: { id: string }[]) => Promise<void>;
  await handler([{ id: 'j1' }]);
  const logged = JSON.stringify(Object.values(logger).map((fn) => fn.mock.calls));
  return { boss, logger, logged };
}

describe('Job sync-idp-sessions (SPEC-033)', () => {
  it('TC-333: đăng ký cron mỗi 5 phút giờ Việt Nam, queue singleton; log không chứa uid', async () => {
    const { boss, logger, logged } = await runJob(healthy);
    expect(boss.createQueue).toHaveBeenCalledWith('sync-idp-sessions', {
      policy: 'singleton',
      retryLimit: 0,
      expireInSeconds: 240,
    });
    expect(boss.schedule).toHaveBeenCalledWith('sync-idp-sessions', '*/5 * * * *', null, {
      tz: 'Asia/Ho_Chi_Minh',
    });
    expect(boss.work).toHaveBeenCalledWith('sync-idp-sessions', { batchSize: 1 }, expect.any(Function));
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        jobId: 'j1',
        outcome: 'applied',
        revoked: 1,
        adminOff: 1,
        revokedAccountIds: ['acc-locked'],
        adminOffAccountIds: ['acc-locked'],
      }),
      expect.any(String),
    );
    expect(logged).not.toContain(SECRET_UID);
  });

  it('TC-333a: IdP lỗi hoặc vượt trần → log error; không đổi gì → log debug', async () => {
    const failing = await runJob({
      fetchGroupMembers: async () => {
        throw new IdpDirectoryError('idp_http_error', 502);
      },
    });
    expect(failing.logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: 'error', reason: 'idp_http_error', status: 502, revoked: 0 }),
      expect.any(String),
    );

    const over = await runJob(
      {
        fetchGroupMembers: async (name) => (name === 'angia-sit-users' ? [{ uid: 'x', isActive: true }] : []),
      },
      accounts,
      1,
    );
    expect(over.logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ capped: true, revoked: 0 }),
      expect.any(String),
    );

    const quiet = await runJob(healthy, [accounts[1]!]);
    expect(quiet.logger.debug).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: 'applied', revoked: 0 }),
      expect.any(String),
    );
    expect(quiet.logger.warn).not.toHaveBeenCalled();
    expect(quiet.logger.error).not.toHaveBeenCalled();
  });
});
