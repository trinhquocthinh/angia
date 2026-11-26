import { expect, test } from '@playwright/test';
import { reminderFixture } from './reminderFixture.js';
import { REMINDER_ACCOUNT_ID, REMINDER_ID, REMINDER_PROFILE_ID } from './reminderUiSeed.js';
import { reminderLayoutCases } from './reminderLayoutCases.js';

const settingsPath = `/profiles/${REMINDER_PROFILE_ID}/reminders`;
reminderLayoutCases();

test('SPEC-081 — từ trạng thái rỗng lưu giờ và người nhận, giữ payload và CSRF', async ({ page }) => {
  const state = await reminderFixture(page, true);
  await page.goto(settingsPath);
  await expect(page.getByText('Chưa thiết lập khung giờ nhắc.', { exact: true })).toBeVisible();
  await expect(page.getByText('Chưa chỉ định người nhận nhắc.', { exact: true })).toBeVisible();
  await page.getByLabel('Sáng', { exact: true }).fill('07:30');
  await page.getByLabel('Tối', { exact: true }).fill('20:00');
  await page.getByRole('button', { name: 'Lưu khung giờ', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Đã lưu khung giờ nhắc.' })).toBeVisible();
  await page.getByRole('checkbox', { name: 'Lan', exact: true }).check();
  await page.getByRole('button', { name: 'Lưu người nhận', exact: true }).click();
  await expect(page.getByText('Đã lưu người nhận nhắc.', { exact: true })).toBeVisible();
  expect(state.writes.map(({ body, csrf }) => ({ body, csrf }))).toEqual([
    { body: { slots: { morning: '07:30', evening: '20:00' } }, csrf: 'csrf' },
    { body: { recipientAccountIds: [REMINDER_ACCOUNT_ID] }, csrf: 'csrf' },
  ]);
  await page.reload();
  await expect(page.getByLabel('Sáng', { exact: true })).toHaveValue('07:30');
  await expect(page.getByRole('checkbox', { name: 'Lan', exact: true })).toBeChecked();
  await expect(page.getByText('Chưa thiết lập khung giờ nhắc.', { exact: true })).toHaveCount(0);
});

test('SPEC-025 — giờ sai thứ tự chặn gửi và gắn lỗi vào đúng buổi', async ({ page }) => {
  const state = await reminderFixture(page);
  await page.goto(settingsPath);
  await page.getByLabel('Sáng', { exact: true }).fill('21:00');
  await page.getByRole('button', { name: 'Lưu khung giờ', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByLabel('Trưa', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  expect(state.writes).toHaveLength(0);
});

test('TC-816 — hồ sơ liên kết chỉ hiện người nhận cố định; hồ sơ trẻ dùng người giám hộ', async ({
  page,
}) => {
  const state = await reminderFixture(page);
  state.recipients.mode = 'linked';
  state.profile.hasLinkedAccount = true;
  await page.goto(settingsPath);
  await expect(page.getByText(/tài khoản liên kết/)).toBeVisible();
  await expect(page.getByRole('checkbox')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Lưu người nhận', exact: true })).toHaveCount(0);
  state.profile.hasLinkedAccount = false;
  state.profile.birthYear = new Date().getFullYear() - 6;
  await page.reload();
  await expect(page.getByRole('link', { name: 'Xem người giám hộ' })).toBeVisible();
  await expect(page.getByRole('checkbox')).toHaveCount(0);
});

test('TC-486 — xác nhận cả buổi và hủy xác nhận đọc lại trạng thái từ API', async ({ page }) => {
  const state = await reminderFixture(page);
  await page.goto(`/reminders/${REMINDER_ID}`);
  await expect(page.getByRole('list', { name: 'Thuốc trong buổi' }).getByRole('listitem')).toHaveCount(2);
  await page.getByRole('button', { name: 'Đã dùng', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Hủy xác nhận', exact: true })).toBeVisible();
  await expect(page.getByText(/Đã dùng.*Lan/)).toBeVisible();
  await page.getByRole('button', { name: 'Hủy xác nhận', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Đã dùng', exact: true })).toBeVisible();
  expect(state.writes.map(({ method, csrf }) => ({ method, csrf }))).toEqual([
    { method: 'POST', csrf: 'csrf' },
    { method: 'DELETE', csrf: 'csrf' },
  ]);
});

test('TC-479 — tái khám có đơn/rỗng và quyền mở tóm tắt', async ({ page }) => {
  const state = await reminderFixture(page);
  await page.goto(`/revisit-reminders/${REMINDER_ID}`);
  await expect(page.getByRole('link', { name: 'Tóm tắt đi khám', exact: true })).toBeVisible();
  await expect(page.getByText('Đơn không ghi nơi khám', { exact: true })).toBeVisible();
  state.revisit.prescriptions = [];
  state.revisit.canOpenSummary = false;
  await page.reload();
  await expect(page.getByText('Không còn đơn thuốc gắn ngày hẹn này.', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Tóm tắt đi khám', exact: true })).toHaveCount(0);
});

test('SPEC-035 — từ chối truy cập không lộ nội dung và không cho xác nhận', async ({ page }) => {
  const state = await reminderFixture(page);
  state.error = 404;
  for (const path of [`/reminders/${REMINDER_ID}`, `/revisit-reminders/${REMINDER_ID}`]) {
    await page.goto(path);
    await expect(page.getByRole('alert')).toHaveText('Không tìm thấy lời nhắc hoặc bạn không có quyền xem.');
    await expect(page.getByText('Vitamin mẫu A', { exact: false })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Đã dùng', exact: true })).toHaveCount(0);
  }
});
