import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { todayState } from '../todayState.js';
import { selfPainData } from '../selfPainData.js';
import { selfPainRoute } from '../selfPainRoute.js';
import { reviewFixture } from '../reviewFixture.js';
import { reviewFixtureRoute } from '../reviewFixtureRoute.js';
import { householdHomeFixture } from '../householdHomeFixture.js';
import { reminderUiSeed } from '../reminderUiSeed.js';
import { enrollmentAdminResponse } from '../enrollmentAdminResponse.js';
import { createRouteSession } from './createRouteSession.js';
import { commonRouteResponses } from './commonRouteResponses.js';
import { healthRouteResponse } from './healthRouteResponse.js';
import { routeIds } from './routes.js';
import type { RouteAccess } from './routes.js';

export async function allRoutesFixture(page: Page, access: RouteAccess) {
  const today = todayState(access === 'member' ? 'member' : 'main');
  const pain = selfPainData('member');
  const review = await reviewFixture(page);
  const household = await householdHomeFixture(page);
  // Mỗi ca dùng page mới; chỉ giữ một handler gom chung sau khi lấy state fixture.
  await page.unrouteAll();
  review.profile = today.profiles[0]!;
  review.document.healthProfileId = routeIds.profileId;
  const seed = reminderUiSeed();
  const session = createRouteSession(access);
  const unknownRequests: string[] = [];
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    if (path === '/api/me')
      return route.fulfill({
        status: access === 'public' ? 401 : 200,
        json: access === 'public' ? { error: { code: 'ERR_UNAUTHENTICATED' } } : session,
      });
    if (path === '/api/auth/email-verifications/confirm') return route.fulfill({ status: 204 });
    if (path === '/api/health-profiles') return route.fulfill({ json: today.profiles });
    if (path === '/api/me/profile') return route.fulfill({ json: pain.summary });
    if (path === '/api/family/members')
      return route.fulfill({ json: { members: household.membersState.members } });
    if (path === '/api/family/ownership-offers/current' || path === '/api/family/deletion-request/current')
      return route.fulfill({ status: 404, json: { error: { code: 'ERR_NOT_FOUND' } } });
    if (path === '/api/source-documents' || /^\/api\/source-documents\/[^/]+\/(review|image)$/.test(path))
      return reviewFixtureRoute(route, review);
    if (path.startsWith('/api/me/profile/pain-issues')) return selfPainRoute(route, pain);
    if (path.startsWith('/api/me/reminders/')) return route.fulfill({ json: seed.reminder });
    if (path.startsWith('/api/me/revisit-reminders/')) return route.fulfill({ json: seed.revisit });
    const response = commonRouteResponses[path] ?? enrollmentAdminResponse(path) ?? healthRouteResponse(url);
    if (response !== undefined) return route.fulfill({ json: response });
    unknownRequests.push(`${route.request().method()} ${path}`);
    expect.soft(unknownRequests, 'Endpoint thiếu fixture; không được gửi tới API thật').toEqual([]);
    return route.fulfill({ status: 501, json: { error: { code: 'ERR_A11Y_FIXTURE_MISSING' } } });
  });
  return unknownRequests;
}
