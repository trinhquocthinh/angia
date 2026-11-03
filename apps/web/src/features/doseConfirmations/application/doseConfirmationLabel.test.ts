import { describe, expect, it } from 'vitest';
import { doseConfirmationLabel } from './doseConfirmationLabel';

const confirmation = {
  reminderId: '3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b',
  profileId: '3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6c',
  date: '2026-11-02',
  slot: 'morning' as const,
  confirmedBy: { accountId: null, displayName: 'Mẹ Hoa' },
  confirmedAt: '2026-11-02T00:35:00.000Z',
};

describe('Nhãn xác nhận "Đã dùng" (Design §9.6)', () => {
  it('TC-486: hiện người xác nhận và giờ Việt Nam, kể cả khi tài khoản đã xóa', () => {
    expect(doseConfirmationLabel(confirmation)).toBe('Đã dùng · Mẹ Hoa · 07:35');
  });
});
