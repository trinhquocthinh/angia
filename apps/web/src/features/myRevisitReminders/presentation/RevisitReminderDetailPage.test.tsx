import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';
import { RevisitReminderDetailPage } from './RevisitReminderDetailPage';
vi.mock('@src/features/profiles/presentation/components/ProfileFrame', () => ({
  ProfileFrame: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, params }: { children: ReactNode; params: { profileId: string } }) => (
    <a href={`/profiles/${params.profileId}/summary`}>{children}</a>
  ),
}));
const session = { account: { id: 'a' }, family: { id: 'f' }, role: 'member' };
const key = ['my-revisit-reminder', 'a', 'f', 'id'];
const reminder = {
  id: 'id',
  profileId: 'p',
  profileName: 'Mẹ',
  revisitDate: '2026-11-20',
  offset: 'two_days_before',
  prescriptions: [{ id: 'rx', issuedDate: '2026-10-01', facility: 'Bệnh viện A' }],
  canOpenSummary: false,
};
function render(seed: (client: QueryClient) => void) {
  const client = new QueryClient({ defaultOptions: { queries: { refetchOnMount: false } } });
  client.setQueryData(['current-session'], session);
  seed(client);
  const html = renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <RevisitReminderDetailPage reminderId="id" />
    </QueryClientProvider>,
  );
  client.clear();
  return html;
}
describe('TC-479 — trang thông báo tái khám', () => {
  it.each([false, true])('quyền mở tóm tắt %s', (canOpenSummary) => {
    const html = render((client) => client.setQueryData(key, { ...reminder, canOpenSummary }));
    for (const text of ['Mẹ', '20/11/2026', '01/10/2026', 'Bệnh viện A']) expect(html).toContain(text);
    expect(html.includes('Tóm tắt đi khám')).toBe(canOpenSummary);
    if (canOpenSummary) expect(html).toContain('href="/profiles/p/summary"');
  });
  it.each([403, 404, 500])('HTTP %s che dữ liệu đã cache và có trạng thái phù hợp', (status) => {
    const html = render((client) => {
      client.setQueryData(key, reminder);
      client.setQueryDefaults(['my-revisit-reminder'], { retryOnMount: false });
      client
        .getQueryCache()
        .find({ queryKey: key })!
        .setState({ status: 'error', error: new MedicationRequestError('Chi tiết nội bộ', status) });
    });
    expect(html).not.toContain('Mẹ');
    expect(html).not.toContain('Chi tiết nội bộ');
    expect(html).toContain(status < 500 ? 'Không tìm thấy lời nhắc hoặc bạn không có quyền xem.' : 'Thử lại');
  });
});
