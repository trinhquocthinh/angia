import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { householdStartFixture } from './householdStartFixture.js';
import { saveHouseholdScreenshot } from './saveHouseholdScreenshot.js';

export function householdDesignCases(theme: string) {
  householdCompactCreationCase();
  test('Stitch: đúng khối Bắt đầu theo breakpoint, không thêm viền', async ({ page }, info) => {
    await householdStartFixture(page);
    await page.goto('/waiting');
    const panel = page.locator('.household-start-panel').first();
    await expect(panel).toBeVisible();
    const desktop = info.project.name.includes('desktop');
    await expect(panel).toHaveCSS('border-top-width', '0px');
    await expect(panel).toHaveCSS('border-top-left-radius', desktop ? '28px' : '0px');
    if (desktop) {
      await expect(panel).toHaveCSS('padding-left', '40px');
      const shadow = await panel.evaluate((element) => getComputedStyle(element).boxShadow);
      if (theme === 'light') expect(shadow).toContain('12px 40px');
      else expect(shadow).toBe('none');
    }
  });
  test('Stitch: menu icon mở/đóng và trả focus', async ({ page }, info) => {
    await householdStartFixture(page);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/waiting?step=create');
    const trigger = page.getByRole('button', { name: 'Tài khoản', exact: true });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Tài khoản', exact: true });
    await expect(dialog).toBeVisible();
    await dialog.evaluate((element) =>
      Promise.all(element.getAnimations().map((animation) => animation.finished)),
    );
    // Chọn nền đã chuyển sang trang Quản lý tài khoản (E30-S1-T1); menu không còn radio.
    await expect(dialog.getByRole('radio')).toHaveCount(0);
    await expect(dialog).toHaveCSS(
      'border-top-left-radius',
      info.project.name.includes('desktop') ? '16px' : '28px',
    );
    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    if (!info.project.name.includes('desktop'))
      expect(Math.abs(box!.y + box!.height - page.viewportSize()!.height)).toBeLessThan(2);
    await mkdir('/tmp/angia-e27-s5-t1-stitch/screenshots', { recursive: true });
    await page.screenshot({
      path: `/tmp/angia-e27-s5-t1-stitch/screenshots/${info.project.name}-${theme}-menu.png`,
      fullPage: false,
    });
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await trigger.click();
    await expect(dialog).toBeVisible();
    await page.mouse.click(2, 90);
    await expect(dialog).toHaveCount(0);
  });
}

function householdCompactCreationCase() {
  test('Stitch: Tạo nhà nằm chung một block, không lồng card form', async ({ page }, info) => {
    await householdStartFixture(page);
    await page.goto('/waiting?step=create');
    const block = page.locator('.household-create-compact');
    await expect(block).toBeVisible();
    await saveHouseholdScreenshot(page, 'create');
    await expect(block).toHaveCSS('border-top-left-radius', '28px');
    await expect(block.getByRole('heading', { name: 'Tạo nhà mới', exact: true })).toBeVisible();
    await expect(block.locator('form')).toHaveCSS('box-shadow', 'none');
    await expect(block.locator('form')).toHaveCSS('padding-left', '0px');
    if (info.project.name.includes('desktop')) await expect(block).toHaveCSS('padding-left', '40px');
    await expect(page.getByText('Sẵn sàng lập sổ sức khỏe số', { exact: true })).toHaveCount(0);
  });
}
