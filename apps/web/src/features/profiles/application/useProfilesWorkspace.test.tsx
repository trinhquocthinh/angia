import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { ProfilesRepository, ProfileSession } from './ports';
import { profileScopeKey } from './profileScopeKey';
import { useProfilesWorkspace } from './useProfilesWorkspace';
const session: ProfileSession = {
  account: { id: 'a', displayName: 'An', isSystemAdmin: false, healthProfileId: null },
  family: { id: 'f', name: 'Nhà An' },
  role: 'main',
  csrfToken: 'csrf',
};
const profile = {
  id: 'p',
  familyId: 'f',
  displayName: 'Mẹ',
  birthYear: null,
  consentConfirmedAt: null,
  consentConfirmedBy: null,
  consentBasis: null,
  consentStatus: 'pending' as const,
  consentSource: null,
  consentRespondentName: null,
  createdAt: '2026-10-06T00:00:00Z',
};
function repository(fail = false): ProfilesRepository {
  return {
    list: vi.fn(async () => [profile]),
    linkableAccounts: vi.fn(async () => []),
    create: vi.fn(async () => {
      if (fail) throw new Error('Lỗi mạng');
      return profile;
    }),
    createInvitation: vi.fn(async () => ({ token: 'opaque', expiresAt: '2026-10-13T00:00:00Z' })),
    revokeInvitation: vi.fn(async () => undefined),
    logout: vi.fn(async () => undefined),
  };
}
function mount(client: QueryClient, repo: ProfilesRepository, context: ProfileSession) {
  let workspace: ReturnType<typeof useProfilesWorkspace> | undefined;
  function Probe() {
    workspace = useProfilesWorkspace(repo, context, true);
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  return workspace!;
}
describe('Cô lập cache hồ sơ và quyền thao tác', () => {
  it('key chứa cả tài khoản và nhóm; không dùng dữ liệu từ phiên khác', () => {
    const client = new QueryClient();
    client.setQueryData([...profileScopeKey(session), 'list'], [profile]);
    expect(
      mount(client, repository(), { ...session, account: { ...session.account, id: 'b' } }).profiles.data,
    ).toBeUndefined();
    expect(
      mount(client, repository(), { ...session, family: { id: 'g', name: 'Nhà Bình' } }).profiles.data,
    ).toBeUndefined();
    client.clear();
  });
  it('member không tải danh sách hồ sơ/tài khoản hoặc gửi tạo/đồng thuận', async () => {
    const client = new QueryClient();
    const repo = repository();
    const workspace = mount(client, repo, {
      ...session,
      role: 'member',
      account: { ...session.account, isSystemAdmin: true },
    });
    expect(
      client
        .getQueryCache()
        .getAll()
        .every((query) => query.state.fetchStatus === 'idle'),
    ).toBe(true);
    expect(
      client
        .getQueryCache()
        .getAll()
        .map((query) => (query.options as { enabled?: boolean }).enabled),
    ).toEqual([false, false]);
    await expect(workspace.create.mutateAsync({ displayName: 'Ba' })).rejects.toThrow(
      'Chỉ người chăm sóc chính',
    );
    expect(repo.create).not.toHaveBeenCalled();
    client.clear();
  });
  it.each([false, true])('tạo thành công làm mới danh sách và phiên, lỗi=%s', async (fail) => {
    const client = new QueryClient();
    const key = [...profileScopeKey(session), 'list'];
    client.setQueryData(key, []);
    client.setQueryData(['current-session'], session);
    const workspace = mount(client, repository(fail), session);
    const mutation = workspace.create.mutateAsync({ displayName: 'Ba' });
    if (fail) await expect(mutation).rejects.toThrow('Lỗi mạng');
    else await mutation;
    expect(client.getQueryState(key)?.isInvalidated).toBe(!fail);
    expect(client.getQueryState(['current-session'])?.isInvalidated).toBe(!fail);
    client.clear();
  });
  it('đăng xuất thành công hủy truy vấn rồi xóa cache trước khi chuyển trang', async () => {
    const client = new QueryClient();
    client.setQueryData(['current-session'], session);
    client.setQueryData([...profileScopeKey(session), 'list'], [profile]);
    const cancel = vi.spyOn(client, 'cancelQueries');
    const assign = vi.fn(() => expect(client.getQueryCache().getAll()).toHaveLength(0));
    vi.stubGlobal('window', { location: { assign } });
    try {
      await mount(client, repository(), session).logout.mutateAsync();
      expect(cancel).toHaveBeenCalled();
      expect(assign).toHaveBeenCalledWith('/login');
    } finally {
      vi.unstubAllGlobals();
      client.clear();
    }
  });
  it('đăng xuất lỗi giữ lại cache và phiên hiện tại', async () => {
    const client = new QueryClient();
    client.setQueryData(['current-session'], session);
    const repo = repository();
    repo.logout = async () => {
      throw new Error('Lỗi mạng');
    };
    await expect(mount(client, repo, session).logout.mutateAsync()).rejects.toThrow('Lỗi mạng');
    expect(client.getQueryData(['current-session'])).toEqual(session);
    client.clear();
  });
});
