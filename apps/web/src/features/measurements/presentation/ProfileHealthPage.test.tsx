import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { HealthProfile } from '@src/features/profiles/application/ports';
import { ProfileHealthPage } from './ProfileHealthPage';

vi.mock('@src/features/profiles/presentation/components/ProfileFrame', () => ({
  ProfileFrame: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock('./components/ProfileHealthHeader', () => ({ ProfileHealthHeader: () => <div /> }));
vi.mock('./components/HealthTrendToolbar', () => ({ HealthTrendToolbar: () => <div /> }));
vi.mock('@src/features/medications/presentation/StopCourseAction', () => ({ StopCourseAction: () => null }));
vi.mock('@src/features/medications/presentation/SelfReportedCourseAction', () => ({
  SelfReportedCourseAction: () => null,
}));

const { list, series } = vi.hoisted(() => ({ list: vi.fn(), series: vi.fn() }));
vi.mock('../infrastructure/createMeasurementsRepository', () => ({
  createMeasurementsRepository: () => ({ list, series }),
}));

const session = {
  account: { id: 'account', displayName: 'Bình', isSystemAdmin: false, healthProfileId: null },
  family: { id: 'family', name: 'Nhà An' },
  role: 'main',
  csrfToken: 'csrf',
};
const profileOf = (consentStatus: HealthProfile['consentStatus']): HealthProfile => ({
  id: 'p1',
  familyId: 'family',
  displayName: 'Mẹ',
  birthYear: null,
  consentConfirmedAt: null,
  consentConfirmedBy: null,
  consentBasis: null,
  consentStatus,
  consentSource: null,
  consentRespondentName: null,
  createdAt: '2026-10-01T00:00:00Z',
});
function render(consentStatus: HealthProfile['consentStatus']) {
  const client = new QueryClient();
  client.setQueryData(['current-session'], session);
  client.setQueryData(['profiles', 'account', 'family', 'list'], [profileOf(consentStatus)]);
  const html = renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <ProfileHealthPage profileId="p1" />
    </QueryClientProvider>,
  );
  const queries = client.getQueryCache().findAll({ queryKey: ['measurements'] });
  client.clear();
  return { html, queries };
}

describe('TC-388 — trang Diễn biến sức khỏe với hồ sơ chưa đồng thuận', () => {
  it.each(['withdrawn', 'pending'] as const)(
    '%s: hiện thông báo chung, không tải biểu đồ/số đo và không báo lỗi tải',
    (status) => {
      const { html } = render(status);
      expect(html).toContain('Hồ sơ chưa được đồng ý lưu dữ liệu.');
      expect(html).not.toContain('Không tải được');
      expect(html).not.toContain('Bảng số đo chi tiết');
      expect(list).not.toHaveBeenCalled();
      expect(series).not.toHaveBeenCalled();
    },
  );
  it('confirmed: hiện biểu đồ và bảng số đo, không có thông báo chưa đồng thuận', () => {
    const { html } = render('confirmed');
    expect(html).not.toContain('Hồ sơ chưa được đồng ý lưu dữ liệu.');
    expect(html).toContain('Bảng số đo chi tiết');
    expect(html).toContain('Diễn biến huyết áp');
  });
});
