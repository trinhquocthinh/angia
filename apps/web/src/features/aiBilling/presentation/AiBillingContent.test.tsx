import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { AiBillingView } from '@angia/contracts';
import { AiBillingContent } from './AiBillingContent';

const now = new Date('2026-10-26T03:00:00Z');
const incomplete: AiBillingView = {
  month: '2026-10',
  unit: 'USD',
  status: 'incomplete',
  confirmedSpendUsd: '0.013086000000',
  actualSpendUsd: null,
  lastSyncedAt: null,
  sources: [
    {
      id: '00000000-0000-4000-8000-000000000001',
      provider: 'woku',
      status: 'gap',
      confirmedSpendUsd: '0.013086000000',
      lastAttemptAt: now.toISOString(),
      lastCompleteAt: null,
    },
  ],
};
describe('Thẻ phí thực từ nhà cung cấp', () => {
  it('TC-548: hiện mã nguồn ổn định để đối chiếu khi có nhiều key cùng provider', () => {
    const html = renderToStaticMarkup(<AiBillingContent view={incomplete} now={now} />);
    expect(html).toContain(incomplete.sources[0]!.id);
  });
  it('TC-548: thiếu log chỉ hiện tiền đã ghi nhận, không hiển thị tổng tháng như đã xác nhận', () => {
    const html = renderToStaticMarkup(<AiBillingContent view={incomplete} now={now} />);
    expect(html).toContain('Chưa xác nhận tổng tháng');
    expect(html).toContain('0,013086 USD');
    expect(html).toContain('Chưa đủ dữ liệu');
    expect(html).toContain('Thiếu bản ghi phí');
    expect(html).not.toContain('Đã đối chiếu');
  });
  it('TC-548: nguồn lỗi có nhãn cố định và không có ô API key/đồng bộ trực tiếp', () => {
    const html = renderToStaticMarkup(
      <AiBillingContent
        view={{ ...incomplete, sources: [{ ...incomplete.sources[0]!, status: 'credential_changed' }] }}
        now={now}
      />,
    );
    expect(html).toContain('Khóa nguồn đã thay đổi');
    expect(html).not.toContain('type="password"');
    expect(html).not.toContain('name="apiKey"');
  });
  it('TC-548: thông báo rõ số liệu chưa nối vào cổng chặn OCR của các bước sau', () => {
    const html = renderToStaticMarkup(<AiBillingContent view={incomplete} now={now} />);
    expect(html).toContain('Chưa dùng số liệu này để chặn nhận diện');
  });
});
