import { expect, type Page } from '@playwright/test';

export async function expectProtectedMemberResponsive(page: Page) {
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const sheet = page.getByRole('dialog', { name: 'Chi tiết thành viên', exact: true });
    if (width < 1024) await expect(sheet).toBeVisible();
    else await expect(sheet).toHaveCount(0);
    await expect(page.getByText('Không thể thao tác với Chủ hộ.', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Lưu thay đổi', exact: true })).toHaveCount(0);
  }
}
