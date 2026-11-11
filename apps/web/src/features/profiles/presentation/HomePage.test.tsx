import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { MyConsentProfile } from '../application/myConsentPorts';
import type { ProfileListItem, ProfileSession } from '../application/ports';
import { profileScopeKey } from '../application/profileScopeKey';
import { HomePage } from './HomePage';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
  useNavigate: () => vi.fn(),
}));
vi.mock('./components/ProfileFrame', () => ({
  ProfileFrame: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));

const session: ProfileSession = {
  account: { id: 'account', displayName: 'Người kiểm thử', isSystemAdmin: false, healthProfileId: 'own' },
  family: { id: 'family', name: 'Nhà kiểm thử' },
  role: 'main',
  csrfToken: 'csrf',
  features: { redactionSuggestions: false },
};
const base: ProfileListItem = {
  id: 'own',
  familyId: 'family',
  displayName: 'Hồ sơ của tôi',
  birthYear: 1980,
  vitalsEnabled: null,
  consentStatus: 'confirmed',
  consentConfirmedAt: '2026-11-04T00:00:00Z',
  consentConfirmedBy: 'account',
  consentBasis: 'self',
  consentSource: 'self',
  consentRespondentName: null,
  createdAt: '2026-11-04T00:00:00Z',
  consentAction: null,
  hasLinkedAccount: true,
  consentConfirmedByName: 'Người kiểm thử',
};

function render(role: 'main' | 'member', consentStatus: 'confirmed' | 'withdrawn', linked = true) {
  const current = {
    ...session,
    role,
    account: { ...session.account, healthProfileId: linked ? 'own' : null },
  };
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  const scope = profileScopeKey(current);
  const own: MyConsentProfile = {
    id: base.id,
    displayName: base.displayName,
    consentStatus,
    withdrawnAt: consentStatus === 'withdrawn' ? '2026-11-04T03:00:00Z' : null,
  };
  client.setQueryData(['current-session'], current);
  client.setQueryData([...scope, 'my-consent'], { profile: own });
  client.setQueryData(
    [...scope, 'list'],
    [
      { ...base, consentStatus },
      { ...base, id: 'other', displayName: 'Hồ sơ khác', hasLinkedAccount: false },
    ],
  );
  client.setQueryData(['review', 'account', 'family', 'queue'], {
    pages: [{ items: [], nextCursor: null }],
    pageParams: [null],
  });
  const html = renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <HomePage />
    </QueryClientProvider>,
  );
  client.clear();
  return html;
}

describe('TC-560 — tự gỡ liên kết từ trang chủ', () => {
  it.each(['confirmed', 'withdrawn'] as const)(
    'TC-560: main %s có nút tự gỡ và vẫn thấy danh sách gia đình',
    (status) => {
      const html = render('main', status);
      expect(html.match(/>Gỡ liên kết<\/button>/g) ?? []).toHaveLength(1);
      expect(html).toContain('Hồ sơ khác');
      expect(html).toContain('Đồng thuận lưu thông tin sức khỏe');
    },
  );
  it.each(['confirmed', 'withdrawn'] as const)(
    'TC-560: member %s vẫn có nút tự gỡ, không thấy hồ sơ khác',
    (status) => {
      const html = render('member', status);
      expect(html.match(/>Gỡ liên kết<\/button>/g) ?? []).toHaveLength(1);
      expect(html).not.toContain('Hồ sơ khác');
    },
  );
  it.each(['main', 'member'] as const)('TC-560: %s đã gỡ không hiện nút từ cache đồng thuận cũ', (role) => {
    const html = render(role, 'withdrawn', false);
    expect(html).not.toContain('>Gỡ liên kết</button>');
    expect(html).not.toContain('Đồng thuận lưu thông tin sức khỏe');
  });
});
