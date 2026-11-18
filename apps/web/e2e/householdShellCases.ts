import { memberHeaderCases } from './memberHeaderCases.js';
import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { householdStartFixture } from './householdStartFixture.js';

export function householdShellCases(theme: string) {
  memberHeaderCases.forEach((register) => register());
  test('TC-767: hai màn không tràn ngang ở 360px và chữ 200%', async ({ page }, info) => {
    await householdStartFixture(page);
    const folder = '/tmp/angia-e27-s5-t1-stitch/screenshots';
    await mkdir(folder, { recursive: true });
    await page.goto('/waiting');
    await expect(page.getByRole('heading', { name: 'Bắt đầu', exact: true })).toBeVisible();
    await page.screenshot({ path: `${folder}/${info.project.name}-${theme}-start.png`, fullPage: true });
    await page.getByRole('link', { name: /Tạo nhà mới/ }).click();
    await expect(page.getByLabel('Tên nhà', { exact: true })).toBeVisible();
    await page.screenshot({ path: `${folder}/${info.project.name}-${theme}-create.png`, fullPage: true });
    await page.setViewportSize({ width: 360, height: 800 });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByRole('button', { name: 'Tạo nhà', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Quay lại', exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
  test('TC-767: admin có nhà không hiện ba tab; menu chỉ giữ một Hồ sơ của tôi', async ({ page }) => {
    const state = await householdStartFixture(page);
    Object.assign(state, { family: true, admin: true, linked: true });
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Quản trị hệ thống', exact: true })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Điều hướng chính' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Tài khoản', exact: true }).click();
    await expect(page.getByRole('link', { name: 'Hồ sơ của tôi', exact: true })).toHaveCount(1);
    await expect(page.getByText('Hồ sơ cá nhân', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Cài đặt gia đình', { exact: true })).toHaveCount(0);
  });
  test('TC-767: Thành viên chưa liên kết ẩn search và điều hướng', async ({ page }) => {
    const state = await householdStartFixture(page);
    Object.assign(state, { family: true, role: 'member' });
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Tài khoản', exact: true })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Điều hướng chính' })).toHaveCount(0);
    await expect(
      page.getByRole('combobox', { name: 'Tìm hồ sơ thành viên', includeHidden: true }),
    ).toHaveCount(0);
  });
}
