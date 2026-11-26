import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

export async function assertRouteScreen(page: Page, expectedPath: string) {
  await expect
    .soft(page, 'TC-862: route không chuyển nhầm sang màn khác')
    .toHaveURL((url) => url.pathname.replace(/\/$/, '') === expectedPath.replace(/\/$/, ''));
  await expect.soft(page.locator('main:visible, h1:visible, h2:visible').first()).toBeVisible();
  await expect.soft(page.getByRole('heading').first(), 'Màn đã nạp nội dung thật').toBeVisible();
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch((error: unknown) => {
    expect.soft(String(error), 'Màn phải kết thúc các request khởi tạo').toBe('');
  });
  await expect.soft(page.locator('[aria-busy="true"]:visible, .animate-spin:visible')).toHaveCount(0);
  await expect.soft(page.getByRole('status').filter({ hasText: /Đang (tải|kiểm tra|mở)/i })).toHaveCount(0);
  // Root luôn có main, vì vậy cần kiểm nội dung thực thay vì chỉ sự tồn tại của landmark.
  await expect.soft(page.locator('body')).not.toHaveText(/^\s*$/);
  await expect
    .soft(
      page.getByText(
        /không tìm thấy route|not found|something went wrong|đã xảy ra lỗi|không thể tải|không thể kết nối/i,
      ),
    )
    .toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
}
