import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { RevisitList } from './RevisitList';
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
}));
describe('TC-473 — danh sách lịch tái khám', () => {
  it('giữ nhóm cùng ngày của API, có lối sửa từng đơn', () => {
    const data = [
      {
        revisitDate: '2026-11-20',
        prescriptions: [
          { id: 'a', issuedDate: '2026-10-01', facility: 'Bệnh viện A' },
          { id: 'b', issuedDate: '2026-10-02', facility: null },
        ],
      },
    ];
    const html = renderToStaticMarkup(<RevisitList data={data} onEdit={() => undefined} />);
    expect(html.match(/20\/11\/2026/g)).toHaveLength(1);
    expect(html.match(/Sửa ngày hẹn/g)).toHaveLength(2);
    expect(html).toContain('01/10/2026');
    expect(html).toContain('02/10/2026');
    expect(html).not.toContain('null');
  });
  it('không có lịch hẹn thì giải thích rõ', () => {
    expect(renderToStaticMarkup(<RevisitList data={[]} onEdit={() => undefined} />)).toContain(
      'Chưa có lịch tái khám từ hôm nay.',
    );
  });
});
