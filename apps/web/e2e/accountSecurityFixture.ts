import type { Page, Route } from '@playwright/test';
import { enrollmentAdminResponse } from './enrollmentAdminResponse.js';
import { currentLegal } from './accountFixture.js';

export async function accountSecurityFixture(page: Page) {
  const state = {
    signedIn: true,
    restricted: false,
    legalRequired: false,
    enrollment: false,
    hasLocalCredential: false,
    adminWithoutFamily: false,
    meReads: 0,
    credentialStatus: 204,
    writes: [] as { path: string; body: unknown; csrf: string | undefined }[],
  };
  await page.route('**/api/**', (route) => securityRoute(route, state));
  return state;
}
type State = Awaited<ReturnType<typeof accountSecurityFixture>>;
function error(route: Route, status: number, code: string) {
  return route.fulfill({ status, json: { error: { code, message: 'Không hiển thị thông tin nội bộ' } } });
}
async function securityRoute(route: Route, state: State) {
  const path = new URL(route.request().url()).pathname;
  if (path === '/api/me') {
    state.meReads += 1;
    if (!state.signedIn) return error(route, 401, 'ERR_UNAUTHENTICATED');
    if (state.restricted) return error(route, 403, 'ERR_PASSWORD_CHANGE_REQUIRED');
    return route.fulfill({
      json: {
        account: {
          id: 'account',
          displayName: 'Lan',
          isSystemAdmin: state.adminWithoutFamily,
          healthProfileId: null,
        },
        family: state.adminWithoutFamily ? null : { id: 'family', name: 'Nhà thử' },
        role: state.adminWithoutFamily ? null : 'main',
        csrfToken: 'csrf',
        authMethod: state.enrollment ? 'oidc' : 'local',
        hasLocalCredential: !state.enrollment || state.hasLocalCredential,
        features: { redactionSuggestions: false, localEnrollmentEnabled: state.enrollment },
      },
    });
  }
  const adminResponse = enrollmentAdminResponse(path);
  if (adminResponse !== undefined) return route.fulfill({ json: adminResponse });
  if (path === '/api/legal/current') return route.fulfill({ json: currentLegal });
  if (route.request().method() === 'POST') return securityWrite(route, state, path);
  if (path === '/api/health-profiles' && state.legalRequired)
    return error(route, 403, 'ERR_LEGAL_ACCEPTANCE_REQUIRED');
  if (path === '/api/health-profiles') return route.fulfill({ json: [] });
  return error(route, 404, 'ERR_NOT_FOUND');
}
async function securityWrite(route: Route, state: State, path: string) {
  state.writes.push({
    path,
    body: route.request().postData() ? route.request().postDataJSON() : null,
    csrf: route.request().headers()['x-csrf-token'],
  });
  if (path === '/api/auth/password-login') {
    state.signedIn = true;
    state.restricted = true;
    return route.fulfill({
      json: {
        account: { id: 'account', username: 'me.lan', displayName: 'Lan', familyId: 'family' },
        session: { csrfToken: 'csrf', expiresAt: '2026-12-01T00:00:00Z', passwordChangeRequired: true },
      },
    });
  }
  if (path === '/api/me/password') state.restricted = false;
  if (path === '/api/me/legal-acceptances') state.legalRequired = false;
  if (path === '/api/me/local-credential') {
    if (state.credentialStatus === 403) return error(route, 403, 'ERR_FORBIDDEN');
    if (state.credentialStatus === 409) return error(route, 409, 'ERR_CREDENTIAL_ALREADY_SET');
    if (state.credentialStatus === 404) return error(route, 404, 'ERR_NOT_FOUND');
    state.hasLocalCredential = true;
  }
  if (path === '/api/auth/logout') state.signedIn = false;
  return route.fulfill({ status: 204 });
}
