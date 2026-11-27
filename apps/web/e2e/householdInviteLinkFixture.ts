import { mockHouseholdInvitationAccountRoutes } from './mockHouseholdInvitationAccountRoutes.js';
import type { Page } from '@playwright/test';
import { householdStartFixture } from './householdStartFixture.js';

export const invitationToken = 'Ab_9-'.repeat(8) + 'xyz';
export const invitationPath = `/invite#token=${invitationToken}`;
export async function householdInviteLinkFixture(page: Page) {
  const household = await householdStartFixture(page);
  const state = {
    household,
    kind: 'join_family' as 'join_family' | 'found_family',
    role: 'member' as 'member' | 'main',
    inspectError: '',
    acceptError: '',
    acceptStatus: 404,
    legalRequired: false,
    inspections: [] as unknown[],
    accepts: [] as { body: unknown; csrf: string | undefined }[],
    registrations: [] as Record<string, unknown>[],
    requests: [] as { url: string; method: string; body: string | null }[],
    console: [] as string[],
    hold: null as Promise<void> | null,
  };
  page.on('console', (message) => state.console.push(message.text()));
  page.on('request', (request) =>
    state.requests.push({ url: request.url(), method: request.method(), body: request.postData() }),
  );
  await page.route('**/api/invitations/inspect', async (route) => {
    state.inspections.push(route.request().postDataJSON());
    if (state.inspectError === 'NETWORK') return route.abort();
    if (state.inspectError)
      return route.fulfill({
        status: state.inspectError === 'ERR_RATE_LIMITED' ? 429 : 404,
        json: { error: { code: state.inspectError } },
      });
    return route.fulfill({
      json: state.kind === 'join_family' ? { kind: state.kind, role: state.role } : { kind: state.kind },
    });
  });
  await page.route('**/api/invitations/accept', async (route) => {
    state.accepts.push({
      body: route.request().postDataJSON(),
      csrf: route.request().headers()['x-csrf-token'],
    });
    if (state.hold) await state.hold;
    if (state.legalRequired)
      return route.fulfill({ status: 403, json: { error: { code: 'ERR_LEGAL_ACCEPTANCE_REQUIRED' } } });
    if (state.acceptError)
      return route.fulfill({ status: state.acceptStatus, json: { error: { code: state.acceptError } } });
    household.family = true;
    household.role = state.role;
    return route.fulfill({ status: 204 });
  });
  await mockHouseholdInvitationAccountRoutes(page, state);
  return state;
}
