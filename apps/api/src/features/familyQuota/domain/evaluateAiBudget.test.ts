import { describe, expect, it } from 'vitest';
import { evaluateAiBudget } from './evaluateAiBudget.js';
const snapshot = {
  grantedScans: 20,
  usedScans: 7,
  heldScans: 0,
  billingAvailable: true,
  budgetExhausted: false,
};
describe('Cổng lượt gia đình và tiền thực toàn hệ thống', () => {
  it('TC-610: phần trăm và anyUsed chỉ dựa trên lượt đã dùng', () => {
    expect(evaluateAiBudget(snapshot)).toEqual({ usedPercent: 35, anyUsed: true, exhausted: false });
    expect(evaluateAiBudget({ ...snapshot, usedScans: 0, heldScans: 2 })).toMatchObject({
      usedPercent: 0,
      anyUsed: false,
    });
  });
  it('TC-611: giữ chỗ dùng hết lượt và gia đình chưa cấp đều chặn', () => {
    expect(evaluateAiBudget({ ...snapshot, heldScans: 13 })).toMatchObject({
      exhausted: true,
      reason: 'scan_quota_exhausted',
    });
    expect(evaluateAiBudget({ ...snapshot, grantedScans: 0, usedScans: 0 })).toMatchObject({
      exhausted: true,
      usedPercent: 0,
    });
  });
  it('TC-612: phí thiếu hoặc hết ngân sách có nguyên nhân riêng, không lộ số tiền', () => {
    expect(evaluateAiBudget({ ...snapshot, billingAvailable: false })).toEqual({
      usedPercent: 35,
      anyUsed: true,
      exhausted: true,
      reason: 'billing_unavailable',
    });
    expect(evaluateAiBudget({ ...snapshot, budgetExhausted: true })).toEqual({
      usedPercent: 35,
      anyUsed: true,
      exhausted: true,
      reason: 'budget_exhausted',
    });
  });
  it('TC-613: phần trăm dưới một phần trăm giữ anyUsed và không vượt 100', () => {
    expect(evaluateAiBudget({ ...snapshot, grantedScans: 1000, usedScans: 1 })).toMatchObject({
      usedPercent: 0,
      anyUsed: true,
    });
    expect(evaluateAiBudget({ ...snapshot, usedScans: 21 })).toMatchObject({ usedPercent: 100 });
  });
});
