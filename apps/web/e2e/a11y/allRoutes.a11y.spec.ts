import { expect, test } from '@playwright/test';
import { routes, routeIds, routeCoverage } from './routes.js';
import type { AccessibilityRoute } from './routes.js';
import { allRoutesFixture } from './allRoutesFixture.js';
import { assertRouteScreen } from './assertRouteScreen.js';
import { assertAccessibility } from './assertAccessibility.js';
import { assertLayout } from './assertLayout.js';

// Mỗi route là ca riêng; assertion mềm thu thập đồng thời lỗi axe và layout.
for (const entry of routes) {
  const screen: AccessibilityRoute = entry;
  const path = screen.path.replace(
    /\$(profileId|issueId|reminderId|documentId|prescriptionId)/g,
    (_, key: keyof typeof routeIds) => routeIds[key],
  );
  for (const theme of ['light', 'dark'] as const) {
    for (const largeText of [false, true]) {
      test(`TC-862/TC-876: Màn hợp lệ, axe, chữ và vùng chạm 360 px — ${screen.path}/${screen.access}/${theme}/${largeText ? 'Chữ lớn' : 'chuẩn'}`, async ({
        page,
      }, info) => {
        expect(routeCoverage).toEqual({});
        const unknownRequests = await allRoutesFixture(page, screen.access);
        await page.addInitScript(
          ({ theme, largeText }) => {
            localStorage.setItem('angia-theme', theme);
            localStorage.setItem('angia-large-text', String(largeText));
          },
          { theme, largeText },
        );
        await page.goto(path + (screen.suffix ?? ''));
        await assertRouteScreen(page, screen.expectedPath ?? path);
        await expect.soft(page.locator('html')).toHaveAttribute('data-theme', theme);
        await expect
          .soft(page.locator('html'))
          .toHaveAttribute('data-text-size', largeText ? 'large' : 'standard');
        await assertAccessibility(page, info, `${path}/${theme}/${largeText ? 'large' : 'standard'}`);
        await assertLayout(page);
        await info.attach('api-fixture-missing', {
          body: JSON.stringify(unknownRequests, null, 2),
          contentType: 'application/json',
        });
        expect.soft(unknownRequests, 'Mọi endpoint phải có fixture hợp lệ').toEqual([]);
      });
    }
  }
}
