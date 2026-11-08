import { expect, type Page, test } from '@playwright/test';

const openSheet = async (page: Page) => {
  await page.getByRole('button', { name: 'Mở sheet' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(1);
};
const modeButton = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const unavailable = 'Không mở được chế độ 3D trên thiết bị này.';

test('SPEC-058 — mặc định "Hình", có nút 3D, chưa tải chunk 3D; chọn 3D thì lần sau mở thẳng 3D', async ({
  page,
}) => {
  const chunks: string[] = [];
  page.on('request', (request) => {
    if (/BodyModel3DScene|body.*\.glb/.test(request.url())) chunks.push(request.url());
  });
  await page.goto('/e2e/newPainIssue.html');
  await openSheet(page);
  await expect(modeButton(page, 'Hình')).toHaveAttribute('aria-pressed', 'true');
  await expect(modeButton(page, '3D')).toBeVisible();
  expect(chunks).toEqual([]);
  await modeButton(page, '3D').click();
  await expect(page.locator('canvas')).toBeVisible();
  expect(chunks.length).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Đóng', exact: true }).click();
  await openSheet(page);
  await expect(modeButton(page, '3D')).toHaveAttribute('aria-pressed', 'true');
});

test('TC-730 — không có WebGL: ẩn nút 3D, chế độ nhớ "3D" mở "Hình"', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('angia.painRegionPickerMode', '3d');
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      id: string,
      ...rest: never[]
    ) {
      return id.startsWith('webgl') ? null : original.call(this, id, ...rest);
    } as typeof original;
  });
  await page.goto('/e2e/newPainIssue.html');
  await openSheet(page);
  await expect(modeButton(page, 'Hình')).toHaveAttribute('aria-pressed', 'true');
  await expect(modeButton(page, '3D')).toHaveCount(0);
});

test('TC-730 — chunk 3D lỗi: quay về "Hình", báo lỗi, 2D vẫn chọn được và nhớ "Hình"', async ({ page }) => {
  await page.route(/BodyModel3DScene/, (route) => route.abort());
  await page.goto('/e2e/newPainIssue.html');
  await openSheet(page);
  await modeButton(page, '3D').click();
  await expect(page.getByRole('status').filter({ hasText: unavailable })).toBeVisible();
  await expect(modeButton(page, 'Hình')).toHaveAttribute('aria-pressed', 'true');
  await expect(modeButton(page, '3D')).toHaveCount(0);
  await page.getByRole('button', { name: 'Đầu gối · phải', exact: true }).click();
  await expect(page.getByText('Đã chọn: Đầu gối · phải')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('angia.painRegionPickerMode'))).toBe('image');
});

test('TC-722 (3D) — chạm gối trái đang theo dõi trên mô hình mở vấn đề đang có', async ({ page }) => {
  await page.goto('/e2e/newPainIssue.html');
  await openSheet(page);
  await modeButton(page, '3D').click();
  const canvas = page.locator('canvas');
  // Canvas mới gắn có cỡ mặc định 300×150; đợi R3F đo lại theo khung h-96 rồi mới tính tọa độ.
  await expect.poll(async () => (await canvas.boundingBox())?.height ?? 0).toBeGreaterThan(300);
  const box = (await canvas.boundingBox())!;
  // Camera nhìn tâm y 0,5 với fov 35°: giữa vùng gối ở y ≈ 0,28 (mốc t3_regions 0,245–0,31); trái người = phải màn hình.
  const halfWorld = 2.2 * Math.tan((17.5 * Math.PI) / 180);
  const x = box.x + box.width / 2 + (0.06 / halfWorld) * (box.height / 2);
  const y = box.y + box.height / 2 + (0.22 / halfWorld) * (box.height / 2);
  await page.mouse.click(x, y);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByTestId('handoff')).toHaveText(
    JSON.stringify({ kind: 'existing', issueId: '00000000-0000-4000-8000-000000000001' }),
  );
});
