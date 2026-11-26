import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('TC-856 — lần đầu theo nền máy và theo dõi khi máy đổi nền', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/e2e/theme.html');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(18, 23, 22)');
  await expect(page.getByRole('radio', { name: 'Theo máy' })).toBeChecked();
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(240, 252, 251)');
});

test('TC-857 — chọn sáng vẫn giữ sau tải lại và quay về theo máy', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/e2e/theme.html');
  await page.getByRole('radio', { name: 'Sáng', exact: true }).check();
  await page.reload();
  await expect(page.getByRole('radio', { name: 'Sáng', exact: true })).toBeChecked();
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(240, 252, 251)');
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
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(240, 252, 251)');
});

test('TC-858 — tương phản màu đạt WCAG AA ở cả hai chế độ Sáng và Tối', async ({ page }) => {
  await page.goto('/e2e/theme.html');
  for (const name of ['Sáng', 'Tối'] as const) {
    await page.getByRole('radio', { name, exact: true }).check();
    const result = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
    expect(result.violations, `Tương phản lỗi ở chế độ ${name}`).toEqual([]);
  }
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

test('TC-860 — đổi nền cập nhật màn, SVG, biểu đồ và vật liệu 3D; ảnh không đổi', async ({ page }) => {
  await page.goto('/e2e/theme.html');
  const expected = {
    Sáng: {
      surface: 'rgb(255, 255, 255)',
      text: 'rgb(19, 29, 29)',
      accent: 'rgb(0, 65, 53)',
      model: 'ece8e2,004135',
      series: ['#004135', '#6b4fa8', '#b54708'],
      pain: '#1f2a2a',
      body: 'rgb(236, 232, 226)',
    },
    Tối: {
      surface: 'rgb(26, 33, 32)',
      text: 'rgb(237, 239, 238)',
      accent: 'rgb(111, 191, 166)',
      model: '2a3230,6fbfa6',
      series: ['#6fbfa6', '#b39ddb', '#fdb022'],
      pain: '#edefee',
      body: 'rgb(42, 50, 48)',
    },
  };
  for (const name of ['Sáng', 'Tối', 'Sáng'] as const) {
    const value = expected[name];
    await page.getByRole('radio', { name, exact: true }).check();
    const input = page.getByRole('textbox', { name: 'Ô nhập thử' });
    await expect(input).toHaveCSS('background-color', value.surface);
    await expect(input).toHaveCSS('color', value.text);
    await expect(page.getByRole('button', { name: 'Lưu thử' })).toHaveCSS('background-color', value.accent);
    for (const color of value.series)
      await expect(page.getByTestId('trend').locator(`path[stroke="${color}"]`).first()).toBeAttached();
    await expect(
      page.getByTestId('pain-chart').locator(`path[stroke="${value.pain}"]`).first(),
    ).toBeAttached();
    await expect(page.locator('[data-body-region="knee/left"]')).toHaveCSS('fill', value.body);
    await page.getByRole('button', { name: 'Kiểm tra mô hình' }).click();
    await expect(page.getByTestId('model-colors')).toHaveText(value.model);
    await page.getByRole('button', { name: 'Kiểm tra ảnh' }).click();
    await expect(page.getByTestId('redaction-pixels')).toHaveText(
      '[0,0,0,255,255,0,0,255,255,255,255,255,255,255,255,255]',
    );
  }
});

test('TC-860 — chữ trên nền ảnh tối và nhãn che đen luôn sáng ở cả hai nền', async ({ page }) => {
  await page.goto('/e2e/theme.html');
  for (const name of ['Tối', 'Sáng'] as const) {
    await page.getByRole('radio', { name, exact: true }).check();
    const remove = page.getByRole('button', { name: 'Bỏ ảnh thử', exact: true });
    await remove.hover();
    await expect(remove).toHaveCSS('color', 'rgb(255, 255, 255)');
    await expect(page.getByTestId('image-busy').locator('span').first()).toHaveCSS(
      'color',
      'rgb(255, 255, 255)',
    );
    await expect(page.getByTestId('image-failed').getByRole('alert')).toHaveCSS(
      'color',
      'rgb(255, 255, 255)',
    );
    await expect(page.getByTestId('image-loaded').locator('svg text')).toHaveCSS(
      'fill',
      'rgb(255, 255, 255)',
    );
    await expect(page.getByText('Kéo trên ảnh để tạo vùng cắt hoặc che')).toHaveCSS(
      'color',
      'rgb(255, 255, 255)',
    );
    await expect(page.getByRole('button', { name: 'Xem toàn màn hình', exact: true })).toHaveCSS(
      'color',
      'rgb(255, 255, 255)',
    );
  }
});

for (const media of ['screen', 'print'] as const) {
  test(`Cỡ chữ: bản tóm tắt A4 giữ nguyên trên ${media}`, async ({ page }) => {
    await page.goto('/e2e/theme.html');
    await page.emulateMedia({ media });
    const sheet = page.locator(
      media === 'print' ? '.summary-print-root .summary-sheet' : '#root .summary-sheet',
    );
    await expect(sheet).toBeVisible();
    const before = await sheet.evaluate((element) =>
      [element, ...Array.from(element.querySelectorAll('*'))].map((node) => {
        const style = getComputedStyle(node);
        return { font: style.fontSize, line: style.lineHeight };
      }),
    );
    await page.evaluate(() => {
      document.documentElement.dataset.textSize = 'large';
    });
    const after = await sheet.evaluate((element) =>
      [element, ...Array.from(element.querySelectorAll('*'))].map((node) => {
        const style = getComputedStyle(node);
        return { font: style.fontSize, line: style.lineHeight };
      }),
    );
    expect(after).toEqual(before);
  });
}
