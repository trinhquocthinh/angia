import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createPrivacyPgFixture } from '@src/shared/test/createPrivacyPgFixture.js';
import type { DirectoryMember } from '../domain/planIdpSync.js';
import { IdpDirectoryError } from '../application/IdpDirectoryError.js';
import type { IdpDirectory, IdpSyncPolicy } from '../application/ports.js';
import { syncIdpSessions } from '../application/syncIdpSessions.js';
import { createAccountSessionStore } from './createAccountSessionStore.js';

const NOW = new Date('2026-10-20T08:00:00Z');
const HOUR = 3600_000;
const policy: IdpSyncPolicy = {
  accessGroupName: 'angia-sit-users',
  adminGroupName: 'angia-admins',
  maxRevokes: 10,
  dryRun: false,
  now: () => NOW,
};
const directoryOf = (groups: Record<string, DirectoryMember[]>): IdpDirectory => ({
  fetchGroupMembers: async (name) => groups[name] ?? [],
});

describe('Đồng bộ phiên với IdP trên PostgreSQL thật, role app NOBYPASSRLS (BR-045)', () => {
  let fx: Awaited<ReturnType<typeof createPrivacyPgFixture>>;
  beforeAll(async () => {
    fx = await createPrivacyPgFixture();
  });
  afterAll(async () => {
    await fx?.close();
  });
  beforeEach(async () => {
    await fx.owner.query('DELETE FROM sessions');
    await fx.owner.query('UPDATE accounts SET is_system_admin = false');
  });

  const seedAccount = async (admin = false) => {
    const subject = `sub-${randomUUID()}`;
    const { rows } = await fx.owner.query<{ id: string }>(
      `INSERT INTO accounts(id, oidc_subject, display_name, is_system_admin) VALUES ($3, $1, 'Thử', $2) RETURNING id`,
      [subject, admin, randomUUID()],
    );
    return { id: rows[0]!.id, subject };
  };
  const seedSession = async (accountId: string, expiresAt = new Date(NOW.getTime() + HOUR)) =>
    (
      await fx.owner.query<{ id: string }>(
        `INSERT INTO sessions(id, account_id, csrf_token, expires_at) VALUES ($3, $1, 'csrf', $2) RETURNING id`,
        [accountId, expiresAt, randomUUID()],
      )
    ).rows[0]!.id;
  const sessionCount = async (accountId: string) =>
    Number(
      (await fx.owner.query('SELECT count(*) FROM sessions WHERE account_id = $1', [accountId])).rows[0]
        .count,
    );
  const isAdmin = async (accountId: string) =>
    (await fx.owner.query('SELECT is_system_admin FROM accounts WHERE id = $1', [accountId])).rows[0]
      .is_system_admin as boolean;
  // Cùng điều kiện findActive của API (apps/api/src/shared/auth/infrastructure/createSessionRepository.ts).
  const findActive = async (sessionId: string) =>
    (
      await fx.pool.query(
        `SELECT s.id FROM sessions s JOIN accounts a ON a.id = s.account_id WHERE s.id = $1 AND s.expires_at > $2`,
        [sessionId, NOW],
      )
    ).rowCount;

  it('TC-334: A bị khóa mất mọi phiên, B giữ; admin bị gỡ mất cờ nhưng giữ phiên; IdP lỗi thì DB không đổi', async () => {
    const [a, b, admin] = [await seedAccount(), await seedAccount(), await seedAccount(true)];
    const aSession = await seedSession(a.id);
    await seedSession(a.id);
    await seedSession(b.id);
    await seedSession(admin.id);
    const store = createAccountSessionStore(fx.pool);
    const directory = directoryOf({
      'angia-sit-users': [
        { uid: a.subject, isActive: false },
        { uid: b.subject, isActive: true },
        { uid: admin.subject, isActive: true },
      ],
      'angia-admins': [],
    });

    const result = await syncIdpSessions({ directory, store }, policy);

    expect(result).toMatchObject({ outcome: 'applied', revoke: [a.id], adminOff: [admin.id] });
    expect(await sessionCount(a.id)).toBe(0);
    expect(await findActive(aSession)).toBe(0);
    expect(await sessionCount(b.id)).toBe(1);
    expect(await isAdmin(admin.id)).toBe(false);
    expect(await sessionCount(admin.id)).toBe(1);

    await seedSession(a.id);
    const failing: IdpDirectory = {
      fetchGroupMembers: async () => {
        throw new IdpDirectoryError('idp_unreachable');
      },
    };
    await fx.owner.query('UPDATE accounts SET is_system_admin = true WHERE id = $1', [admin.id]);
    expect(await syncIdpSessions({ directory: failing, store }, policy)).toMatchObject({ outcome: 'error' });
    expect(await sessionCount(a.id)).toBe(1);
    expect(await isAdmin(admin.id)).toBe(true);
  });

  it('TC-334a: tài khoản chỉ có phiên hết hạn không tính là có phiên, không vào revoke và không chạm trần', async () => {
    const [live, expired] = [await seedAccount(), await seedAccount()];
    await seedSession(live.id);
    await seedSession(expired.id, new Date(NOW.getTime() - HOUR));
    const keeper = await seedAccount();
    const directory = directoryOf({ 'angia-sit-users': [{ uid: keeper.subject, isActive: true }] });

    const result = await syncIdpSessions(
      { directory, store: createAccountSessionStore(fx.pool) },
      { ...policy, maxRevokes: 1 },
    );

    expect(result).toMatchObject({ outcome: 'applied', revoke: [live.id], capped: false });
    expect(await sessionCount(live.id)).toBe(0);
  });
});
