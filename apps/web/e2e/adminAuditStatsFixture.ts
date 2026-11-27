import type { Page } from '@playwright/test';
import { householdStartFixture } from './householdStartFixture.js';

export const adminReadIds = {
  family: '12345678-1234-4234-8234-123456789abc',
  account: '87654321-4321-4321-8321-cba987654321',
};
export const statsWeeks = Array.from({ length: 12 }, (_, index) => ({
  weekStart: new Date(Date.UTC(2026, 10, 23 - index * 7)).toISOString().slice(0, 10),
  families: 12 + index,
  accounts: 38 + index,
  familiesWithDoseConfirmation: 7 + index,
  familiesActiveStreak4w: 3 + index,
}));
export const firstAuditEvent = {
  id: 'event-1',
  occurredAt: '2026-11-26T18:04:59.123456Z',
  actorAccountId: 'system_admin',
  familyId: adminReadIds.family,
  targetAccountId: adminReadIds.account,
  targetProfileId: null,
  action: 'account_locked',
  metadata: { privateValue: 'NEVER_RENDER_METADATA' },
};
export async function adminAuditStatsFixture(page: Page) {
  const session = await householdStartFixture(page);
  session.admin = true;
  const state = {
    session,
    statsStatus: 200,
    auditStatus: 200,
    empty: false,
    nextPageError: false,
    statsHold: null as Promise<void> | null,
    auditHold: null as Promise<void> | null,
    statsRequests: [] as URL[],
    auditRequests: [] as URL[],
  };
  await page.route('**/api/admin/stats?*', async (route) => {
    state.statsRequests.push(new URL(route.request().url()));
    if (state.statsHold) await state.statsHold;
    await route.fulfill({
      status: state.statsStatus,
      json: state.statsStatus === 200 ? { weeks: statsWeeks } : { error: { code: 'ERR_INTERNAL' } },
    });
  });
  await page.route('**/api/admin/audit-events?*', async (route) => {
    const url = new URL(route.request().url());
    state.auditRequests.push(url);
    if (state.auditHold) await state.auditHold;
    const next = url.searchParams.has('cursor');
    const status = next && state.nextPageError ? 503 : state.auditStatus;
    const event = next
      ? {
          ...firstAuditEvent,
          id: 'event-2',
          actorAccountId: adminReadIds.account,
          action: 'email_changed',
          targetAccountId: null,
          targetProfileId: adminReadIds.account,
        }
      : firstAuditEvent;
    await route.fulfill({
      status,
      json:
        status !== 200
          ? { error: { code: 'ERR_VALIDATION' } }
          : {
              items: state.empty ? [] : [event],
              nextCursor: !state.empty && !next ? 'micro+cursor/==' : null,
            },
    });
  });
  return state;
}
