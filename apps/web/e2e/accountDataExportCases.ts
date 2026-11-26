import { expect, test } from '@playwright/test';
import { accountDataDeletionFixture } from './accountDataDeletionFixture.js';

export function registerSelfExportCase() {
  test('TC-819: tải dữ liệu cá nhân tạo ZIP và tải tệp xuống', async ({ page }) => {
    const state = await accountDataDeletionFixture(page, {
      family: { id: 'fam-1', name: 'Nhà Ngọc Lan', isOwner: false },
      exportStatuses: ['pending', 'ready'],
    });
    await page.goto('/account');
    const card = page.getByRole('region', { name: 'Dữ liệu của tôi' });
    await expect(card.getByLabel('Hồ sơ cần tải')).toHaveCount(0);
    await card.getByRole('button', { name: 'Tải dữ liệu của tôi', exact: true }).click();
    await expect(card.getByRole('button', { name: 'Đang tạo tệp…' })).toBeDisabled();
    await expect(
      card.getByText('Việc này có thể mất ít phút. Bạn có thể ở lại trang này.', { exact: true }),
    ).toBeVisible();
    await expect(card.getByText('Tệp ZIP đã sẵn sàng.', { exact: true })).toBeVisible({ timeout: 10_000 });
    await expect(card.getByText('Liên kết hết hạn sau 24 giờ.', { exact: true })).toBeVisible();
    expect(state.exportCalls).toEqual([{ body: { scope: 'self' }, csrf: 'csrf-e2e' }]);

    const downloadPromise = page.waitForEvent('download');
    await card.getByRole('link', { name: 'Tải tệp ZIP', exact: true }).click();
    const download = await downloadPromise;
    // Tên tệp do header Content-Disposition của API quyết định (đã kiểm ở test API S3-T2); route giả của Playwright không giữ header này.
    expect(download.url()).toContain('/api/me/data-exports/exp-e2e-1/file');
  });
}

export function registerOwnerExportCase() {
  test('TC-820: Chủ hộ chọn hồ sơ chưa liên kết gửi scope { profileId }', async ({ page }) => {
    const state = await accountDataDeletionFixture(page, {
      family: { id: 'fam-1', name: 'Nhà An', isOwner: true },
      profiles: [
        {
          id: 'prof-me',
          displayName: 'Lan',
          relationship: 'Bản thân',
          birthYear: 1990,
          hasLinkedAccount: true,
          consentStatus: 'granted',
        },
        {
          id: 'prof-child',
          displayName: 'Bé An',
          relationship: 'Con',
          birthYear: 2020,
          hasLinkedAccount: false,
          consentStatus: 'granted',
        },
      ],
      exportStatuses: ['ready'],
    });
    await page.goto('/account');
    const card = page.getByRole('region', { name: 'Dữ liệu của tôi' });
    const select = card.getByLabel('Hồ sơ cần tải');
    await expect(select).toHaveValue('self');
    await expect(select.locator('option')).toHaveText(['Dữ liệu của tôi', 'Bé An']);
    await select.selectOption('prof-child');
    await card.getByRole('button', { name: 'Tải dữ liệu hồ sơ', exact: true }).click();
    await expect(card.getByText('Tệp ZIP đã sẵn sàng.', { exact: true })).toBeVisible({ timeout: 10_000 });
    expect(state.exportCalls).toEqual([{ body: { scope: { profileId: 'prof-child' } }, csrf: 'csrf-e2e' }]);
  });
}

export function registerExportErrorCase() {
  test('TC-821: tải dữ liệu hiển thị lỗi quá giới hạn (429) và lỗi thất bại kèm nút Thử lại', async ({
    page,
  }) => {
    const state = await accountDataDeletionFixture(page, {
      exportCreateStatus: 429,
      exportCreateCode: 'ERR_RATE_LIMITED',
    });
    await page.goto('/account');
    const card = page.getByRole('region', { name: 'Dữ liệu của tôi' });
    await card.getByRole('button', { name: 'Tải dữ liệu của tôi', exact: true }).click();
    await expect(card.getByRole('alert')).toHaveText(
      'Bạn đã tải dữ liệu 3 lần trong 24 giờ qua. Vui lòng thử lại vào ngày mai.',
    );

    state.exportCreateStatus = 202;
    state.exportCreateCode = '';
    state.exportStatuses = ['failed'];
    await card.getByRole('button', { name: 'Tải dữ liệu của tôi', exact: true }).click();
    await expect(card.getByRole('alert')).toHaveText('Chưa tạo được tệp dữ liệu. Vui lòng thử lại.', {
      timeout: 10_000,
    });
    await expect(card.getByRole('button', { name: 'Thử lại', exact: true })).toBeVisible();
  });
}
