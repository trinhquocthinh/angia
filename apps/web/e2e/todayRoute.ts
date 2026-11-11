import type { Route } from '@playwright/test';
import type { TodayState } from './todayState.js';
import { todayMutation } from './todayMutation.js';

export async function todayRoute(route: Route, state: TodayState) {
  const path = new URL(route.request().url()).pathname;
  const profileId = state.profiles[0]!.id;
  if (path === '/api/me') return route.fulfill({ json: state.session });
  if (path === '/api/me/profile')
    return route.fulfill({
      json: {
        id: profileId,
        displayName: 'Mẹ',
        birthYear: 1950,
        showsVitals: false,
        consentStatus: state.consentStatus,
      },
    });
  if (path === '/api/health-profiles') return route.fulfill({ json: state.profiles });
  if (path === '/api/source-documents') return route.fulfill({ json: { items: [], nextCursor: null } });
  if (path === '/api/me/consent') return route.fulfill({ json: { profile: null } });
  if (path.endsWith('/dose-confirmation')) return todayMutation(route, state);
  if (path.endsWith('/reminders')) {
    state.reads.push(path);
    if (state.readError)
      return route.fulfill({
        status: 503,
        json: { error: { code: 'ERR_INTERNAL', message: 'Không thể tải.' } },
      });
    return route.fulfill({ json: path.includes(state.profiles[1]!.id) ? [] : state.rows });
  }
  return route.fulfill({
    status: 404,
    json: { error: { code: 'ERR_NOT_FOUND', message: 'Không tìm thấy.' } },
  });
}
