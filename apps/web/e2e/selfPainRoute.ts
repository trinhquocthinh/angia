import type { Route } from '@playwright/test';
import type { SelfPainData } from './selfPainData.js';
import { selfPainMutation } from './selfPainMutation.js';
import { issue } from './painJournalFixture.js';
export function selfPainRoute(route: Route, state: SelfPainData) {
  const req = route.request();
  const url = new URL(req.url());
  const path = url.pathname;
  if (path === '/api/me') return route.fulfill({ json: state.session });
  if (path === '/api/me/profile') return route.fulfill({ json: state.summary });
  if (path === '/api/health-profiles') return route.fulfill({ json: [] });
  if (path === '/api/documents') return route.fulfill({ json: { items: [], nextCursor: null } });
  if (path === '/api/me/profile/medications/current')
    return route.fulfill({ json: { today: '2026-11-07', courses: [] } });
  if (['reminders', 'revisits', 'lab-result-series'].some((part) => path === `/api/me/profile/${part}`))
    return route.fulfill({ json: [] });
  const base = '/api/me/profile/pain-issues';
  const detail = state.detail;
  const currentSummary = {
    ...issue,
    status: detail.status,
    resolvedOn: detail.resolvedOn,
    lastEntry: detail.lastEntry,
    entryCount: detail.entryCount,
  };
  if (path === base && req.method() === 'GET')
    return route.fulfill({ json: { issues: state.empty ? [] : [currentSummary] } });
  if (path.endsWith('/context'))
    return route.fulfill({
      json: {
        from: url.searchParams.get('from'),
        to: url.searchParams.get('to'),
        asNeededDoses: [],
        courses: [],
      },
    });
  if (req.method() === 'POST' && path.startsWith(base)) return selfPainMutation(route, state);
  if (path === `${base}/${issue.id}`) return route.fulfill({ json: detail });
  return route.fulfill({
    status: 404,
    json: { error: { code: 'ERR_NOT_FOUND', message: 'Không tìm thấy.' } },
  });
}
