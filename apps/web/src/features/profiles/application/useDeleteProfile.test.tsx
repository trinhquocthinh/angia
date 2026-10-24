import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { HealthProfile, ProfilesRepository, ProfileSession } from './ports';
import { ProfileRequestError } from './ProfileRequestError';
import { profileScopeKey } from './profileScopeKey';
import { useDeleteProfile } from './useDeleteProfile';
const session: ProfileSession = {
  account: { id: 'a', displayName: 'An', isSystemAdmin: false, healthProfileId: null },
  family: { id: 'f', name: 'Nhà An' },
  role: 'main',
  csrfToken: 'csrf',
};
const profile = { id: 'p', displayName: 'Mẹ' } as HealthProfile;
function mount(client: QueryClient, repo: ProfilesRepository, context = session) {
  let hook: ReturnType<typeof useDeleteProfile> | undefined;
  function Probe() {
    hook = useDeleteProfile(repo, context);
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  return hook!;
}
const repository = (remove: ProfilesRepository['remove']) =>
  ({ remove: vi.fn(remove) }) as unknown as ProfilesRepository & { remove: ReturnType<typeof vi.fn> };

describe('SPEC-007 — xóa hồ sơ từ web', () => {
  it('thành công: làm mới danh sách và gỡ mọi cache của hồ sơ đã xóa', async () => {
    const client = new QueryClient();
    const listKey = [...profileScopeKey(session), 'list'];
    client.setQueryData(listKey, []);
    client.setQueryData(['medications', 'a', 'f', 'p', 'current'], []);
    client.setQueryData(['medications', 'a', 'f', 'other', 'current'], []);
    const repo = repository(async () => undefined);
    expect(await mount(client, repo).submit(profile, 'Mẹ')).toBe('deleted');
    expect(repo.remove).toHaveBeenCalledWith('p', 'Mẹ', 'csrf');
    expect(client.getQueryState(listKey)?.isInvalidated).toBe(true);
    expect(client.getQueryData(['medications', 'a', 'f', 'p', 'current'])).toBeUndefined();
    expect(client.getQueryData(['medications', 'a', 'f', 'other', 'current'])).toEqual([]);
    client.clear();
  });
  it('422 ERR_CONFIRMATION_MISMATCH → mismatch, không đụng cache', async () => {
    const client = new QueryClient();
    client.setQueryData(['medications', 'a', 'f', 'p', 'current'], []);
    const repo = repository(async () => {
      throw new ProfileRequestError('Sai', 422, 'ERR_CONFIRMATION_MISMATCH');
    });
    expect(await mount(client, repo).submit(profile, 'me')).toBe('mismatch');
    expect(client.getQueryData(['medications', 'a', 'f', 'p', 'current'])).toEqual([]);
    client.clear();
  });
  it('lỗi khác → failed; member hoặc thiếu CSRF không gửi', async () => {
    const client = new QueryClient();
    const failing = repository(async () => {
      throw new ProfileRequestError('Lỗi', 500);
    });
    expect(await mount(client, failing).submit(profile, 'Mẹ')).toBe('failed');
    const repo = repository(async () => undefined);
    expect(await mount(client, repo, { ...session, role: 'member' }).submit(profile, 'Mẹ')).toBe('failed');
    expect(await mount(client, repo, { ...session, csrfToken: '' }).submit(profile, 'Mẹ')).toBe('failed');
    expect(repo.remove).not.toHaveBeenCalled();
    client.clear();
  });
  it('chặn gửi lặp khi đang xóa', async () => {
    const client = new QueryClient();
    let finish: () => void = () => undefined;
    const repo = repository(() => new Promise<void>((resolve) => (finish = resolve)));
    const hook = mount(client, repo);
    const first = hook.submit(profile, 'Mẹ');
    expect(await hook.submit(profile, 'Mẹ')).toBe('failed');
    finish();
    expect(await first).toBe('deleted');
    expect(repo.remove).toHaveBeenCalledTimes(1);
    client.clear();
  });
});
