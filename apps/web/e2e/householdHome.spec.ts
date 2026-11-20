import { householdHomeRegressionCases } from './householdHomeRegressionCases.js';
import { householdHomeErrorCases } from './householdHomeErrorCases.js';
import { test } from '@playwright/test';
import { householdHomeDeletionCases } from './householdHomeDeletionCases.js';
import { householdHomeLeaveCases } from './householdHomeLeaveCases.js';
import { householdHomeOwnershipCases } from './householdHomeOwnershipCases.js';

const allCases = [
  householdHomeErrorCases,
  householdHomeRegressionCases,
  ...householdHomeOwnershipCases,
  ...householdHomeLeaveCases,
  ...householdHomeDeletionCases,
];

for (const theme of ['light', 'dark'])
  test.describe(`Nhà của tôi — ${theme}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('angia-theme', value), theme);
    });
    allCases.forEach((register) => register());
  });
