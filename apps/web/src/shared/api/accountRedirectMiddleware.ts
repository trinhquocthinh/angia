import type { Middleware } from 'openapi-fetch';

type AccountDestination = '/account/change-password' | '/account/legal-update';
let navigate: ((to: AccountDestination) => void | Promise<void>) | null = null;

export function registerAccountNavigator(callback: typeof navigate) {
  navigate = callback;
}

export const accountRedirectMiddleware: Middleware = {
  async onResponse({ response }) {
    if (response.status !== 403) return;
    let body: unknown;
    try {
      body = await response.clone().json();
    } catch {
      return;
    }
    if (!body || typeof body !== 'object' || !('error' in body)) return;
    const error = body.error;
    if (!error || typeof error !== 'object' || !('code' in error)) return;
    const to =
      error.code === 'ERR_PASSWORD_CHANGE_REQUIRED'
        ? '/account/change-password'
        : error.code === 'ERR_LEGAL_ACCEPTANCE_REQUIRED'
          ? '/account/legal-update'
          : null;
    const here = globalThis.location?.pathname;
    // Các màn công khai phải truy cập được khi phiên hạn chế bị mất CSRF.
    if (
      to &&
      here !== to &&
      here !== '/login' &&
      here !== '/register' &&
      here !== '/forgot-password' &&
      here !== '/reset-password'
    ) {
      try {
        await navigate?.(to);
      } catch {
        /* Caller vẫn nhận nguyên phản hồi 403. */
      }
    }
  },
};
