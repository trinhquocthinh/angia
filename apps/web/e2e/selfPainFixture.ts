import type { Page } from '@playwright/test';
import { selfPainData } from './selfPainData.js';
import { selfPainRoute } from './selfPainRoute.js';
export async function selfPainFixture(page: Page, role: 'main' | 'member' = 'member') {
  const state = selfPainData(role);
  const requests: {
    path: string;
    method: string;
    body: Record<string, unknown> | null;
    csrf: string | undefined;
  }[] = [];
  const loaded: string[] = [];
  page.on('request', (req) => {
    const path = new URL(req.url()).pathname;
    if (req.resourceType() === 'script') loaded.push(path);
    if (path.startsWith('/api/'))
      requests.push({
        path,
        method: req.method(),
        body: req.postDataJSON(),
        csrf: req.headers()['x-csrf-token'],
      });
  });
  await page.route('**/api/**', (route) => selfPainRoute(route, state));
  return { ...state, state, requests, loaded };
}
