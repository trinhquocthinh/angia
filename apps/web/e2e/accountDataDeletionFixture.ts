import { Buffer } from 'node:buffer';
import type { Page, Route } from '@playwright/test';

export type AccountDataDeletionState = {
  family: { id: string; name: string; isOwner: boolean } | null;
  role: 'main' | 'member' | null;
  hasLocalCredential: boolean;
  healthProfileId: string | null;
  profiles: {
    id: string;
    displayName: string;
    relationship: string;
    birthYear: number | null;
    hasLinkedAccount: boolean;
    consentStatus: string;
  }[];
  exportCreateStatus: number;
  exportCreateCode: string;
  exportStatuses: Array<'pending' | 'ready' | 'failed'>;
  deleteStatus: number;
  deleteCode: string;
  deleted: boolean;
  deleteGate: Promise<void> | null;
  exportCalls: { body: unknown; csrf: string | undefined }[];
  deleteCalls: { body: unknown; csrf: string | undefined }[];
};

const emptyZipBuffer = Buffer.from([
  0x50, 0x4b, 0x05, 0x06, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
]);

export async function accountDataDeletionFixture(
  page: Page,
  overrides: Partial<AccountDataDeletionState> = {},
) {
  const state: AccountDataDeletionState = {
    family: { id: 'fam-1', name: 'Nhà Ngọc Lan', isOwner: false },
    role: 'main',
    hasLocalCredential: true,
    healthProfileId: null,
    profiles: [],
    exportCreateStatus: 202,
    exportCreateCode: '',
    exportStatuses: ['pending', 'ready'],
    deleteStatus: 204,
    deleteCode: '',
    deleted: false,
    deleteGate: null,
    exportCalls: [],
    deleteCalls: [],
    ...overrides,
  };
  await page.route('**/api/**', (route) => handleRoute(route, state));
  return state;
}

function fail(route: Route, status: number, code: string) {
  return route.fulfill({ status, json: { error: { code, message: 'Nội bộ' } } });
}

function handleMe(route: Route, state: AccountDataDeletionState) {
  if (state.deleted) return fail(route, 401, 'ERR_UNAUTHENTICATED');
  return route.fulfill({
    json: {
      account: {
        id: 'acc-1',
        displayName: 'Lan',
        isSystemAdmin: false,
        healthProfileId: state.healthProfileId,
      },
      family: state.family,
      role: state.role,
      csrfToken: 'csrf-e2e',
      authMethod: state.hasLocalCredential ? 'local' : 'oidc',
      hasLocalCredential: state.hasLocalCredential,
      emailStatus: { email: 'lan@example.com', emailVerified: true, pendingEmail: null },
      features: { redactionSuggestions: false, localEnrollmentEnabled: false },
    },
  });
}

function handleCreateExport(route: Route, state: AccountDataDeletionState) {
  state.exportCalls.push({
    body: route.request().postDataJSON(),
    csrf: route.request().headers()['x-csrf-token'],
  });
  if (state.exportCreateCode) return fail(route, state.exportCreateStatus, state.exportCreateCode);
  return route.fulfill({ status: 202, json: { exportId: 'exp-e2e-1' } });
}

async function handleDeleteAccount(route: Route, state: AccountDataDeletionState) {
  state.deleteCalls.push({
    body: route.request().postDataJSON(),
    csrf: route.request().headers()['x-csrf-token'],
  });
  await state.deleteGate;
  if (state.deleteCode) return fail(route, state.deleteStatus, state.deleteCode);
  state.deleted = true;
  return route.fulfill({ status: 204 });
}

function handleRoute(route: Route, state: AccountDataDeletionState) {
  const path = new URL(route.request().url()).pathname;
  const method = route.request().method();
  if (path === '/api/me' && method === 'GET') return handleMe(route, state);
  if (path === '/api/health-profiles' && method === 'GET') return route.fulfill({ json: state.profiles });
  if (path === '/api/documents/review') return route.fulfill({ json: { items: [], nextCursor: null } });
  if (path === '/api/me/data-exports' && method === 'POST') return handleCreateExport(route, state);
  if (path === '/api/me/data-exports/exp-e2e-1' && method === 'GET') {
    const status = state.exportStatuses.shift() ?? 'ready';
    const expiresAt = status === 'ready' ? '2026-11-24T12:00:00Z' : null;
    return route.fulfill({ status: 200, json: { status, expiresAt } });
  }
  if (path === '/api/me/data-exports/exp-e2e-1/file' && method === 'GET') {
    return route.fulfill({
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="angia-du-lieu-20261123.zip"',
        'Cache-Control': 'no-store',
      },
      body: emptyZipBuffer,
    });
  }
  if (path === '/api/me/account-deletion' && method === 'POST') return handleDeleteAccount(route, state);
  if (path === '/api/auth/registration-status') return route.fulfill({ json: { registrationOpen: true } });
  return fail(route, 404, 'ERR_NOT_FOUND');
}
