import { describe, expect, it } from 'vitest';
import type { AiBillingView } from '@angia/contracts';
import { describeAiBilling } from './describeAiBilling';

const now = new Date('2026-10-26T03:00:00Z');
const view = (): AiBillingView => ({
  month: '2026-10',
  unit: 'USD',
  status: 'ready',
  confirmedSpendUsd: '0.013086000000',
  actualSpendUsd: '0.013086000000',
  lastSyncedAt: now.toISOString(),
  sources: [],
});
describe('Phí thực trong Admin', () => {
  it('TC-548: hiển thị số tiền nhỏ chính xác, không làm tròn thành miễn phí', () => {
    expect(describeAiBilling(view(), now)).toMatchObject({
      confirmedAmount: '0,013086 USD',
      actualAmount: '0,013086 USD',
      label: 'Đã đối chiếu',
      stale: false,
    });
  });
  it('TC-548: incomplete giữ số tiền đã ghi nhận, không gọi nó là tổng phí tháng', () => {
    expect(describeAiBilling({ ...view(), status: 'incomplete', actualSpendUsd: null }, now)).toMatchObject({
      confirmedAmount: '0,013086 USD',
      actualAmount: null,
      label: 'Chưa đủ dữ liệu',
    });
  });
  it('TC-548: cache từng ready nhưng cũ hơn180giây không còn hiển thị như đã xác nhận hiện tại', () => {
    expect(describeAiBilling(view(), new Date(now.getTime() + 180001))).toMatchObject({
      actualAmount: null,
      label: 'Dữ liệu đã cũ',
      stale: true,
    });
  });
  it('TC-548: không cấu hình nguồn phí không biến số0đã thấy thành tổng tháng0', () => {
    expect(
      describeAiBilling(
        {
          ...view(),
          status: 'unconfigured',
          actualSpendUsd: null,
          confirmedSpendUsd: '0.000000000000',
          lastSyncedAt: null,
        },
        now,
      ),
    ).toMatchObject({ actualAmount: null, confirmedAmount: '0,00 USD', label: 'Chưa cấu hình nguồn phí' });
  });
  it('TC-548: số tiền lớn được nhóm chữ số mà không qua số thực Number', () => {
    expect(
      describeAiBilling({ ...view(), confirmedSpendUsd: '123456789012345678.123456789012' }, now)
        .confirmedAmount,
    ).toBe('123.456.789.012.345.678,123456789012 USD');
  });
});
