import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { ProfileListItem, ProfilesRepository, ProfileSession } from './ports';
import { ProfileRequestError } from './ProfileRequestError';
import { profileScopeKey } from './profileScopeKey';
import { useConfirmProfileConsent } from './useConfirmProfileConsent';
const session: ProfileSession = {
  account: { id: 'main', displayName: 'Cha', isSystemAdmin: false, healthProfileId: null },
  family: { id: 'f', name: 'Nhà' },
  role: 'main',
  csrfToken: 'csrf',
};
const profile: ProfileListItem = {
  id: 'p',
  familyId: 'f',
  displayName: 'Bé',
  birthYear: null,
  consentConfirmedAt: null,
  consentConfirmedBy: null,
  consentBasis: null,
  consentStatus: 'pending',
  consentSource: null,
  consentRespondentName: null,
  createdAt: '2026-10-27T00:00:00Z',
  consentAction: 'attestation',
  consentConfirmedByName: null,
};
const body = { kind: 'attestation', attestation: true, basis: 'guardian', respondentName: 'Mẹ' } as const;
function mount(confirmConsent: ProfilesRepository['confirmConsent'], context = session, item = profile) {
  const client = new QueryClient();
  client.setQueryData([...profileScopeKey(session), 'list'], [profile]);
  client.setQueryData(['current-session'], session);
  let hook: ReturnType<typeof useConfirmProfileConsent>;
  function Probe() {
    hook = useConfirmProfileConsent({ confirmConsent } as ProfilesRepository, context, item);
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  return { client, hook: hook! };
}
describe('TC-558 — xác nhận trong phiên và làm mới cache', () => {
  it('gửi đúng hồ sơ/body/CSRF; thành công làm mới danh sách và phiên', async () => {
    const confirm = vi.fn(async () => profile);
    const { client, hook } = mount(confirm);
    expect(await hook.submit(body)).toBe(true);
    expect(confirm).toHaveBeenCalledWith('p', body, 'csrf');
    expect(client.getQueryState([...profileScopeKey(session), 'list'])?.isInvalidated).toBe(true);
    expect(client.getQueryState(['current-session'])?.isInvalidated).toBe(true);
    client.clear();
  });
  it.each([
    { ...session, role: 'member' as const },
    { ...session, family: { id: 'other', name: 'Khác' } },
    { ...session, csrfToken: '' },
  ])('không gửi khi phiên không đủ điều kiện', async (context) => {
    const confirm = vi.fn(async () => profile);
    const { client, hook } = mount(confirm, context);
    expect(await hook.submit(body)).toBe(false);
    expect(confirm).not.toHaveBeenCalled();
    client.clear();
  });
  it.each(['self', 'invitation', null] as const)(
    'chặn payload attestation khi action là %s',
    async (consentAction) => {
      const confirm = vi.fn(async () => profile);
      const { client, hook } = mount(confirm, session, { ...profile, consentAction });
      expect(await hook.submit(body)).toBe(false);
      expect(confirm).not.toHaveBeenCalled();
      client.clear();
    },
  );
  it('chặn gửi đôi và giữ lỗi 409, làm mới metadata khi server từ chối cam kết cũ', async () => {
    let reject!: (cause: Error) => void;
    const confirm = vi.fn(
      () =>
        new Promise<ProfileListItem>((_, fail) => {
          reject = fail;
        }),
    );
    const { client, hook } = mount(confirm);
    const first = hook.submit(body);
    expect(await hook.submit(body)).toBe(false);
    await vi.waitFor(() => expect(confirm).toHaveBeenCalledTimes(1));
    reject(new ProfileRequestError('Cần gửi link', 409, 'ERR_CONSENT_INVITATION_REQUIRED'));
    expect(await first).toBe(false);
    expect(client.getQueryState([...profileScopeKey(session), 'list'])?.isInvalidated).toBe(true);
    client.clear();
  });
});
