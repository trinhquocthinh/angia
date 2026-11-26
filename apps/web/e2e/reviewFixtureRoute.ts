import type { Route } from '@playwright/test';
import { REVIEW_ID, type reviewFixture } from './reviewFixture.js';

type State = Awaited<ReturnType<typeof reviewFixture>>;

export async function reviewFixtureRoute(route: Route, state: State) {
  const request = route.request();
  const url = new URL(request.url());
  if (url.pathname === '/api/health-profiles') return route.fulfill({ json: [state.profile] });
  if (url.pathname === '/api/source-documents') {
    if (state.error) return route.fulfill({ status: 503, json: { error: { code: 'ERR_INTERNAL' } } });
    const next = url.searchParams.has('cursor');
    return route.fulfill({
      json: {
        items: next ? [{ ...state.document, id: `${REVIEW_ID.slice(0, -1)}1` }] : state.documents,
        nextCursor: !next && state.more ? REVIEW_ID : null,
      },
    });
  }
  if (url.pathname.endsWith('/review'))
    return route.fulfill({ json: { document: state.document, extraction: state.extraction } });
  if (url.pathname.endsWith('/image'))
    return route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"><rect width="600" height="800" fill="white"/><text x="40" y="80" font-size="28">GIẤY TỜ MẪU ĐÃ CHE</text><rect x="40" y="110" width="300" height="40" fill="black"/></svg>',
    });
  if (url.pathname.endsWith('/approve')) {
    state.writes.push({ body: request.postDataJSON(), csrf: request.headers()['x-csrf-token'] });
    state.documents = [];
    return route.fulfill({
      json: {
        document: { ...state.document, status: 'approved' },
        measurements: [],
        prescription: null,
        labResults: [],
      },
    });
  }
  return route.fallback();
}
