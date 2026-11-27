import type { AdminAuditEvent, AdminAuditResponse } from '@angia/contracts';
import { randomUUID } from 'node:crypto';
import { expect } from 'vitest';
import type { startRegistrationTestApp } from './startRegistrationTestApp.js';
import { seedAccount, seedSession, type SeededSession } from './seedAuthFixtures.js';
import { callAccountLock, seedAccountLockCase } from './accountLockTestFixture.js';

type TestApp = Awaited<ReturnType<typeof startRegistrationTestApp>>;
export const auditPath = '/api/admin/audit-events';

export async function readAudit(t: TestApp, user: SeededSession, query = '') {
  const response = await t.app.request(`${auditPath}${query}`, { headers: { cookie: user.cookie } });
  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toBe('no-store');
  return (await response.json()) as AdminAuditResponse;
}

export async function readAllAudit(t: TestApp, user: SeededSession, limit = 2) {
  const items: AdminAuditEvent[] = [];
  let cursor: string | null = null;
  do {
    const page = await readAudit(t, user, `?limit=${limit}${cursor ? `&cursor=${cursor}` : ''}`);
    items.push(...page.items);
    cursor = page.nextCursor;
    if (items.length > 1000) throw new Error('Phân trang không kết thúc');
  } while (cursor);
  expect(new Set(items.map((item) => item.id)).size).toBe(items.length);
  return items;
}

export function writeRequest(
  t: TestApp,
  user: SeededSession | null,
  path: string,
  method: string,
  body = {},
) {
  return t.app.request(path, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(user ? { cookie: user.cookie, 'x-csrf-token': user.csrf } : {}),
    },
    body: JSON.stringify(body),
  });
}

// Chạy đường ghi nghiệp vụ thật; dữ liệu sức khỏe từ fixture khoá phải không lọt vào metadata.
export async function exerciseAuditFlows(t: TestApp) {
  const f = await seedAccountLockCase(t);
  expect((await callAccountLock(t, f.admin, f.target.accountId, 'lock')).status).toBe(200);
  expect((await callAccountLock(t, f.admin, f.target.accountId, 'unlock')).status).toBe(200);
  expect(
    (await writeRequest(t, f.admin, '/api/admin/registration-switch', 'PUT', { open: true })).status,
  ).toBe(200);
  const creator = await seedSession(t.owner, await seedAccount(t.owner));
  const created = await writeRequest(t, creator, '/api/families', 'POST', { name: 'Nhà không lộ metadata' });
  expect(created.status).toBe(201);
  const invitation = await writeRequest(t, creator, '/api/family/invitations', 'POST', {
    kind: 'join_family',
    role: 'member',
  });
  expect(invitation.status).toBe(201);
  const body = (await invitation.json()) as { link: string; code: string };
  const token = decodeURIComponent(body.link.split('#token=')[1]!);
  return { ...f, token, invitationCode: body.code, csrf: creator.csrf };
}

export async function seedAuditFilters(t: TestApp) {
  const familyId = randomUUID();
  await t.owner.query("INSERT INTO families(id,name) VALUES($1,'Nhà lọc')", [familyId]);
  const actor = await seedAccount(t.owner, { familyId, familyRole: 'main' });
  const target = await seedAccount(t.owner, { familyId, familyRole: 'member' });
  const ids = Array.from({ length: 5 }, () => randomUUID());
  for (const [index, id] of ids.entries()) {
    await t.owner.query(
      `INSERT INTO admin_audit_events(id,occurred_at,actor_account_id,family_id,target_account_id,action,metadata)
      VALUES($1,$2,$3,$4,$5,$6,'{}')`,
      [
        id,
        index < 3 ? '2026-01-05T00:00:00.123456Z' : `2026-01-05T00:00:00.12345${index + 4}Z`,
        actor,
        familyId,
        target,
        index === 4 ? 'account_unlocked' : 'account_locked',
      ],
    );
  }
  return { familyId, actor, target, ids };
}
