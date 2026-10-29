import type { FamilyScanQuota, FamilyUsage } from '@angia/contracts';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FamilyUsageCard } from './FamilyUsageCard';

const usage: FamilyUsage = {
  storage: { usedBytes: 1288490188, limitBytes: 2 * 1024 ** 3 },
  dailyUploads: { used: 37, limit: 100, resetsAt: '2026-10-20T00:00:00+07:00' },
  pendingJobs: { used: 2, limit: 10 },
  aiOcr: { month: '2026-10', usedPercent: 0, anyUsed: false, exhausted: false },
};

describe('TC-302 — thẻ "Mức sử dụng của gia đình" (SPEC-030)', () => {
  it('hiện các thanh tiến độ với số đã dùng / trần (3 tài nguyên + đọc chữ tự động)', () => {
    const html = renderToStaticMarkup(<FamilyUsageCard usage={usage} />);
    expect(html).toContain('Mức sử dụng của gia đình');
    expect(html).toContain('1,2 / 2,0 GiB');
    expect(html).toContain('37 / 100 ảnh hôm nay');
    expect(html).toContain('2 / 10 ảnh đang xử lý');
    expect(html.match(/role="progressbar"/g)).toHaveLength(4);
    expect(html).toContain('aria-valuenow="37"');
    expect(html).not.toContain('role="status"');
  });

  it('chạm trần thì nêu lý do trong vùng trạng thái', () => {
    const full = { ...usage, pendingJobs: { used: 10, limit: 10 } };
    const html = renderToStaticMarkup(<FamilyUsageCard usage={full} />);
    expect(html).toContain('role="status"');
    expect(html).toContain('Hàng chờ tự động nhận diện của gia đình đã đủ 10 ảnh.');
  });

  it('TC-309: thêm thanh phần trăm đọc chữ tự động tháng này, không hiện số tiền', () => {
    const html = renderToStaticMarkup(
      <FamilyUsageCard
        usage={{ ...usage, aiOcr: { month: '2026-10', usedPercent: 42, anyUsed: true, exhausted: false } }}
      />,
    );
    expect(html).toContain('Đọc chữ tự động tháng này: đã dùng 42%');
    expect(html).toContain('aria-valuenow="42"');
    expect(html).not.toContain('$');
    expect(html).not.toContain('USD');
  });

  it('đọc chữ tự động đã dùng > 0 nhưng chưa tới 1% thì hiện "dưới 1%"', () => {
    const html = renderToStaticMarkup(
      <FamilyUsageCard
        usage={{ ...usage, aiOcr: { month: '2026-10', usedPercent: 0, anyUsed: true, exhausted: false } }}
      />,
    );
    expect(html).toContain('Đọc chữ tự động tháng này: đã dùng dưới 1%');
  });

  const quota: FamilyScanQuota = {
    month: '2026-10',
    status: 'approved',
    grantedScans: 20,
    usedScans: 3,
    heldScans: 1,
    remainingScans: 16,
    runtimeActive: true,
  };

  it('có hạn mức lượt thì hiện số lượt đã dùng (gồm đang giữ) / lượt được cấp thay cho phần trăm', () => {
    const html = renderToStaticMarkup(<FamilyUsageCard usage={usage} scanQuota={quota} />);
    expect(html).toContain('Đọc chữ tự động tháng này: 4 / 20 lượt');
    expect(html).toContain('aria-valuenow="4"');
    expect(html).toContain('aria-valuemax="20"');
    expect(html).not.toContain('%</span>');
  });

  it('chưa dùng lượt nào thì hiện 0 / 20 lượt', () => {
    const fresh = { ...quota, usedScans: 0, heldScans: 0, remainingScans: 20 };
    const html = renderToStaticMarkup(<FamilyUsageCard usage={usage} scanQuota={fresh} />);
    expect(html).toContain('Đọc chữ tự động tháng này: 0 / 20 lượt');
  });

  it('gia đình chưa được cấp lượt tháng này thì nêu rõ, thanh đầy', () => {
    const none = { ...quota, status: 'unconfigured' as const, grantedScans: 0, usedScans: 0, heldScans: 0 };
    const html = renderToStaticMarkup(<FamilyUsageCard usage={usage} scanQuota={none} />);
    expect(html).toContain('Đọc chữ tự động tháng này: chưa được cấp lượt');
    expect(html).toContain('width:100%');
  });
});
