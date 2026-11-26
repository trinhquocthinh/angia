import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { findSmallControls } from './findSmallControls.js';

// .summary-sheet là tờ A4 in, cỡ chữ cố định theo pt (SDD: bản in không đổi).
export async function assertLayout(page: Page) {
  // Quét toàn trang, gồm header/nav và input; dùng nhiều main không gây strict-mode lỗi.
  const controls = await findSmallControls(page);
  expect.soft(controls, 'Vùng chạm tối thiểu: nút 46 px, phần tử khác 44 px').toEqual([]);
  const smallText = await page.locator('body *').evaluateAll((elements) =>
    elements
      .filter(
        (element) =>
          !element.closest('script, style, [aria-hidden="true"], .sr-only, .summary-sheet') &&
          Array.from(element.childNodes).some(
            (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
          ) &&
          element.getClientRects().length > 0 &&
          getComputedStyle(element).visibility !== 'hidden' &&
          parseFloat(getComputedStyle(element).fontSize) <
            (document.documentElement.dataset.textSize === 'large' ? 16 : 14),
      )
      .map((element) => ({
        text: element.textContent,
        fontSize: getComputedStyle(element).fontSize,
        html: element.outerHTML,
      })),
  );
  expect.soft(smallText, 'Chữ nội dung tối thiểu 14 px, Chữ lớn 16 px').toEqual([]);
  expect
    .soft(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      'Không tràn ngang ở 360 px',
    )
    .toBe(true);
}
