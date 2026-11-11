import type { Page } from '@playwright/test';
import { todayState } from './todayState.js';
import { todayRoute } from './todayRoute.js';

export async function todayFixture(page: Page, role: 'main' | 'member' = 'member') {
  await page.clock.setFixedTime(new Date('2026-11-11T01:00:00Z'));
  const state = todayState(role);
  await page.route('**/api/**', (route) => todayRoute(route, state));
  return state;
}
