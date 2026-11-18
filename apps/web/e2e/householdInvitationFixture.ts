import { readFixtureHouseholdInvitations } from './readFixtureHouseholdInvitations.js';
import { createFixtureHouseholdInvitation } from './createFixtureHouseholdInvitation.js';
import type { Page } from '@playwright/test';
import { householdStartFixture } from './householdStartFixture.js';

export async function householdInvitationFixture(page: Page) {
  const household = await householdStartFixture(page);
  household.family = true;
  const state = {
    household,
    issued: {
      invitationId: '11111111-1111-4111-8111-111111111111',
      code: 'A7F29C4E8B1D',
      link: 'https://angia.example/invite#token=invitation-secret',
      expiresAt: new Date(Date.now() + 604_800_000).toISOString(),
    },
    creates: [] as { body: unknown; csrf: string | undefined }[],
    revokes: [] as string[],
    entries: [] as {
      invitationId: string;
      role: 'main' | 'member';
      own: boolean;
      status: 'active' | 'accepted' | 'revoked' | 'expired';
      createdAt: string;
      expiresAt: string;
      secrets: { code: string; link: string } | null;
    }[],
    replaces: [] as string[],
    listError: false,
    error: '',
    hold: null as Promise<void> | null,
  };
  await page.route(/\/api\/family\/invitations(?:\/[^/?]+(?:\/replace)?)?(?:\?[^#]*)?$/, async (route) => {
    const request = route.request();
    if (request.method() === 'GET') return readFixtureHouseholdInvitations(route, state);
    if (request.method() === 'POST') return createFixtureHouseholdInvitation(route, state);
    state.revokes.push(new URL(request.url()).pathname);
    if (state.hold) await state.hold;
    if (state.error === 'NETWORK') return route.abort();
    if (state.error)
      return route.fulfill({
        status: 404,
        json: { error: { code: state.error, message: 'Chi tiết nội bộ không được hiện' } },
      });
    state.entries
      .filter((item) => request.url().includes(item.invitationId))
      .forEach((item) => (item.status = 'revoked'));
    return route.fulfill({ status: 204 });
  });
  return state;
}
