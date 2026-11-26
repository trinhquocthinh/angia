import { expect, test, type Page } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { reviewFixture } from './reviewFixture.js';

const M1 = '0199bc85-8918-7000-8000-000000000061';
const M2 = '0199bc85-8918-7000-8000-000000000062';
const L1 = '0199bc85-8918-7000-8000-000000000063';
const L2 = '0199bc85-8918-7000-8000-000000000064';
const T1 = '0199bc85-8918-7000-8000-000000000065';
const C1 = '0199bc85-8918-7000-8000-000000000066';
const D1 = '0199bc85-8918-7000-8000-000000000067';

function buildMeasurements(profileId: string) {
  return [
    {
      id: M1,
      healthProfileId: profileId,
      sourceDocumentId: null,
      kind: 'blood_pressure',
      measuredOn: '2026-11-24',
      measuredTime: '08:00',
      systolic: 146,
      diastolic: 88,
      pulse: 74,
      glucoseValue: null,
      glucoseUnit: null,
      manualWithoutSource: true,
      createdAt: '2026-11-24T01:00:00Z',
    },
    {
      id: M2,
      healthProfileId: profileId,
      sourceDocumentId: null,
      kind: 'blood_pressure',
      measuredOn: '2026-11-20',
      measuredTime: '08:15',
      systolic: 140,
      diastolic: 86,
      pulse: 72,
      glucoseValue: null,
      glucoseUnit: null,
      manualWithoutSource: true,
      createdAt: '2026-11-20T01:15:00Z',
    },
  ];
}

function buildLabSeries(profileId: string) {
  return [
    {
      testName: 'HbA1c',
      results: [
        {
          id: L1,
          healthProfileId: profileId,
          sourceDocumentId: null,
          resultDate: '2026-11-01',
          testName: 'HbA1c',
          value: '6.4',
          unit: '%',
          referenceRange: '4.0 - 6.0',
          facility: 'BV Gia Định',
          manualWithoutSource: true,
          createdAt: '2026-11-01T08:00:00Z',
        },
      ],
    },
    {
      testName: 'Creatinin',
      results: [
        {
          id: L2,
          healthProfileId: profileId,
          sourceDocumentId: null,
          resultDate: '2026-11-01',
          testName: 'Creatinin',
          value: '72',
          unit: 'µmol/L',
          referenceRange: '45 - 84',
          facility: 'BV Gia Định',
          manualWithoutSource: true,
          createdAt: '2026-11-01T08:00:00Z',
        },
      ],
    },
  ];
}

function buildAsNeededCourse(profileId: string) {
  return {
    id: C1,
    healthProfileId: profileId,
    prescriptionItemId: L1,
    source: 'prescription',
    name: 'Paracetamol',
    strength: '250 mg',
    quantityPerDose: 1,
    doseUnit: 'gói',
    slots: ['as_needed'],
    startDate: '2026-11-20',
    endDate: null,
    status: 'active',
    prescriptionIssuedDate: '2026-11-20',
    lastDoseAt: '2026-11-26T04:00:00Z',
    interval: { text: '4–6 giờ', source: 'prescription' },
  };
}

const TEMP_READINGS = [
  {
    id: T1,
    celsius: 38.5,
    measuredAt: '2026-11-26T04:30:00Z',
    recordedBy: null,
    recordedAt: '2026-11-26T04:31:00Z',
  },
];

const AS_NEEDED_DOSES = [
  {
    id: D1,
    courseId: C1,
    givenAt: '2026-11-26T04:00:00Z',
    quantity: 1,
    unit: 'gói',
    recordedBy: null,
    recordedAt: '2026-11-26T04:01:00Z',
  },
];

async function setupHealthFixture(page: Page) {
  const state = await reviewFixture(page);
  state.profile.familyId = 'family';
  const pid = state.profile.id;
  const items = buildMeasurements(pid);
  await page.route(`**/api/health-profiles/${pid}/measurements/series*`, (route) =>
    route.fulfill({
      json: {
        points: items.map((item) => ({ ...item, displayGlucoseValue: null, displayGlucoseUnit: null })),
        periods: [],
        weeks: [{ weekStart: '2026-11-23', hasMeasurement: true }],
      },
    }),
  );
  await page.route(`**/api/health-profiles/${pid}/measurements?*`, (route) =>
    route.fulfill({ json: { items, nextCursor: null } }),
  );
  await page.route(`**/api/health-profiles/${pid}/lab-result-series`, (route) =>
    route.fulfill({ json: buildLabSeries(pid) }),
  );
  await page.route(`**/api/health-profiles/${pid}/temperatures*`, (route) =>
    route.fulfill({ json: { readings: TEMP_READINGS } }),
  );
  await page.route(`**/api/health-profiles/${pid}/timeline*`, (route) =>
    route.fulfill({ json: { items: [], nextCursor: null } }),
  );
  await page.route(`**/api/health-profiles/${pid}/medication-courses/current`, (route) =>
    route.fulfill({ json: { today: '2026-11-26', courses: [buildAsNeededCourse(pid)] } }),
  );
  await page.route(`**/api/health-profiles/${pid}/reminders`, (route) => route.fulfill({ json: [] }));
  await page.route(`**/api/health-profiles/${pid}/as-needed-doses*`, (route) =>
    route.fulfill({ json: { doses: AS_NEEDED_DOSES } }),
  );
  return state;
}

for (const width of [360, 1440]) {
  test(`SPEC-081 — số đo và xét nghiệm ${width}px không tràn, không màu đánh giá, đạt A11y`, async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const state = await setupHealthFixture(page);
    await page.setViewportSize({ width, height: 900 });
    for (const theme of ['light', 'dark']) {
      await page.addInitScript((t) => localStorage.setItem('angia-theme', t), theme);
      await page.goto(`/profiles/${state.profile.id}?section=health`);
      await expect(page.getByRole('heading', { name: 'Bảng số đo chi tiết' })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.goto(`/profiles/${state.profile.id}/lab-results`);
      await expect(page.getByRole('heading', { name: 'HbA1c' })).toBeVisible();
      const flag = page.getByText('↑ Trên khoảng in trên phiếu');
      await expect(flag).toBeVisible();
      await expect(flag).not.toHaveClass(/warning|danger/);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (theme === 'light') {
        const axe = await new AxeBuilder({ page }).include('main').exclude('.account-menu-trigger').analyze();
        expect(axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
      }
    }
  });

  test(`SPEC-081 — nhiệt độ và liều Khi cần ${width}px không tràn và đạt A11y`, async ({ page }) => {
    test.setTimeout(90_000);
    const state = await setupHealthFixture(page);
    await page.setViewportSize({ width, height: 900 });
    for (const theme of ['light', 'dark']) {
      await page.addInitScript((t) => localStorage.setItem('angia-theme', t), theme);
      await page.goto(`/profiles/${state.profile.id}/timeline`);
      await expect(page.getByRole('heading', { name: 'Nhiệt độ' })).toBeVisible();
      await expect(page.getByText('38,5 °C').first()).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.getByRole('button', { name: /Ghi nhiệt độ/ }).click();
      await expect(page.getByLabel('Nhiệt độ (°C)')).toBeVisible();
      await page.getByRole('button', { name: 'Hủy bỏ', exact: true }).click();
      await page.goto(`/profiles/${state.profile.id}/medications`);
      await expect(page.getByText('Paracetamol')).toBeVisible();
      await page.getByRole('button', { name: 'Xem nhật ký', exact: true }).click();
      await expect(page.getByText('1 gói', { exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (theme === 'light') {
        const axe = await new AxeBuilder({ page }).include('main').exclude('.account-menu-trigger').analyze();
        expect(axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
      }
    }
  });
}
