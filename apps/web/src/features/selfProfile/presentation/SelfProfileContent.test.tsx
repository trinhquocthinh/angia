import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { SelfProfile } from '@angia/contracts';
import { vietnamDate } from '@src/features/visitSummary/application/vietnamDate';
import { selfProfileKey } from '../application/selfProfileKey';
import { SelfProfileContent } from './SelfProfileContent';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

const linked = {
  account: { id: 'account', displayName: 'Mẹ', isSystemAdmin: false, healthProfileId: 'p1' },
  family: { id: 'family', name: 'Nhà An' },
  role: 'member',
  csrfToken: 'csrf',
  features: { redactionSuggestions: false },
} as const;
const summary: SelfProfile = {
  id: 'p1',
  displayName: 'Mẹ Hoa',
  birthYear: 1950,
  consentStatus: 'confirmed',
  showsVitals: true,
};
const course = {
  id: 'c1',
  name: 'Amlodipin',
  strength: '5mg',
  quantityPerDose: 1,
  doseUnit: 'viên',
  slots: ['morning'],
  startDate: '2026-10-01',
  endDate: null,
  source: 'prescription',
  prescriptionIssuedDate: '2026-10-01',
};
function render(session: typeof linked | typeof unlinked, seed: Partial<SelfProfile> | null = {}) {
  const client = new QueryClient();
  const key = selfProfileKey(session);
  const today = vietnamDate();
  if (seed) client.setQueryData([...key, 'summary'], { ...summary, ...seed });
  if (seed && seed.consentStatus !== 'withdrawn') {
    client.setQueryData([...key, 'medications', today], { today, courses: [course] });
    client.setQueryData(
      [...key, 'reminders', today],
      [
        {
          id: 'r1',
          date: today,
          slot: 'morning',
          scheduledAt: `${today}T00:00:00.000Z`,
          medications: [{ name: 'Amlodipin', strength: '5mg', quantityPerDose: '1', doseUnit: 'viên' }],
          confirmation: null,
          canConfirm: true,
          canUndo: false,
        },
      ],
    );
    client.setQueryData(
      [...key, 'revisits', today],
      [
        {
          revisitDate: '2026-11-20',
          prescriptions: [{ id: 'd1', issuedDate: '2026-10-01', facility: 'Bệnh viện A' }],
        },
      ],
    );
  }
  const html = renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <SelfProfileContent session={session} section={undefined} />
    </QueryClientProvider>,
  );
  const sections = client
    .getQueryCache()
    .findAll({ queryKey: key })
    .filter((query) => query.queryKey[query.queryKey.length - 1] !== 'summary');
  return { html, sections };
}
const unlinked = { ...linked, account: { ...linked.account, healthProfileId: null } };

describe('SPEC-042, Design §9.5 — trang "Hồ sơ của tôi"', () => {
  it('trang đầu có tên hồ sơ, thuốc theo buổi, lời nhắc và lịch hẹn sắp tới', () => {
    const { html } = render(linked);
    for (const text of [
      'Hồ sơ của tôi',
      'Mẹ Hoa',
      'Thuốc hôm nay',
      'Amlodipin',
      'Lời nhắc hôm nay',
      'Lịch hẹn sắp tới',
      '20/11/2026',
      'Bệnh viện A',
    ])
      expect(html).toContain(text);
  });
  it('TC-486: tài khoản liên kết xác nhận được buổi của lời nhắc', () => {
    expect(render(linked).html).toContain('>Đã dùng</button>');
  });
  it('BR-005: chỉ đọc, không có hành động ghi và không có lối sang chứng từ hay route hồ sơ gia đình', () => {
    const { html } = render(linked);
    for (const text of ['Sửa ngày hẹn', 'Nhập tay', 'Tải ảnh', '/profiles/', '/upload', 'Tóm tắt đi khám'])
      expect(html).not.toContain(text);
  });
  it('chưa liên kết: chỉ có thông báo, không dựng hồ sơ rỗng và không gọi route dữ liệu', () => {
    const { html, sections } = render(unlinked, null);
    expect(html).toContain('Tài khoản chưa liên kết hồ sơ sức khỏe.');
    expect(html).not.toContain('Thuốc hôm nay');
    expect(sections).toHaveLength(0);
  });
  it('BR-047: chưa hoặc đã rút đồng thuận thì không dựng nội dung sức khỏe và không gọi route dữ liệu', () => {
    const { html, sections } = render(linked, { consentStatus: 'withdrawn' });
    expect(html).toContain('Hồ sơ chưa được đồng ý lưu dữ liệu.');
    expect(html).not.toContain('Thuốc hôm nay');
    expect(sections).toHaveLength(0);
  });
  it('US-042: không dựng dữ liệu khi hồ sơ tóm tắt khác liên kết trong phiên', () => {
    const { html } = render(linked, { id: 'old-profile' });
    expect(html).toContain('Tài khoản chưa liên kết hồ sơ sức khỏe.');
    expect(html).not.toContain('Đau nhức');
    expect(html).not.toContain('Mẹ Hoa');
  });
  it('BR-049: không hiện số đo thì không có mục Diễn biến sức khỏe', () => {
    expect(render(linked).html).toContain('Đau nhức');
    expect(render(linked, { showsVitals: false }).html).toContain('Đau nhức');
    expect(render(linked).html).toContain('Diễn biến sức khỏe');
    expect(render(linked, { showsVitals: false }).html).not.toContain('Diễn biến sức khỏe');
  });
});
