import { randomUUID } from 'node:crypto';
import { serializeSigned } from 'hono/utils/cookie';
import type pg from 'pg';

export const TEST_COOKIE_SECRET = 'test-secret-test-secret-test-secret';

export interface SeededSession {
  id: string;
  accountId: string;
  csrf: string;
  cookie: string;
}

interface AccountFields {
  familyId?: string;
  familyRole?: 'main' | 'member';
  admin?: boolean;
  displayName?: string;
}

// Chèn bằng role owner (bỏ qua RLS); không truyền familyId/familyRole = tài khoản chờ gán nhóm.
export async function seedAccount(owner: pg.Client, fields: AccountFields = {}): Promise<string> {
  const id = randomUUID();
  await owner.query(
    `INSERT INTO accounts (id, oidc_subject, display_name, family_id, family_role, is_system_admin)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      id,
      `sub-${id}`,
      fields.displayName ?? `Người ${fields.familyRole ?? 'chờ'}`,
      fields.familyId ?? null,
      fields.familyRole ?? null,
      fields.admin ?? false,
    ],
  );
  return id;
}

export async function seedSession(
  owner: pg.Client,
  accountId: string,
  expiresInMs = 30 * 24 * 60 * 60 * 1000,
): Promise<SeededSession> {
  const [id, csrf] = [randomUUID(), `csrf-${randomUUID()}`];
  await owner.query(`INSERT INTO sessions (id, account_id, csrf_token, expires_at) VALUES ($1, $2, $3, $4)`, [
    id,
    accountId,
    csrf,
    new Date(Date.now() + expiresInMs),
  ]);
  const cookie = (await serializeSigned('angia_session', id, TEST_COOKIE_SECRET)).split(';')[0] ?? '';
  return { id, accountId, csrf, cookie };
}
