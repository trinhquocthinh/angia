import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { ProfileListItem, ProfileSession } from '../../application/ports';
import {
  profileGuardiansQueryKey,
  type ProfileGuardian,
  type ProfileGuardiansRepository,
} from '../../application/guardianPorts';
import { AddGuardianDialog } from './AddGuardianDialog';
import { ProfileGuardiansCard } from './ProfileGuardiansCard';
import { ProfileGuardiansSection } from './ProfileGuardiansSection';
import { RemoveSelfGuardianDialog } from './RemoveSelfGuardianDialog';

const minorProfile: ProfileListItem = {
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
  family: { id: 'fam-1', name: 'Nhà An', isOwner: false },
  role: 'main',
  csrfToken: 'csrf-123',
  authMethod: 'local',
  hasLocalCredential: true,
  emailStatus: { email: null, emailVerified: false, pendingEmail: null },
  features: { redactionSuggestions: false, localEnrollmentEnabled: false },
};

const noopRepo: ProfileGuardiansRepository = {
  list: vi.fn(async () => ({ ok: true as const, value: [] })),
  listCandidates: vi.fn(async () => ({ ok: true as const, value: [] })),
  add: vi.fn(async () => ({ ok: true as const, value: undefined })),
  removeSelf: vi.fn(async () => ({ ok: true as const, value: undefined })),
};

function renderSection(
  guardians: ProfileGuardian[],
  profile: ProfileListItem = minorProfile,
  session: ProfileSession = mainSession,
) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(profileGuardiansQueryKey(session, profile.id), guardians);
  const html = renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <ProfileGuardiansSection profile={profile} session={session} repository={noopRepo} />
    </QueryClientProvider>,
  );
  client.clear();
  return html;
}

describe('TC-816 — hiển thị mục Người giám hộ trong hồ sơ trẻ', () => {
  it('TC-816 — không render với hồ sơ người lớn, đã liên kết tài khoản hoặc người xem không phải main', () => {
    const oneGuardian = [{ accountId: 'acc-lan', displayName: 'Mẹ Lan', isMe: true }];
    expect(renderSection(oneGuardian, { ...minorProfile, birthYear: 1990 })).toBe('');
    expect(renderSection(oneGuardian, { ...minorProfile, hasLinkedAccount: true })).toBe('');
    expect(renderSection(oneGuardian, minorProfile, { ...mainSession, role: 'member' })).toBe('');
  });

  it('TC-816 — người xem không phải giám hộ chỉ thấy danh sách, không có nút Thêm hay Tự gỡ', () => {
    const html = renderToStaticMarkup(
      <ProfileGuardiansCard
        profileName="Bé An"
        guardians={[{ accountId: 'acc-minh', displayName: 'Ba Minh', isMe: false }]}
        onOpenAdd={() => undefined}
        onOpenRemoveSelf={() => undefined}
      />,
    );
    expect(html).toContain('Người giám hộ');
    expect(html).toContain('1/2 người');
    expect(html).toContain('Ba Minh');
    expect(html).not.toContain('<button');
  });

  it('TC-816 — đủ 2 người giám hộ: chip 2/2 Đã đủ, ẩn nút Thêm, chỉ hàng isMe có chip Bạn và nút Tự gỡ', () => {
    const html = renderToStaticMarkup(
      <ProfileGuardiansCard
        profileName="Bé An"
        guardians={[
          { accountId: 'acc-lan', displayName: 'Mẹ Lan', isMe: true },
          { accountId: 'acc-minh', displayName: 'Ba Minh', isMe: false },
        ]}
        onOpenAdd={() => undefined}
        onOpenRemoveSelf={() => undefined}
      />,
    );
    expect(html).toContain('2/2 Đã đủ');
    expect(html).toContain('Đã đủ 2 người giám hộ.');
    expect(html).not.toContain('Thêm người giám hộ');
    expect(html).toContain('Bạn');
    expect(html.match(/Tự gỡ/g)).toHaveLength(1);
    expect(html).toContain('/images/household/stitch/home-logout-danger.svg');
  });

  it('TC-816 — còn 1 người giám hộ: vẫn hiện cả nút Thêm người giám hộ và nút Tự gỡ ở hàng isMe', () => {
    const html = renderToStaticMarkup(
      <ProfileGuardiansCard
        profileName="Bé An"
        guardians={[{ accountId: 'acc-lan', displayName: 'Mẹ Lan', isMe: true }]}
        onOpenAdd={() => undefined}
        onOpenRemoveSelf={() => undefined}
      />,
    );
    expect(html).toContain('1/2 người');
    expect(html).toContain('Thêm người giám hộ');
    expect(html).toContain('Tự gỡ');
  });

  it('TC-816 — hộp thoại Thêm người giám hộ hiện trạng thái rỗng và ứng viên Chủ hộ / Đồng quản lý', () => {
    const emptyHtml = renderToStaticMarkup(
      <AddGuardianDialog
        profileName="Bé An"
        candidates={[]}
        loading={false}
        loadError={false}
        pending={false}
        submitError={null}
        onRetryLoad={() => undefined}
        onClose={() => undefined}
        onSubmit={() => undefined}
      />,
    );
    expect(emptyHtml).toContain('Thêm người giám hộ cho Bé An');
    expect(emptyHtml).toContain(
      'Chưa có người phù hợp. Chỉ Chủ hộ hoặc Đồng quản lý cùng nhà mới làm được người giám hộ.',
    );

    const listHtml = renderToStaticMarkup(
      <AddGuardianDialog
        profileName="Bé An"
        candidates={[
          { accountId: 'owner-1', displayName: 'Ba Minh', role: 'main', isOwner: true, isSelf: false },
          { accountId: 'main-2', displayName: 'Anh Tuấn', role: 'main', isOwner: false, isSelf: false },
        ]}
        loading={false}
        loadError={false}
        pending={false}
        submitError={null}
        onRetryLoad={() => undefined}
        onClose={() => undefined}
        onSubmit={() => undefined}
      />,
    );
    expect(listHtml).toContain('Ba Minh · Chủ hộ');
    expect(listHtml).toContain('Anh Tuấn · Đồng quản lý');
  });

  it('TC-816 — hộp thoại Tự gỡ hiển thị nội dung xác nhận và lỗi ERR_LAST_GUARDIAN', () => {
    const html = renderToStaticMarkup(
      <RemoveSelfGuardianDialog
        profileName="Bé An"
        pending={false}
        error="Bạn là người giám hộ duy nhất. Hãy thêm người giám hộ khác trước khi tự gỡ."
        onClose={() => undefined}
        onConfirm={() => undefined}
      />,
    );
    expect(html).toContain('Bạn không còn là người giám hộ của Bé An?');
    expect(html).toContain('Bạn sẽ không còn nhận nhắc thuốc của Bé An.');
    expect(html).toContain('Bạn là người giám hộ duy nhất. Hãy thêm người giám hộ khác trước khi tự gỡ.');
  });
});
