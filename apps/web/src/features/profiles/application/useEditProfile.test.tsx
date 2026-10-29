import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { HealthProfile, ProfileListItem, ProfilesRepository, ProfileSession } from './ports';
import { profileScopeKey } from './profileScopeKey';
import { ProfileRequestError } from './ProfileRequestError';
import { useEditProfile } from './useEditProfile';
const session: ProfileSession = {
  account: { id: 'a', displayName: 'An', isSystemAdmin: false, healthProfileId: null },
  family: { id: 'f', name: 'Nhà' },
  role: 'main',
  csrfToken: 'csrf',
};
const healthProfile: HealthProfile = {
  id: 'p',
  familyId: 'f',
  displayName: 'Bé An',
  birthYear: null,
  vitalsEnabled: null,
  consentStatus: 'pending',
  consentConfirmedAt: null,
  consentConfirmedBy: null,
  consentBasis: null,
  consentSource: null,
  consentRespondentName: null,
  createdAt: '2026-10-29T00:00:00Z',
};
const profile: ProfileListItem = {
  ...healthProfile,
  consentAction: 'attestation',
  consentConfirmedByName: null,
};
function mount(update: ProfilesRepository['update'], context = session, item = profile) {
  const client = new QueryClient();
  const key = [...profileScopeKey(context), 'list'];
  client.setQueryData(key, [profile]);
  const summary = ['visit-summary', 'a', 'f', 'p', '2026-01-01', '2026-12-31'];
  const other = ['visit-summary', 'a', 'f', 'other'];
  client.setQueryData(summary, { showsVitals: true });
  client.setQueryData(other, { showsVitals: true });
  let hook: ReturnType<typeof useEditProfile>;
  function Probe() {
    hook = useEditProfile({ update } as ProfilesRepository, context, item);
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  return { client, hook: hook!, key, summary, other };
}
describe('TC-449 — lưu sửa hồ sơ, quyền và cache', () => {
  it('PATCH thành công cập nhật năm ngay, giữ metadata và làm mới đúng bản tóm tắt', async () => {
    const update = vi.fn(async () => ({ ...healthProfile, birthYear: 2020, vitalsEnabled: true }));
    const { client, hook, key, summary, other } = mount(update);
    expect(await hook.save({ birthYear: 2020, vitalsEnabled: true })).toBe(true);
    expect(update).toHaveBeenCalledWith('p', { birthYear: 2020, vitalsEnabled: true }, 'csrf');
    expect(client.getQueryData(key)).toEqual([{ ...profile, birthYear: 2020, vitalsEnabled: true }]);
    expect(client.getQueryState(key)?.isInvalidated).toBe(true);
    expect(client.getQueryState(summary)?.isInvalidated).toBe(true);
    expect(client.getQueryState(other)?.isInvalidated).toBe(false);
    client.clear();
  });
  it.each([
    { ...session, role: 'member' as const },
    { ...session, csrfToken: '' },
    { ...session, family: { id: 'other', name: 'Khác' } },
  ])('không gửi khi phiên không đủ điều kiện', async (context) => {
    const update = vi.fn(async () => profile);
    const { client, hook } = mount(update, context);
    expect(await hook.save({ birthYear: 2020 })).toBe(false);
    expect(update).not.toHaveBeenCalled();
    client.clear();
  });
  it('hồ sơ rút đồng thuận không gửi PATCH', async () => {
    const update = vi.fn(async () => profile);
    const { client, hook } = mount(update, session, { ...profile, consentStatus: 'withdrawn' });
    expect(await hook.save({ birthYear: 2020 })).toBe(false);
    expect(update).not.toHaveBeenCalled();
    client.clear();
  });
  it('chặn gửi lặp; lỗi từ server giữ nguyên dữ liệu và không báo lưu thành công', async () => {
    let reject!: (error: Error) => void;
    const update = vi.fn(
      () =>
        new Promise<ProfileListItem>((_, fail) => {
          reject = fail;
        }),
    );
    const { client, hook, key } = mount(update);
    const first = hook.save({ birthYear: 2020 });
    expect(await hook.save({ birthYear: 2020 })).toBe(false);
    await vi.waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    reject(new ProfileRequestError('Hồ sơ đã rút đồng thuận.', 409, 'ERR_CONSENT_REQUIRED'));
    expect(await first).toBe(false);
    expect(client.getQueryData(key)).toEqual([profile]);
    expect(client.getQueryState(key)?.isInvalidated).toBe(true);
    client.clear();
  });
});
