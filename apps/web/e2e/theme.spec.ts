import { expect, test } from '@playwright/test';

test('TC-856 — lần đầu theo nền máy và theo dõi khi máy đổi nền', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/e2e/theme.html');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(18, 23, 22)');
  await expect(page.getByRole('radio', { name: 'Theo máy' })).toBeChecked();
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(250, 248, 245)');
});

test('TC-857 — chọn sáng vẫn giữ sau tải lại và quay về theo máy', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/e2e/theme.html');
  await page.getByRole('radio', { name: 'Sáng', exact: true }).check();
  await page.reload();
  await expect(page.getByRole('radio', { name: 'Sáng', exact: true })).toBeChecked();
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(250, 248, 245)');
  await page.getByRole('radio', { name: 'Theo máy' }).check();
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(18, 23, 22)');
  await page.reload();
  await expect(page.getByRole('radio', { name: 'Theo máy' })).toBeChecked();
});

test('TC-857 — storage bị chặn vẫn đổi nền trong phiên hiện tại', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('Bị chặn');
      },
    });
  });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/e2e/theme.html');
  await page.getByRole('radio', { name: 'Sáng', exact: true }).check();
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(250, 248, 245)');
});

test('TC-857 — chọn bằng bàn phím, vùng chạm ít nhất 48 px ở 360 px', async ({ page }) => {
  await page.goto('/e2e/theme.html');
  const light = page.getByRole('radio', { name: 'Sáng', exact: true });
  await light.focus();
  await page.keyboard.press('Space');
  await expect(light).toBeChecked();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: 'Tối', exact: true })).toBeChecked();
  for (const label of await page.locator('label').all()) {
    const box = await label.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(48);
    expect(box!.width).toBeGreaterThanOrEqual(48);
  }
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`TC-859 — bản xem trước và bản in trắng khi app ${colorScheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto('/e2e/theme.html');
    await expect(page.locator('#root .summary-sheet')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('.summary-print-root')).toBeVisible();
    await expect(page.locator('.summary-print-root .summary-sheet')).toHaveCSS(
      'background-color',
      'rgb(255, 255, 255)',
    );
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  });
}
