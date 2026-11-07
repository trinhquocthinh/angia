import { readFileSync } from 'node:fs';
import { expect, test, type Locator, type Page } from '@playwright/test';

const catalog = JSON.parse(
  readFileSync(
    new URL('../../../packages/contracts/src/painJournal/bodyRegions.v1.json', import.meta.url),
    'utf8',
  ),
) as Record<string, { label: string; sides: string[] }>;
const expectedLocations = new Map(
  Object.entries(catalog).flatMap(([region, value]) =>
    value.sides.map(
      (side) =>
        [
          value.label + (side === 'center' ? '' : ` · ${side === 'left' ? 'trái' : 'phải'}`),
          { region, side },
        ] as const,
    ),
  ),
);

test.beforeEach(async ({ page }) => {
  await page.goto('/e2e/bodyMap2D.html');
});

async function checkTargets(group: Locator) {
  const boxes = await group.getByRole('button').evaluateAll((buttons) =>
    buttons.map((button) => {
      const { x, y, width, height } = button.getBoundingClientRect();
      return { x, y, width, height, tag: button.tagName };
    }),
  );
  for (const [index, box] of boxes.entries()) {
    expect(box.tag).toBe('BUTTON');
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    for (const other of boxes.slice(index + 1)) {
      const gapX = Math.max(other.x - box.x - box.width, box.x - other.x - other.width);
      const gapY = Math.max(other.y - box.y - box.height, box.y - other.y - other.height);
      expect(Math.max(gapX, gapY)).toBeGreaterThanOrEqual(7.9);
    }
  }
}

async function checkSelection(page: Page, group: Locator, seen: Set<string>) {
  for (const button of await group.getByRole('button').all()) {
    const label = (await button.getAttribute('aria-label'))!.replace(' · đang theo dõi', '');
    const location = expectedLocations.get(label);
    expect(location).toBeDefined();
    await button.tap();
    await expect(page.getByTestId('selection')).toHaveText(JSON.stringify(location));
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    seen.add(`${location!.region}/${location!.side}`);
    // Kiểm cả mép hộp chạm, không chỉ tâm nút/đường SVG.
    await group.getByRole('button', { name: label === 'Đầu' ? 'Cổ' : 'Đầu', exact: true }).tap();
    await button.tap({ position: { x: 2, y: 2 } });
    await expect(page.getByTestId('selection')).toHaveText(JSON.stringify(location));
  }
}

test('TC-721: ở 360 px mọi vùng có hộp chạm 44 px, không chồng lấn và trả đúng vị trí', async ({ page }) => {
  const seen = new Set<string>();
  for (const [face, count] of [
    ['trước', 29],
    ['sau', 30],
  ] as const) {
    await page.getByRole('button', { name: `Mặt ${face}`, exact: true }).tap();
    const group = page.getByRole('group', { name: `Vùng cơ thể mặt ${face}` });
    await expect(group.getByRole('button')).toHaveCount(count);
    await checkTargets(group);
    await checkSelection(page, group, seen);
    const left = await group
      .getByRole('button', { name: 'Đầu gối · trái · đang theo dõi', exact: true })
      .boundingBox();
    const right = await group.getByRole('button', { name: 'Đầu gối · phải', exact: true }).boundingBox();
    expect(face === 'trước' ? left!.x > right!.x : left!.x < right!.x).toBe(true);
  }
  expect(seen.size).toBe(35);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('TC-721: Tab, Enter, Space và trạng thái chọn được giữ qua hai mặt', async ({ page }) => {
  await page.getByRole('button', { name: 'Mặt sau', exact: true }).focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Đầu', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('selection')).toHaveText('{"region":"head","side":"center"}');
  const wrist = page.getByRole('button', { name: 'Cổ tay · phải', exact: true });
  await wrist.focus();
  await expect(wrist).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('Space');
  await expect(page.getByTestId('selection')).toHaveText('{"region":"wrist","side":"right"}');
  await page.getByRole('button', { name: 'Mặt sau', exact: true }).tap();
  await expect(wrist).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Thắt lưng', exact: true }).tap();
  await page.getByRole('button', { name: 'Mặt trước', exact: true }).tap();
  await expect(page.getByText('Đã chọn: Thắt lưng', { exact: true })).toBeVisible();
  await expect(page.getByText('Đã chọn: Thắt lưng', { exact: true })).toHaveAttribute('aria-live', 'polite');
});

test('TC-721: chấm và nhãn theo dõi chỉ hiện đúng vùng, cập nhật khi prop đổi', async ({ page }) => {
  const tracked = page.getByRole('button', { name: 'Đầu gối · trái · đang theo dõi', exact: true });
  await expect(tracked.locator('[data-tracking-dot]')).toHaveCount(1);
  await expect(
    page.getByRole('button', { name: 'Đầu gối · phải', exact: true }).locator('[data-tracking-dot]'),
  ).toHaveCount(0);
  await tracked.tap();
  await expect(tracked.locator('[data-tracking-dot]')).toHaveCSS('background-color', 'rgb(85, 97, 95)');
  await expect(page.getByTestId('selection')).toHaveText('{"region":"knee","side":"left"}');
  await page.getByRole('button', { name: 'Đổi vùng theo dõi' }).tap();
  await expect(page.getByRole('button', { name: 'Đầu gối · trái', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.locator('[data-tracking-dot]')).toHaveCount(0);
});

test('TC-721: khung hẹp 296 px vẫn giữ vùng chạm và khoảng cách, không tràn ngang', async ({ page }) => {
  await page.getByRole('main').evaluate((element) => {
    element.style.padding = '32px';
  });
  for (const face of ['trước', 'sau']) {
    await page.getByRole('button', { name: `Mặt ${face}`, exact: true }).tap();
    await checkTargets(page.getByRole('group', { name: `Vùng cơ thể mặt ${face}` }));
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
