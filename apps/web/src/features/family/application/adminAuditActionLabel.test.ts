import { adminAuditActions } from '@angia/contracts';
import { expect, it } from 'vitest';
import { adminAuditActionLabel, adminAuditActionLabels } from './adminAuditActionLabel';
it('TC-841: đủ nhãn cho toàn bộ loại sự kiện từ contracts', () => {
  expect(Object.keys(adminAuditActionLabels)).toEqual([...adminAuditActions]);
  for (const action of adminAuditActions) expect(adminAuditActionLabel(action)).not.toBe(action);
  expect(adminAuditActionLabel('account_locked')).toBe('Khoá tài khoản');
  expect(adminAuditActionLabel('family_deletion_executed')).toBe('Đã xoá nhà');
});
it('TC-841: giữ nguyên mã lạ, kể cả tên thuộc prototype', () => {
  expect(adminAuditActionLabel('future_action')).toBe('future_action');
  expect(adminAuditActionLabel('toString')).toBe('toString');
});
