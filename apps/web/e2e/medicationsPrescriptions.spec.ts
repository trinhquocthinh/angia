import { expect, test, type Page } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { reviewFixture } from './reviewFixture.js';

const RX_1 = '0199bc85-8918-7000-8000-000000000051';
const RX_2 = '0199bc85-8918-7000-8000-000000000052';
const DOC_1 = '0199bc85-8918-7000-8000-000000000053';
const ITEM_1 = '0199bc85-8918-7000-8000-000000000054';
const ITEM_2 = '0199bc85-8918-7000-8000-000000000055';
const COURSE_1 = '0199bc85-8918-7000-8000-000000000056';
const COURSE_2 = '0199bc85-8918-7000-8000-000000000057';

const ITEM_A = {
  id: ITEM_1,
  name: 'Amlodipin',
  strength: '10 mg',
  quantityPerDose: 1,
  doseUnit: 'viên',
  slots: ['morning'],
  durationDays: null,
  longTerm: true,
  externalUse: false,
  note: 'Uống sau ăn sáng',
  totalQuantity: 30,
  minIntervalText: null,
};

const ITEM_B = {
  id: ITEM_2,
  name: 'Canxi',
  strength: '500 mg',
  quantityPerDose: 1,
  doseUnit: 'viên',
  slots: ['morning'],
  durationDays: 30,
  longTerm: false,
  externalUse: false,
  note: null,
  totalQuantity: 30,
  minIntervalText: null,
};

const CHAIN = [
  {
    id: RX_1,
    issuedDate: '2026-10-01',
    facility: 'Bệnh viện Gia Định',
    diagnosis: null,
    itemCount: 2,
    revisitDate: '2026-11-01',
    origin: 'document',
  },
  {
    id: RX_2,
    issuedDate: '2026-11-01',
    facility: 'Bệnh viện Gia Định',
    diagnosis: 'Theo dõi huyết áp định kỳ',
    itemCount: 2,
    revisitDate: '2026-12-01',
    origin: 'document',
  },
];

function makeCourses(profileId: string) {
  return [
    {
      id: COURSE_1,
      healthProfileId: profileId,
      prescriptionItemId: ITEM_1,
      source: 'prescription',
      name: 'Amlodipin',
      strength: '10 mg',
      quantityPerDose: 1,
      doseUnit: 'viên',
      slots: ['morning'],
      startDate: '2026-11-01',
      endDate: null,
      status: 'active',
      prescriptionIssuedDate: '2026-11-01',
      lastDoseAt: null,
      interval: null,
    },
    {
      id: COURSE_2,
      healthProfileId: profileId,
      prescriptionItemId: null,
      source: 'self_reported',
      name: 'Canxi',
      strength: '500 mg',
      quantityPerDose: 1,
      doseUnit: 'viên',
      slots: ['morning', 'evening'],
      startDate: '2026-11-01',
      endDate: '2026-12-15',
      status: 'active',
      prescriptionIssuedDate: null,
      lastDoseAt: null,
      interval: null,
    },
  ];
}

function makeDetails(profileId: string) {
  const detail2 = {
    prescription: {
      id: RX_2,
      healthProfileId: profileId,
      sourceDocumentId: DOC_1,
      issuedDate: '2026-11-01',
      revisitDate: '2026-12-01',
      facility: 'Bệnh viện Gia Định',
      diagnosis: 'Theo dõi huyết áp định kỳ',
      manualWithoutSource: false,
      createdAt: '2026-11-01T00:00:00Z',
      items: [ITEM_A, ITEM_B],
    },
    previousId: RX_1,
    nextId: null,
    courses: [],
    diff: {
      added: [{ name: 'Canxi', items: [ITEM_B] }],
      removed: [
        { name: 'Metformin', items: [{ ...ITEM_A, id: DOC_1, name: 'Metformin', strength: '500 mg' }] },
      ],
      changed: [{ name: 'Amlodipin', changes: [{ field: 'strength', before: '5 mg', after: '10 mg' }] }],
    },
  };
  const detail1 = {
    ...detail2,
    prescription: {
      ...detail2.prescription,
      id: RX_1,
      issuedDate: '2026-10-01',
      items: [{ ...ITEM_A, strength: '5 mg' }],
    },
    previousId: null,
    nextId: RX_2,
    diff: null,
  };
  return { detail1, detail2 };
}

async function setupMedicationsFixture(page: Page) {
  const state = await reviewFixture(page);
  state.profile.familyId = 'family';
  const courses = makeCourses(state.profile.id);
  const { detail1, detail2 } = makeDetails(state.profile.id);
  await page.route(`**/api/health-profiles/${state.profile.id}/medication-courses/current`, (route) =>
    route.fulfill({ json: { today: '2026-11-26', courses } }),
  );
  await page.route(`**/api/health-profiles/${state.profile.id}/medication-courses/stoppable`, (route) =>
    route.fulfill({ json: { today: '2026-11-26', courses } }),
  );
  await page.route(`**/api/health-profiles/${state.profile.id}/reminders`, (route) =>
    route.fulfill({ json: [] }),
  );
  await page.route(`**/api/health-profiles/${state.profile.id}/prescriptions`, (route) =>
    route.fulfill({ json: CHAIN }),
  );
  await page.route(`**/api/health-profiles/${state.profile.id}/prescriptions/${RX_2}`, (route) =>
    route.fulfill({ json: detail2 }),
  );
  await page.route(`**/api/health-profiles/${state.profile.id}/prescriptions/${RX_1}`, (route) =>
    route.fulfill({ json: detail1 }),
  );
  return state;
}

for (const width of [360, 1440]) {
  test(`SPEC-081 — thuốc đang dùng ${width}px không tràn và đạt A11y`, async ({ page }, info) => {
    test.setTimeout(90_000);
    const state = await setupMedicationsFixture(page);
    await page.setViewportSize({ width, height: 900 });
    for (const theme of ['light', 'dark']) {
      await page.addInitScript((t) => {
        localStorage.setItem('angia-theme', t);
      }, theme);
      await page.goto(`/profiles/${state.profile.id}/medications`);
      await expect(page.getByRole('heading', { name: 'Thuốc đang dùng hôm nay' })).toBeVisible();
      await expect(page.getByText('Amlodipin')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (theme === 'light') {
        const axe = await new AxeBuilder({ page }).include('main').exclude('.account-menu-trigger').analyze();
        expect(axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
        await page.screenshot({ path: info.outputPath(`medications-${width}.png`), fullPage: true });
      }
      await page.getByRole('button', { name: /Thêm thuốc bổ, vitamin/ }).click();
      await expect(page.getByRole('heading', { name: /Thêm thuốc bổ, vitamin cho/ })).toBeVisible();
      await page.getByRole('button', { name: 'Hủy bỏ', exact: true }).click();
      await page.getByRole('button', { name: 'Đánh dấu dừng thuốc', exact: true }).click();
      await expect(page.getByRole('heading', { name: /Dừng uống thuốc cho/ })).toBeVisible();
      await page.getByRole('button', { name: 'Bỏ qua, vẫn tiếp tục uống', exact: true }).click();
    }
  });

  test(`SPEC-081 — chuỗi đơn và chi tiết so sánh ${width}px không tràn và đạt A11y`, async ({
    page,
  }, info) => {
    test.setTimeout(90_000);
    const state = await setupMedicationsFixture(page);
    await page.setViewportSize({ width, height: 900 });
    for (const theme of ['light', 'dark']) {
      await page.addInitScript((t) => {
        localStorage.setItem('angia-theme', t);
      }, theme);
      await page.goto(`/profiles/${state.profile.id}/prescriptions`);
      await expect(page.getByRole('heading', { name: 'Chuỗi đơn thuốc' })).toBeVisible();
      await expect(page.getByText('Đơn ngày 01/11/2026')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.getByRole('link', { name: 'Đơn ngày 01/11/2026' }).click();
      await expect(page.getByRole('heading', { name: 'Thay đổi so với đơn trước' })).toBeVisible();
      await expect(page.getByText('Nội dung trên đơn · 2 dòng thuốc')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (theme === 'light') {
        const axe = await new AxeBuilder({ page }).include('main').exclude('.account-menu-trigger').analyze();
        expect(axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
        await page.screenshot({ path: info.outputPath(`prescription-detail-${width}.png`), fullPage: true });
      }
      await page.getByRole('link', { name: /Đơn trước/ }).click();
      await expect(page.getByRole('heading', { name: 'Đơn ngày 01/10/2026' })).toBeVisible();
    }
  });
}
