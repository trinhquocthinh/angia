import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { chain, detail, profile, session, secondId } from '../test/fixtures.test-helper';
import { PrescriptionDetailContent } from './PrescriptionDetailContent';
import { DocumentsHeading } from '@src/features/documents/presentation/entries/DocumentsHeading';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
}));
describe('TC-483/485 — chuỗi thay đổi và lối vào theo đồng thuận', () => {
  it('không dựng so sánh nếu đơn trước chưa có trong lần đọc chuỗi', () => {
    const client = new QueryClient();
    // SSR không chạy effect tải dữ liệu; giữ fixture fresh để kiểm nhánh đã tải xong.
    client.setQueryData(['prescriptions', 'a', 'f', profile.id, 'detail', secondId], detail, {
      updatedAt: Date.now() + 60_000,
    });
    const render = (entries: typeof chain) =>
      renderToStaticMarkup(
        <QueryClientProvider client={client}>
          <PrescriptionDetailContent
            profile={profile}
            session={session}
            prescriptionId={secondId}
            chain={entries}
            refreshChain={() => undefined}
          />
        </QueryClientProvider>,
      );
    const missing = render([]);
    expect(missing).toContain('role="alert"');
    expect(missing).not.toContain('Thay đổi so với đơn trước');
    expect(render(chain)).toContain('Trước: 01/10/2026');
    client.clear();
  });
  it('chỉ mở lối vào chuỗi đơn cho hồ sơ đã đồng thuận', () => {
    expect(renderToStaticMarkup(<DocumentsHeading profile={profile} />)).toContain('Chuỗi đơn thuốc');
    expect(
      renderToStaticMarkup(<DocumentsHeading profile={{ ...profile, consentStatus: 'withdrawn' }} />),
    ).not.toContain('Chuỗi đơn thuốc');
  });
});
