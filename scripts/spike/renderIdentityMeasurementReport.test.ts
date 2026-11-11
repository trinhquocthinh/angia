import { expect, it } from 'vitest';
import { renderIdentityMeasurementReport } from './renderIdentityMeasurementReport.js';
import { summarizeIdentityMeasurements } from './summarizeIdentityMeasurements.js';

it('TC-873 bảng đo thiếu vòng không được ghi nhận A23 đạt', () => {
  const summary = summarizeIdentityMeasurements([], 'idp_budget_exhausted');
  const report = renderIdentityMeasurementReport([], summary, 'mac-tailscale');
  expect(report).toContain('budget_exhausted');
  expect(report).toContain('0/50');
  expect(report).toContain('mac-tailscale');
  expect(report).toContain('Chờ owner duyệt');
});
