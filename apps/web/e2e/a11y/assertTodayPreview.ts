import { chromium, expect } from '@playwright/test';

export async function assertTodayPreview(origin: string) {
  const browser = await chromium.launch({
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 360, height: 800 },
      timezoneId: 'Asia/Ho_Chi_Minh',
      locale: 'vi-VN',
    });
    for (const theme of ['light', 'dark']) {
      await page.goto(`${origin}/?a11yTheme=${theme}`);
      await expect(page.getByRole('heading', { name: 'Liều hôm nay', exact: true })).toBeVisible();
      await expect(page.getByRole('article')).toHaveCount(2);
      await expect(page.getByRole('button', { name: 'Đã dùng', exact: true })).toHaveCount(2);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    }
  } finally {
    await browser.close();
  }
}
