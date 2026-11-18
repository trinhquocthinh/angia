import type { Page } from '@playwright/test';
import { householdStartFixture } from './householdStartFixture.js';

export async function householdJoinFixture(page: Page) {
  const household = await householdStartFixture(page);
  const state = {
    household,
    error: '',
    status: 404,
    hold: null as Promise<void> | null,
    accepts: [] as { body: unknown; csrf: string | undefined }[],
  };
  await page.route('**/api/invitations/accept', async (route) => {
    state.accepts.push({
      body: route.request().postDataJSON(),
      csrf: route.request().headers()['x-csrf-token'],
    });
    if (state.hold) await state.hold;
    if (state.error === 'NETWORK') return route.abort();
    if (state.error)
      return route.fulfill({
        status: state.status,
        json: { error: { code: state.error, message: 'Chi tiết nội bộ không được hiện' } },
      });
    household.family = true;
    household.role = 'member';
    return route.fulfill({ status: 204 });
  });
  return state;
}
