import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { ProfileListItem, ProfileSession } from '@src/features/profiles/application/ports';
import { ReminderSettings } from './ReminderSettings';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

const baseProfile: ProfileListItem = {
  id: 'profile-an',
  familyId: 'fam-1',
  displayName: 'Bé An',
  birthYear: 2020,
  vitalsEnabled: null,
  consentConfirmedAt: '2026-01-01T00:00:00Z',
  consentConfirmedBy: 'acc-lan',
  consentBasis: 'guardian',
  consentStatus: 'confirmed',
  consentSource: 'main_attested',
  consentRespondentName: 'Mẹ Lan',
  createdAt: '2026-01-01T00:00:00Z',
  consentAction: null,
  hasLinkedAccount: false,
  consentConfirmedByName: 'Mẹ Lan',
};

const mainSession: ProfileSession = {
  account: { id: 'acc-lan', displayName: 'Mẹ Lan', isSystemAdmin: false, healthProfileId: null },
  family: { id: 'fam-1', name: 'Nhà An' },
  role: 'main',
  csrfToken: 'csrf-123',
  authMethod: 'local',
  hasLocalCredential: true,
  features: { redactionSuggestions: false, localEnrollmentEnabled: false },
};

function renderReminders(profile: ProfileListItem) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const html = renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <ReminderSettings profile={profile} session={mainSession} />
    </QueryClientProvider>,
  );
  client.clear();
  return html;
}

describe('TC-816 — trang Nhắc thuốc với hồ sơ trẻ và hồ sơ khác', () => {
  it('TC-816 — hồ sơ trẻ chưa liên kết hiển thị giải thích kèm liên kết sang tab Người giám hộ, không hiện thẻ giám hộ', () => {
    const html = renderReminders(baseProfile);
    expect(html).toContain('Người nhận nhắc của hồ sơ trẻ là các người giám hộ.');
    expect(html).toContain('Xem người giám hộ');
    expect(html).toContain('href="/profiles/$profileId/guardians"');
    expect(html).not.toContain('Thêm người giám hộ');
    expect(html).not.toContain('Đang tải người giám hộ');
  });

  it('TC-816 — hồ sơ người lớn giữ nguyên khối Người nhận nhắc', () => {
    const html = renderReminders({ ...baseProfile, displayName: 'Ông Nội', birthYear: 1955 });
    expect(html).toContain('Người nhận nhắc');
    expect(html).not.toContain('Người nhận nhắc của hồ sơ trẻ là các người giám hộ.');
    expect(html).not.toContain('Xem người giám hộ');
  });
});
