import { expect, test } from '@playwright/test';

for (const colorScheme of ['light', 'dark'] as const) {
  for (const name of ['Mở hộp thoại', 'Mở bảng bên']) {
    test(`E25-S2-T1 — chữ và vùng chạm trong ${name}, nền ${colorScheme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto('/e2e/uiFoundation.html');
      await page.getByRole('button', { name, exact: true }).click();
      const primary = page.getByRole('button', { name: 'Lưu thông tin', exact: true });
      await expect(primary).toHaveCSS('font-size', '20px');
      await expect(primary).toHaveCSS('line-height', '28px');
      await expect(page.getByRole('button', { name: 'Hủy', exact: true })).toHaveCSS('font-size', '18px');
      expect((await primary.boundingBox())!.height).toBeGreaterThanOrEqual(56);
      for (const button of await page.getByRole('dialog').getByRole('button').all()) {
        const box = (await button.boundingBox())!;
        expect(box.height).toBeGreaterThanOrEqual(48);
        expect(box.width).toBeGreaterThanOrEqual(48);
      }
      await expect(page.getByText('Nội dung giải thích')).toHaveCSS('font-size', '16px');
      await expect(page.getByRole('heading', { name: 'Thông tin thử' })).toHaveCSS('font-size', '22px');
    });
  }
}

for (const name of ['Mở hộp thoại', 'Mở bảng bên']) {
  test(`E25-S2-T1 — ${name} giữ focus, khóa đóng khi đang lưu và trả focus`, async ({ page }) => {
    await page.goto('/e2e/uiFoundation.html');
    const opener = page.getByRole('button', { name, exact: true });
    await opener.focus();
    await opener.press('Enter');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toHaveAccessibleName('Thông tin thử');
    const count = await dialog.getByRole('button').count();
    for (let index = 0; index < count + 2; index++) {
      await page.keyboard.press('Tab');
      expect(
        await dialog.evaluate(
          (element) => element.contains(document.activeElement) || document.activeElement === document.body,
        ),
      ).toBe(true);
    }
    await page.getByRole('button', { name: 'Giả lập đang lưu' }).click();
    await expect(page.getByRole('button', { name: 'Đóng hộp thoại' })).toBeDisabled();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeVisible();
    await page.getByRole('button', { name: 'Cho phép đóng' }).click();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(opener).toBeFocused();
    await opener.focus();
    await opener.press('Enter');
    await page.getByRole('button', { name: 'Đóng hộp thoại' }).click();
    await expect(opener).toBeFocused();
  });
}

for (const colorScheme of ['light', 'dark'] as const) {
  test(`E25-S2-T1 — Field liên kết lỗi, Button không tự submit và Card nền ${colorScheme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto('/e2e/uiFoundation.html');
    const input = page.getByRole('textbox', { name: 'Tên thuốc' });
    await expect(input).toHaveAccessibleDescription('Theo tên trên đơn');
    await expect(input).toHaveCSS('font-size', '18px');
    await page.getByText('Tên thuốc', { exact: false }).first().click();
    await expect(input).toBeFocused();
    await input.fill('Tên thử');
    await page.getByRole('button', { name: 'Kiểm tra tên' }).click();
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveAccessibleDescription('Theo tên trên đơn Cần kiểm tra tên');
    await expect(page.getByRole('alert')).toHaveCSS('font-size', '16px');
    await expect(page.getByLabel('Số lần gửi')).toHaveText('0');
    await page.getByRole('button', { name: 'Gửi biểu mẫu' }).click();
    await expect(page.getByLabel('Số lần gửi')).toHaveText('1');
    await expect(page.getByRole('button', { name: 'Nút bị khóa' })).toBeDisabled();
    await input.focus();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Kiểm tra tên' })).toHaveCSS('outline-width', '3px');
    await expect(page.getByTestId('card')).toHaveCSS('font-size', '18px');
    if (colorScheme === 'dark') await expect(page.getByTestId('card')).toHaveCSS('box-shadow', 'none');
  });
}

for (const name of ['Mở hộp thoại', 'Mở bảng bên']) {
  test(`E25-S2-T1 — ${name} phóng chữ 200% không tràn ngang hoặc cắt chữ nút`, async ({ page }) => {
    await page.goto('/e2e/uiFoundation.html');
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    const longButton = page.getByRole('button', { name: 'Nhãn nút phụ đủ dài', exact: false });
    await expect(longButton).toHaveCSS('font-size', '36px');
    expect(
      await longButton.evaluate(
        (element) =>
          element.scrollHeight <= element.clientHeight && element.scrollWidth <= element.clientWidth,
      ),
    ).toBe(true);
    await page.getByRole('button', { name, exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Thông tin thử' })).toHaveCSS('font-size', '44px');
    const close = page.getByRole('button', { name: 'Đóng hộp thoại' });
    await expect(close).toBeInViewport();
    expect(
      await page.getByRole('dialog').evaluate((element) => element.scrollWidth <= element.clientWidth),
    ).toBe(true);
  });
}

test('E25-S2-T1 — giảm chuyển động tắt animation và transition', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/e2e/uiFoundation.html');
  const opener = page.getByRole('button', { name: 'Mở hộp thoại', exact: true });
  await expect(opener).toHaveCSS('transition-property', 'none');
  await opener.focus();
  await opener.press('Enter');
  await expect(page.getByRole('dialog')).toHaveCSS('animation-name', 'none');
});

test('E25-S2-T1 — mở sheet tối đa 200 ms, không chạy hiệu ứng nội dung so le', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/e2e/uiFoundation.html');
  await page.getByRole('button', { name: 'Mở hộp thoại', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCSS('animation-duration', '0.2s');
  await expect(page.getByRole('heading', { name: 'Thông tin thử' })).toHaveCSS('animation-name', 'none');
});
