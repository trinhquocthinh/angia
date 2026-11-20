import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { accountFixture } from './accountFixture.js';
import { byLabel } from './accountChecks.js';

export function accountRegistrationClayCase(theme: string) {
  test(`đăng ký giữ 5 icon form và dùng icon tiện ích 3D của login — ${theme}`, async ({ page }, info) => {
    await accountFixture(page);
    await page.goto('/register');
    const heading = page.locator('.login-form-heading img[src="/images/register/clay/heading.svg"]');
    await expect(heading).toBeVisible();
    await expect(heading).toHaveCSS('width', '32px');
    await expect
      .poll(() => heading.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
      .toBe(true);
    for (const name of ['user', 'key', 'name', 'email']) {
      const control = page.locator(`.registration-${name === 'key' ? 'password' : name}`);
      const icon = await control.evaluate((element) => {
        const css = getComputedStyle(element, '::before');
        return {
          image: css.backgroundImage,
          mask: css.maskImage,
          width: css.width,
          height: css.height,
          content: css.content,
        };
      });
      expect(icon.image).toContain(`/images/register/clay/${name}.svg`);
      expect(icon).toMatchObject({ mask: 'none', width: '20px', height: '20px', content: '""' });
      const response = await page.request.get(`/images/register/clay/${name}.svg`);
      await expect(response).toBeOK();
    }
    await expect(page.locator('.login-brand-panel img[src*="/images/register/clay/"]')).toHaveCount(0);
    await expect(page.locator('.login-brand-panel .login-clay-icon')).toHaveCount(3);
    for (const name of ['medication', 'heart', 'family']) {
      await expect(page.locator(`.login-brand-panel .login-clay-icon-${name} img`)).toHaveAttribute(
        'src',
        `/images/login/clay/desktop-${name}.svg`,
      );
    }
    await mkdir('/tmp/angia-register-form-3d-stitch/screenshots', { recursive: true });
    await page.screenshot({
      path: `/tmp/angia-register-form-3d-stitch/screenshots/${info.project.name}-${theme}.png`,
      fullPage: true,
    });
    const password = byLabel(page, 'Mật khẩu');
    await password.fill('Abcd123!');
    await page.getByRole('button', { name: 'Hiện mật khẩu', exact: true }).click();
    await expect(password).toHaveAttribute('type', 'text');
    await expect(page.getByRole('meter')).toHaveAttribute('aria-valuenow', '4');
    await page.setViewportSize({ width: 360, height: 800 });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
