import type { Page, Route } from '@playwright/test';

export type AccountSettingsFixtureState = {
  displayName: string;
  family: { id: string; name: string; isOwner: boolean } | null;
  role: 'main' | 'member' | null;
  hasLocalCredential: boolean;
  emailStatus: { email: string | null; emailVerified: boolean; pendingEmail: string | null };
  patchStatus: number;
  patchCode: string;
  verifyStatus: number;
  verifyCode: string;
  meReads: number;
  patchCalls: { body: unknown; csrf: string | undefined }[];
  verifyCalls: { csrf: string | undefined }[];
};

export async function accountSettingsFixture(
  page: Page,
  overrides: Partial<AccountSettingsFixtureState> = {},
) {
  const state: AccountSettingsFixtureState = {
    displayName: 'Lan',
    family: { id: 'fam-1', name: 'Nhà Ngọc Lan', isOwner: false },
    role: 'main',
    hasLocalCredential: true,
    emailStatus: { email: null, emailVerified: false, pendingEmail: null },
    patchStatus: 200,
    patchCode: '',
    verifyStatus: 202,
    verifyCode: '',
    meReads: 0,
    patchCalls: [],
    verifyCalls: [],
    ...overrides,
  };
  await page.route('**/api/**', (route) => handleApiRoute(route, state));
  return state;
}

function fail(route: Route, status: number, code: string) {
  return route.fulfill({ status, json: { error: { code, message: 'Nội bộ' } } });
}

async function handleApiRoute(route: Route, state: AccountSettingsFixtureState) {
  const path = new URL(route.request().url()).pathname;
  const method = route.request().method();
  if (path === '/api/me' && method === 'GET') {
    state.meReads += 1;
    return route.fulfill({
      json: {
        account: { id: 'acc-1', displayName: state.displayName, isSystemAdmin: false, healthProfileId: null },
        family: state.family,
        role: state.role,
        csrfToken: 'csrf-settings',
        authMethod: state.hasLocalCredential ? 'local' : 'oidc',
        hasLocalCredential: state.hasLocalCredential,
        emailStatus: state.emailStatus,
        features: { redactionSuggestions: false, localEnrollmentEnabled: false },
      },
    });
  }
  if (path === '/api/me/email' && method === 'PATCH') return handleEmailPatch(route, state);
  if (path === '/api/me/email-verifications' && method === 'POST') return handleEmailVerify(route, state);
  if (path === '/api/health-profiles' || path === '/api/documents/review') {
    return route.fulfill({ json: path === '/api/documents/review' ? { items: [], nextCursor: null } : [] });
  }
  return fail(route, 404, 'ERR_NOT_FOUND');
}

function handleEmailPatch(route: Route, state: AccountSettingsFixtureState) {
  const body = route.request().postDataJSON() as { email: string; currentPassword: string };
  state.patchCalls.push({ body, csrf: route.request().headers()['x-csrf-token'] });
  if (state.patchCode) return fail(route, state.patchStatus, state.patchCode);
  if (state.emailStatus.emailVerified) {
    state.emailStatus = { ...state.emailStatus, pendingEmail: body.email };
  } else {
    state.emailStatus = { email: body.email, emailVerified: false, pendingEmail: null };
  }
  return route.fulfill({ status: 200, json: state.emailStatus });
}

function handleEmailVerify(route: Route, state: AccountSettingsFixtureState) {
  state.verifyCalls.push({ csrf: route.request().headers()['x-csrf-token'] });
  if (state.verifyCode) return fail(route, state.verifyStatus, state.verifyCode);
  if (state.verifyStatus === 204) {
    state.emailStatus = {
      email: state.emailStatus.pendingEmail ?? state.emailStatus.email,
      emailVerified: true,
      pendingEmail: null,
    };
    return route.fulfill({ status: 204 });
  }
  return route.fulfill({ status: 202, json: { sent: true } });
}
