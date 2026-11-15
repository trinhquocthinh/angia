import type { Page, Route } from '@playwright/test';
export const currentLegal = {
  terms: {
    id: '11111111-1111-4111-8111-111111111111',
    kind: 'terms',
    version: '1',
    publishedAt: '2026-11-01T00:00:00Z',
    material: true,
    url: '/legal/terms.md',
  },
  privacy: {
    id: '22222222-2222-4222-8222-222222222222',
    kind: 'privacy',
    version: '1',
    publishedAt: '2026-11-01T00:00:00Z',
    material: true,
    url: '/legal/privacy.md',
  },
};
export async function accountFixture(page: Page) {
  const state = {
    signedIn: false,
    code: '',
    status: 401,
    details: {} as Record<string, unknown>,
    legalFailed: false,
    legal: currentLegal,
    legalReads: 0,
    meReads: 0,
    bodies: [] as Record<string, unknown>[],
    hold: null as Promise<void> | null,
  };
  await page.route('**/api/**', (route) => accountRoute(route, state));
  return state;
}
async function accountRoute(route: Route, state: Awaited<ReturnType<typeof accountFixture>>) {
  const path = new URL(route.request().url()).pathname;
  if (path === '/api/me') {
    state.meReads++;
    return route.fulfill({
      status: state.signedIn ? 200 : 401,
      json: state.signedIn
        ? {
            account: { id: 'account', displayName: 'Lan', isSystemAdmin: false, healthProfileId: null },
            family: null,
            role: null,
            csrfToken: 'csrf',
            features: { redactionSuggestions: false },
          }
        : { error: { code: 'ERR_UNAUTHENTICATED', message: 'Chưa đăng nhập' } },
    });
  }
  if (path === '/api/legal/current') {
    state.legalReads++;
    return route.fulfill({
      status: state.legalFailed ? 500 : 200,
      json: state.legalFailed
        ? { error: { code: 'ERR_INTERNAL', message: 'Không có văn bản' } }
        : state.legal,
    });
  }
  if (path === '/api/auth/password-login' || path === '/api/auth/register') {
    state.bodies.push(route.request().postDataJSON() as Record<string, unknown>);
    if (state.hold) await state.hold;
    if (state.code === 'NETWORK') return route.abort();
    if (state.code === 'MALFORMED')
      return route.fulfill({ status: 503, contentType: 'text/plain', body: 'unavailable' });
    if (state.code)
      return route.fulfill({
        status: state.status,
        json: {
          error: { code: state.code, message: 'Không hiển thị thông tin nội bộ', details: state.details },
        },
      });
    state.signedIn = true;
    return route.fulfill({
      status: path.endsWith('/register') ? 201 : 200,
      json: {
        account: { id: 'account', username: 'me.lan', displayName: 'Lan', familyId: null },
        session: { csrfToken: 'csrf', expiresAt: '2026-12-01T00:00:00Z', passwordChangeRequired: false },
      },
    });
  }
  return route.fulfill({
    status: 404,
    json: { error: { code: 'ERR_NOT_FOUND', message: 'Không tìm thấy' } },
  });
}
