import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { accountFixture } from './accountFixture.js';
import { byLabel } from './accountChecks.js';

async function layoutSignature(page: Page) {
  await page.locator('.login-screen').waitFor();
  return page.evaluate(() => ({
    background: getComputedStyle(document.querySelector('.login-screen')!).backgroundColor,
    landscape: document.querySelector('.login-landscape')?.getAttribute('src'),
    brand: document.querySelector('.login-brand-panel')?.textContent,
    clouds: Array.from(document.querySelectorAll('.login-cloud')).map((element) => ({
      name: getComputedStyle(element).animationName,
      duration: getComputedStyle(element).animationDuration,
    })),
    mobileClouds: Array.from(document.querySelectorAll('.login-mobile-clouds img')).map((element) =>
      element.getAttribute('src'),
    ),
  }));
}

export function accountRegistrationDesignCase(theme: string) {
  test(`đăng ký giữ layout, animation login và liên kết pháp lý rõ ràng — ${theme}`, async ({ page }) => {
    await accountFixture(page);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/login');
    const login = await layoutSignature(page);
    await page.goto('/register');
    expect(await layoutSignature(page)).toEqual(login);
    await expect(page.getByRole('region')).toHaveAttribute('aria-labelledby', 'register-title');
    for (const name of ['Điều khoản sử dụng', 'Chính sách quyền riêng tư']) {
      const link = page.getByRole('link', { name, exact: true });
      await expect(link).toBeVisible();
      expect(await link.evaluate((element) => getComputedStyle(element).textDecorationLine)).toContain(
        'underline',
      );
      await expect(link).toHaveAttribute('target', '_blank');
    }
    await byLabel(page, 'Mật khẩu').fill('Abcd123!');
    await expect(page.getByRole('meter')).toHaveAttribute('aria-valuenow', '4');
    await byLabel(page, 'Mật khẩu').fill('abcdefgh');
    await expect(page.getByRole('meter')).toHaveAttribute('aria-valuetext', 'Yếu');
    const submit = page.getByRole('button', { name: 'Tạo tài khoản', exact: true });
    await submit.dispatchEvent('pointerdown', { pointerType: 'touch', clientX: 100, clientY: 100 });
    await expect(page.locator('.login-button-ripple')).toHaveCount(1);
    await expect(page.locator('.login-button-ripple')).toHaveCount(0);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await submit.dispatchEvent('pointerdown', { pointerType: 'touch', clientX: 100, clientY: 100 });
    await expect(page.locator('.login-button-ripple')).toHaveCount(0);
    if (page.viewportSize()!.width < 1024) {
      await expect(page.locator('.login-desktop-features')).toBeHidden();
      await expect(page.locator('.login-mobile-clouds')).toBeVisible();
    }
  });
}
