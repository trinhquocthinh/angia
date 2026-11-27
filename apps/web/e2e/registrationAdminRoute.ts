import type { Route } from '@playwright/test';
import type { householdStartFixture } from './householdStartFixture.js';

type State = Awaited<ReturnType<typeof householdStartFixture>>;
export async function registrationAdminRoute(route: Route, state: State) {
  const request = route.request();
  const path = new URL(request.url()).pathname;
  if (path === '/api/registration-switch') {
    return route.fulfill({
      status: state.registrationReadError ? 503 : 200,
      json: state.registrationReadError
        ? { error: { code: 'ERR_INTERNAL' } }
        : { registrationOpen: state.registrationOpen },
    });
  }
  state.registrationWrites.push({
    path,
    method: request.method(),
    body: request.postDataJSON(),
    csrf: request.headers()['x-csrf-token'],
  });
  if (state.registrationHold) await state.registrationHold;
  const code = !state.signedIn
    ? 'ERR_UNAUTHENTICATED'
    : !state.admin
      ? 'ERR_FORBIDDEN'
      : state.registrationError;
  if (code)
    return route.fulfill({
      status: code === 'ERR_NOT_FOUND' ? 404 : code === 'ERR_UNAUTHENTICATED' ? 401 : 403,
      json: { error: { code } },
    });
  if (request.method() === 'PUT') {
    state.registrationOpen = (request.postDataJSON() as { open: boolean }).open;
    return route.fulfill({ json: { registrationOpen: state.registrationOpen } });
  }
  if (request.method() === 'DELETE') return route.fulfill({ status: 204 });
  state.invitationCount += 1;
  return route.fulfill({
    status: 201,
    json: {
      invitationId: `invitation-${state.invitationCount}`,
      code: `AN-REAL-${state.invitationCount}`,
      link: `https://angia.test/invite#secret-${state.invitationCount}`,
      expiresAt: '2026-12-01T18:00:00Z',
    },
  });
}
