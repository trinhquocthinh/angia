import type { Page, Route } from '@playwright/test';
import { currentLegal } from './accountFixture.js';
import { enrollmentAdminResponse } from './enrollmentAdminResponse.js';

export async function householdStartFixture(page: Page) {
  const state = {
    signedIn: true,
    linked: false,
    family: false,
    admin: false,
    role: 'main' as 'main' | 'member',
    name: 'Nhà Lan',
    code: '',
    status: 403,
    failRefresh: false,
    meFailed: false,
    hold: null as Promise<void> | null,
    writes: [] as { body: unknown; csrf: string | undefined }[],
    readsBeforeFamily: [] as string[],
  };
  await page.route('**/api/**', (route) => householdRoute(route, state));
  return state;
}
type State = Awaited<ReturnType<typeof householdStartFixture>>;
async function householdRoute(route: Route, state: State) {
  const path = new URL(route.request().url()).pathname;
  if (path === '/api/me') {
    if (state.meFailed || (state.family && state.failRefresh))
      return route.fulfill({ status: 503, json: {} });
    return route.fulfill({
      status: state.signedIn ? 200 : 401,
      json: state.signedIn
        ? {
            account: {
              id: 'account',
              displayName: 'Lan',
              isSystemAdmin: state.admin,
              healthProfileId: state.linked ? 'profile' : null,
            },
            family: state.family ? { id: 'family', name: state.name } : null,
            role: state.family ? state.role : null,
            csrfToken: 'csrf',
            authMethod: 'local',
            hasLocalCredential: true,
            emailStatus: { email: null, emailVerified: false, pendingEmail: null },
            features: { redactionSuggestions: false, localEnrollmentEnabled: false },
          }
        : { error: { code: 'ERR_UNAUTHENTICATED' } },
    });
  }
  if (path === '/api/legal/current') return route.fulfill({ json: currentLegal });
  if (path === '/api/auth/register') {
    state.signedIn = true;
    return route.fulfill({
      status: 201,
      json: { account: { id: 'account' }, session: { csrfToken: 'csrf' } },
    });
  }
  if (path === '/api/families' && route.request().method() === 'POST') return createHousehold(route, state);
  if (path === '/api/auth/logout') {
    state.signedIn = false;
    return route.fulfill({ status: 204 });
  }
  const admin = enrollmentAdminResponse(path);
  if (admin !== undefined && state.admin) return route.fulfill({ json: admin });
  if (!state.family) state.readsBeforeFamily.push(path);
  if (path === '/api/health-profiles') return route.fulfill({ json: [] });
  if (path === '/api/documents/review-queue') return route.fulfill({ json: { items: [], nextCursor: null } });
  return route.fulfill({ status: 404, json: { error: { code: 'ERR_NOT_FOUND' } } });
}
async function createHousehold(route: Route, state: State) {
  state.writes.push({
    body: route.request().postDataJSON(),
    csrf: route.request().headers()['x-csrf-token'],
  });
  if (state.hold) await state.hold;
  if (state.code === 'NETWORK') return route.abort();
  if (state.code) {
    if (state.code === 'ERR_ACCOUNT_ALREADY_IN_FAMILY') state.family = true;
    return route.fulfill({
      status: state.status,
      json: { error: { code: state.code, message: 'Nội bộ không được hiển thị' } },
    });
  }
  state.family = true;
  state.name = (route.request().postDataJSON() as { name: string }).name;
  return route.fulfill({ status: 201, json: { id: 'family', name: state.name } });
}
