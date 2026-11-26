import type { Page } from '@playwright/test';

// Ngưỡng theo token hiện hành (owner giữ 46/44 px; 48 px sẽ cân nhắc khi có phản hồi người dùng).
const MIN_BUTTON = 46;
const MIN_TARGET = 44;

export async function findSmallControls(page: Page) {
  // Quét toàn trang, gồm header/nav và input; dùng nhiều main không gây strict-mode lỗi.
  return page
    .locator(
      'button:visible, a[href]:visible, input:not([type="hidden"]):visible, select:visible, textarea:visible, [role="button"]:visible',
    )
    .evaluateAll(
      (elements, min) =>
        elements
          // Input .sr-only (ví dụ chọn tệp) ẩn thị giác; đích chạm là nút/nhãn đi kèm.
          .filter((element) => !element.matches('.sr-only, [readonly], [disabled]'))
          .filter(
            // Liên kết nằm giữa câu được miễn theo WCAG 2.5.8 (inline).
            (element) =>
              !(
                element.matches('a') &&
                Array.from(element.parentElement?.childNodes ?? []).some(
                  (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
                )
              ),
          )
          .map((element) => {
            // Checkbox/radio: vùng chạm là nhãn gắn với ô native.
            const box =
              (element instanceof HTMLInputElement && element.labels?.[0]) ||
              element.closest('label') ||
              element;
            const rect = (
              element.matches('input[type="checkbox"], input[type="radio"]') ? box : element
            ).getBoundingClientRect();
            return {
              min: element.matches('[class*="min-h-btn"]') ? min.button : min.target,
              html: element.outerHTML,
              width: rect.width,
              height: rect.height,
            };
          })
          .filter(({ min, width, height }) => width < min || height < min),
      { button: MIN_BUTTON, target: MIN_TARGET },
    );
}
