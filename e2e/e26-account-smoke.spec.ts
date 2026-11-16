import { expect, test } from '@playwright/test';

test.skip(
  process.env.E2E_STORAGE_STATE !== undefined,
  'Smoke không đăng nhập: phải bỏ E2E_STORAGE_STATE khỏi môi trường và .env.e2e.',
);
test.use({ serviceWorkers: 'block' });

test.beforeEach(async ({ context }) => {
  // Chặn cả request do ứng dụng tự phát sinh trước khi nó có thể ghi dữ liệu SIT.
  await context.route('**/*', async (route) => {
    const method = route.request().method();
    if (method !== 'GET') await route.abort('blockedbyclient');
    expect(method, 'Smoke SIT chỉ cho phép GET').toBe('GET');
    await route.continue();
  });
});

test('AT-E26-01: health công khai trả API, DB và storage hoạt động, không cache', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ status: 'ok', db: 'ok', storage: 'ok' });
  expect(response.headers()['cache-control']).toBe('no-store');
});

test('AT-E26-18: legal công khai trả trạng thái chưa seed hoặc đủ hai văn bản hiện hành', async ({
  request,
}) => {
  const response = await request.get('/api/legal/current');
  const body = await response.json();
  expect([200, 500]).toContain(response.status());
  test.info().annotations.push({
    type: 'legal-seed',
    description:
      response.status() === 500
        ? 'Chưa seed: 500 ERR_INTERNAL; seed cần quyền owner.'
        : 'Đã seed: 200; kiểm đủ terms và privacy.',
  });
  if (response.status() === 500) {
    expect(body).toMatchObject({ error: { code: 'ERR_INTERNAL' } });
    return;
  }
  for (const kind of ['terms', 'privacy']) {
    expect(body[kind]).toMatchObject({
      id: expect.any(String),
      version: expect.any(String),
      material: expect.any(Boolean),
      url: expect.stringMatching(/^\/legal\//),
    });
    expect(body[kind].id).not.toBe('');
    expect(body[kind].version).not.toBe('');
  }
});

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`AT-E26-27: /login công khai ${viewport.width}×${viewport.height}, ${colorScheme}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ colorScheme });
      await page.goto('/login');
      await expect(page.getByLabel(/^Tên đăng nhập/)).toBeVisible();
      await expect(page.getByLabel(/^Mật khẩu/)).toBeVisible();
      await expect(page.getByRole('button', { name: 'Đăng nhập', exact: true })).toBeVisible();
      const admin = page.getByRole('link', { name: 'Đăng nhập quản trị', exact: true });
      await expect(admin).toBeVisible();
      await expect(admin).toHaveAttribute('href', '/api/auth/login');
      const recovery = page.getByRole('link', { name: 'Quên mật khẩu', exact: true });
      await expect(recovery).toBeVisible();
      await expect(recovery).toHaveAttribute('href', '/forgot-password');
      await expect(page.locator('body')).not.toContainText(/Authentik/i);
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    });
  }
}

test('AT-E26-27: /register đủ trường, xác nhận tuổi và đồng ý chưa được tick', async ({ page }) => {
  await page.goto('/register');
  await expect(page.getByRole('heading', { name: 'Tạo tài khoản', exact: true })).toBeVisible();
  for (const label of [/^Tên đăng nhập/, /^Mật khẩu/, /^Tên của bạn/, /^Email \(không bắt buộc\)/]) {
    await expect(page.getByLabel(label)).toBeVisible();
  }
  await expect(page.getByRole('button', { name: 'Tạo tài khoản', exact: true })).toBeVisible();
  const age = page.getByRole('checkbox', { name: 'Tôi trên 18 tuổi', exact: true });
  const agreement = page.getByRole('checkbox', {
    name: 'Tôi đồng ý với Điều khoản sử dụng và Chính sách quyền riêng tư',
    exact: true,
  });
  for (const checkbox of [age, agreement]) {
    await expect(checkbox).toBeVisible();
    await expect(checkbox).not.toBeChecked();
  }
});

test('AT-E26-27: /account/change-password không phiên hiện lời mời đăng nhập lại', async ({ page }) => {
  await page.goto('/account/change-password');
  await expect(page.getByText('Vui lòng đăng nhập lại.', { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/account\/change-password$/);
  await expect(page.getByRole('heading', { name: 'Đặt mật khẩu mới', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Đăng nhập', exact: true })).toHaveAttribute('href', '/login');
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  test.info().annotations.push({
    type: 'unauthenticated-behavior',
    description: 'Theo source: giữ /account/change-password khi thiếu token, chỉ hiện link /login.',
  });
});

for (const path of ['/account/legal-update', '/account/local-password']) {
  test(`AT-E26-27: ${path} không phiên chuyển về /login`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('button', { name: 'Đăng nhập', exact: true })).toBeVisible();
  });
}
