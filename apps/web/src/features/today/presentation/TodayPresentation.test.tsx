import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { reminder, session } from '../application/todayTestFixture.test-helper';
import { DoseSlotCard } from './DoseSlotCard';
import { ProfileSwitcher } from './ProfileSwitcher';
import { TodayNotice } from './TodayNotice';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

describe('Trình bày liều hôm nay (SPEC-079)', () => {
  it('TC-854: hiện buổi, thuốc và nút xác nhận bằng primitive cỡ lớn', () => {
    const client = new QueryClient();
    const html = renderToStaticMarkup(
      <QueryClientProvider client={client}>
        <DoseSlotCard reminder={reminder} session={session} />
      </QueryClientProvider>,
    );
    expect(html).toContain('Sáng');
    expect(html).toContain('Thuốc trong lời nhắc');
    expect(html).toContain('Đã dùng');
    expect(html).toContain('min-h-14');
    expect(html).toContain('text-xl');
    client.clear();
  });
  it('TC-853: đã xác nhận hiện tên và giờ máy chủ, có hủy theo quyền', () => {
    const client = new QueryClient();
    const html = renderToStaticMarkup(
      <QueryClientProvider client={client}>
        <DoseSlotCard
          session={session}
          reminder={{
            ...reminder,
            canConfirm: false,
            canUndo: true,
            confirmation: {
              reminderId: reminder.id,
              profileId: 'p',
              date: reminder.date,
              slot: reminder.slot,
              confirmedBy: { accountId: 'a', displayName: 'Mẹ' },
              confirmedAt: '2026-11-11T00:32:00Z',
            },
          }}
        />
      </QueryClientProvider>,
    );
    expect(html).toContain('Mẹ · 07:32');
    expect(html).toContain('Hủy xác nhận');
    client.clear();
  });
  it('TC-854: bộ chọn có nhãn, trạng thái chọn và vùng chạm lớn', () => {
    const html = renderToStaticMarkup(
      <ProfileSwitcher
        profiles={[{ id: 'p', displayName: 'Mẹ' }]}
        selectedId="p"
        onSelect={() => undefined}
      />,
    );
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('min-h-12');
    expect(html).toContain('Chọn hồ sơ');
  });
  it('TC-855: rút đồng thuận chỉ hiện hướng dẫn và lối xử lý', () => {
    const html = renderToStaticMarkup(<TodayNotice kind="withdrawn" main />);
    expect(html).toContain('đã rút đồng thuận');
    expect(html).toContain('lời mời đồng thuận');
    expect(html).toContain('Hồ sơ gia đình');
    expect(html).not.toContain('Đã dùng');
  });
  it('TC-852: trạng thái rỗng có bước tiếp theo', () => {
    const html = renderToStaticMarkup(<TodayNotice kind="empty" main={false} />);
    expect(html).toContain('Hôm nay không có liều nào');
    expect(html).toContain('Xem thuốc đang dùng');
  });
});
