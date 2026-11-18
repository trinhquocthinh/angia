import { mkdir } from 'node:fs/promises';
import { test, type Page } from '@playwright/test';

export async function saveHouseholdScreenshot(page: Page, screen: string) {
  const directory = '/tmp/angia-e27-s5-t2-evidence';
  await mkdir(directory, { recursive: true });
  const info = test.info();
  const theme = info.titlePath.some((title) => title.endsWith('dark')) ? 'dark' : 'light';
  await page.screenshot({ path: `${directory}/${screen}-${info.project.name}-${theme}.png`, fullPage: true });
}
