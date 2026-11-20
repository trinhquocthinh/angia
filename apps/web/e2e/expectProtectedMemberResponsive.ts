import { expect, type Page } from '@playwright/test';

export async function expectProtectedMemberResponsive(page: Page) {
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const dialog = page.getByRole('dialog', { name: 'Chi tiết thành viên', exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Không thể thao tác với Chủ hộ.', { exact: true })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Lưu thay đổi', exact: true })).toHaveCount(0);
  }
}
