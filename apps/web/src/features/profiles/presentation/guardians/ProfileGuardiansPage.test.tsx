import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { ProfileListItem, ProfileSession } from '../../application/ports';
import { profileGuardiansQueryKey, type ProfileGuardiansRepository } from '../../application/guardianPorts';
import { ProfileGuardiansPageContent } from './ProfileGuardiansPageContent';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

const minorPendingConsent: ProfileListItem = {
  id: 'profile-an',
  familyId: 'fam-1',
  displayName: 'Bé An',
  birthYear: 2020,
  vitalsEnabled: null,
  consentConfirmedAt: null,
  consentConfirmedBy: null,
  consentBasis: null,
  consentStatus: 'pending',
  consentSource: null,
  consentRespondentName: null,
  createdAt: '2026-01-01T00:00:00Z',
  consentAction: 'attestation',
  hasLinkedAccount: false,
  consentConfirmedByName: null,
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

const noopRepo: ProfileGuardiansRepository = {
  list: vi.fn(async () => ({ ok: true as const, value: [] })),
  listCandidates: vi.fn(async () => ({ ok: true as const, value: [] })),
  add: vi.fn(async () => ({ ok: true as const, value: undefined })),
  removeSelf: vi.fn(async () => ({ ok: true as const, value: undefined })),
};

function renderPage(profile: ProfileListItem, session: ProfileSession = mainSession) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(profileGuardiansQueryKey(session, profile.id), [
    { accountId: 'acc-lan', displayName: 'Mẹ Lan', isMe: true },
  ]);
  const html = renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <ProfileGuardiansPageContent profile={profile} session={session} repository={noopRepo} />
    </QueryClientProvider>,
  );
  client.clear();
  return html;
}

describe('TC-816 — trang tab Người giám hộ', () => {
  it('TC-816 — hồ sơ trẻ CHƯA đồng ý lưu dữ liệu vẫn hiển thị thẻ Người giám hộ, không bị cổng đồng ý chặn', () => {
    const html = renderPage(minorPendingConsent);
    expect(html).toContain('Người giám hộ');
    expect(html).toContain('Mẹ Lan');
    expect(html).toContain('1/2 người');
    expect(html).not.toContain('Hồ sơ chưa được đồng ý lưu dữ liệu.');
  });

  it.each([
    ['người lớn', { ...minorPendingConsent, birthYear: 1990 }],
    ['trẻ đã liên kết tài khoản', { ...minorPendingConsent, hasLinkedAccount: true }],
    ['chưa rõ năm sinh', { ...minorPendingConsent, birthYear: null }],
  ])('TC-816 — hồ sơ không đủ điều kiện (%s) hiển thị thông báo ngắn thay vì thẻ giám hộ', (_, profile) => {
    const html = renderPage(profile);
    expect(html).toContain('Hồ sơ này không cần người giám hộ.');
    expect(html).not.toContain('1/2 người');
    expect(html).not.toContain('Thêm người giám hộ');
  });
});
