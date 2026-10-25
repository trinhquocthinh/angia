import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MyReminder } from '@angia/contracts';
import { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';
import { ReminderDetailPage } from './ReminderDetailPage';

vi.mock('@src/features/profiles/presentation/components/ProfileFrame', () => ({
  ProfileFrame: ({ children }: { children: ReactNode }) => <div data-frame="">{children}</div>,
}));

const id = '3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b';
const session = {
  account: { id: 'account', displayName: 'Bình', isSystemAdmin: false, healthProfileId: null },
  family: { id: 'family', name: 'Nhà An' },
  role: 'member',
  csrfToken: 'csrf',
};
const reminder: MyReminder = {
  id,
  date: '2026-10-23',
  slot: 'morning',
  scheduledAt: '2026-10-23T00:00:00.000Z',
  profileName: 'Mẹ',
  medications: [
    { name: 'Amlodipin', strength: '5 mg', quantityPerDose: '1', doseUnit: 'viên' },
    { name: 'Metformin', strength: null, quantityPerDose: '2', doseUnit: 'viên' },
    { name: 'Kem bôi', strength: '10 g', quantityPerDose: null, doseUnit: null },
  ],
};
const clients: QueryClient[] = [];
afterEach(() => {
  clients.forEach((client) => client.clear());
  clients.length = 0;
});
function render(seed: (client: QueryClient) => void) {
  const client = new QueryClient();
  clients.push(client);
  client.setQueryData(['current-session'], session);
  seed(client);
  return renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <ReminderDetailPage reminderId={id} />
    </QueryClientProvider>,
  );
}
// Render tĩnh không chạy fetch; tắt retryOnMount để trạng thái lỗi đã nạp hiển thị như sau khi tải.
function seedError(client: QueryClient, error: Error) {
  client.setQueryDefaults(['my-reminder'], { retryOnMount: false });
  const query = client.getQueryCache().build(client, { queryKey: ['my-reminder', id] });
  query.setState({ status: 'error', error, fetchStatus: 'idle', errorUpdatedAt: Date.now() });
}

describe('Trang lời nhắc dùng thuốc của người nhận (SPEC-035)', () => {
  it('hiển thị hồ sơ, buổi, ngày, giờ Việt Nam và từng thuốc; không có nút thao tác', () => {
    const html = render((client) => client.setQueryData(['my-reminder', id], reminder));
    expect(html).toContain('Lời nhắc dùng thuốc');
    expect(html).toContain('Mẹ');
    expect(html).toContain('Sáng');
    expect(html).toContain('23/10/2026');
    expect(html).toContain('07:00');
    expect(html).toContain('Amlodipin · 5 mg · 1 viên');
    expect(html).toContain('Metformin · 2 viên');
    expect(html).toContain('Kem bôi · 10 g');
    expect(html.match(/<li/g)).toHaveLength(3);
    expect(html).not.toContain('<button');
    expect(html).not.toContain('null');
  });
  it.each([404, 403])('HTTP %s: thông điệp chung, không lộ lý do', (status) => {
    const html = render((client) => seedError(client, new MedicationRequestError('Chi tiết', status)));
    expect(html).toContain('Không tìm thấy lời nhắc hoặc bạn không có quyền xem.');
    expect(html).not.toContain('Chi tiết');
  });
});
