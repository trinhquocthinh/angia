import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const catalog = JSON.parse(
  readFileSync(
    new URL('../../../packages/contracts/src/painJournal/bodyRegions.v1.json', import.meta.url),
    'utf8',
  ),
) as Record<string, { label: string; sides: string[] }>;
const locations = Object.entries(catalog).flatMap(([region, entry]) =>
  entry.sides.map((side) => ({
    region,
    side,
    label: entry.label + (side === 'center' ? '' : ` · ${side === 'left' ? 'trái' : 'phải'}`),
  })),
);

test.beforeEach(async ({ page }) => {
  await page.goto('/e2e/bodyMap2D.html?view=list');
});

test('TC-720: Tab, mũi tên và Enter chọn đủ 35 vị trí, có nhóm và nhãn accessibility', async ({ page }) => {
  const list = page.getByRole('group', { name: 'Chọn vùng cơ thể', exact: true });
  await expect(list.getByRole('radio')).toHaveCount(35);
  await expect(list.getByRole('radio', { checked: true })).toHaveCount(0);
  for (const [name, count] of [
    ['Đầu và thân', 7],
    ['Tay', 12],
    ['Chân', 16],
  ] as const) {
    await expect(list.getByRole('group', { name, exact: true }).getByRole('radio')).toHaveCount(count);
  }
  await page.keyboard.press('Tab');
  for (const [index, location] of locations.entries()) {
    const radio = list.getByRole('radio', { name: location.label, exact: true });
    await expect(radio).toBeFocused();
    await expect(radio).toHaveCSS('outline-style', 'solid');
    if (index > 0) await expect(radio).toBeChecked();
    await page.keyboard.press('Enter');
    await expect(radio).toBeChecked();
    await expect(list.getByRole('radio', { checked: true })).toHaveCount(1);
    await expect(page.getByTestId('selection')).toHaveText(
      JSON.stringify({ region: location.region, side: location.side }),
    );
    if (index < locations.length - 1) await page.keyboard.press('ArrowDown');
  }
  await page.keyboard.press('ArrowDown');
  await expect(list.getByRole('radio', { name: 'Đầu', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Đổi vùng theo dõi' })).toBeFocused();
  await expect(list).toMatchAriaSnapshot(`
    - group "Chọn vùng cơ thể":
      - text: Chọn vùng cơ thể
      - group "Đầu và thân":
        - heading "Đầu và thân" [level=3]
        - radio "Đầu" [checked]
  `);
});

test('TC-720: Space, mũi tên ngược và cập nhật lựa chọn từ bên ngoài', async ({ page }) => {
  const neck = page.getByRole('radio', { name: 'Cổ', exact: true });
  await neck.focus();
  await page.keyboard.press('Space');
  await expect(neck).toBeChecked();
  await page.keyboard.press('ArrowUp');
  await expect(page.getByRole('radio', { name: 'Đầu', exact: true })).toBeChecked();
  await page.getByRole('button', { name: 'Chọn thắt lưng' }).click();
  await expect(page.getByRole('radio', { name: 'Thắt lưng', exact: true })).toBeChecked();
  await expect(page.getByRole('radio', { checked: true })).toHaveCount(1);
});
