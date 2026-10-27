import { expect, it } from 'vitest';
import { reconcileCounter } from './reconcileCounter.js';
it('TC-542: so sánh chính xác số thập phân, không biến lịch sử thiếu thành phí 0', () => {
  expect(reconcileCounter(null, '0', '0')).toBe('complete');
  expect(reconcileCounter(null, '0.3', '0.2')).toBe('gap');
  expect(reconcileCounter('0.3', '0.2', '0.2')).toBe('counter_reset');
  expect(reconcileCounter('0.300000000001', '0.300000000002', '0.300000000002')).toBe('complete');
});
