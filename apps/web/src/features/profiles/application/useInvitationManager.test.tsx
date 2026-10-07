import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { ProfilesRepository, ProfileSession } from './ports';
import { useInvitationManager } from './useInvitationManager';
import { profileScopeKey } from './profileScopeKey';
const session: ProfileSession = {
  account: { id: 'a', displayName: 'An', isSystemAdmin: false, healthProfileId: null },
  family: { id: 'f', name: 'Nhà An' },
  role: 'main',
  csrfToken: 'csrf',
};
function mount(client: QueryClient, repo: ProfilesRepository, context = session) {
  let workspace: ReturnType<typeof useInvitationManager> | undefined;
  function Probe() {
    workspace = useInvitationManager(repo, context, 'p');
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  return workspace!;
}
function repository(): ProfilesRepository {
  return {
    list: vi.fn(),
    linkableAccounts: vi.fn(),
    create: vi.fn(),
    createInvitation: vi.fn(async () => ({ token: 'raw-secret', expiresAt: '2026-10-13T00:00:00Z' })),
    revokeInvitation: vi.fn(async () => undefined),
    logout: vi.fn(),
  };
}
describe('TC-106 — Main quản lý lời mời không cache raw token', () => {
  it('tạo link làm mới đúng scope; token không vào query/mutation cache', async () => {
    const client = new QueryClient();
    const key = [...profileScopeKey(session), 'list'];
    client.setQueryData(key, []);
    const repo = repository();
    await mount(client, repo).create();
    expect(repo.createInvitation).toHaveBeenCalledWith('p', 'csrf');
    expect(client.getQueryState(key)?.isInvalidated).toBe(true);
    expect(
      JSON.stringify(
        client
          .getQueryCache()
          .getAll()
          .map((query) => query.state),
      ),
    ).not.toContain('raw-secret');
    expect(client.getMutationCache().getAll()).toHaveLength(0);
    client.clear();
  });
  it('member kể cả systemadmin không gửi tạo/thu hồi link', async () => {
    const client = new QueryClient();
    const repo = repository();
    const manager = mount(client, repo, {
      ...session,
      role: 'member',
      account: { ...session.account, isSystemAdmin: true },
    });
    await manager.create();
    await manager.revoke();
    expect(repo.createInvitation).not.toHaveBeenCalled();
    expect(repo.revokeInvitation).not.toHaveBeenCalled();
    client.clear();
  });
  it('chặn gửi lặp và không tự thu hồi khi GET hoặc mở dialog', async () => {
    const client = new QueryClient();
    const repo = repository();
    let finish: () => void = () => undefined;
    const wait = new Promise<void>((resolve) => {
      finish = resolve;
    });
    repo.createInvitation = vi.fn(async () => {
      await wait;
      return { token: 'raw-secret', expiresAt: '2026-10-13T00:00:00Z' };
    });
    const manager = mount(client, repo);
    expect(repo.createInvitation).not.toHaveBeenCalled();
    const first = manager.create();
    await manager.create();
    await manager.revoke();
    expect(repo.createInvitation).toHaveBeenCalledTimes(1);
    expect(repo.revokeInvitation).not.toHaveBeenCalled();
    finish();
    await first;
    client.clear();
  });
  it('thu hồi link làm mới danh sách, lỗi không giả lập thành công', async () => {
    const client = new QueryClient();
    const key = [...profileScopeKey(session), 'list'];
    client.setQueryData(key, []);
    const repo = repository();
    await mount(client, repo).revoke();
    expect(repo.revokeInvitation).toHaveBeenCalledWith('p', 'csrf');
    expect(client.getQueryState(key)?.isInvalidated).toBe(true);
    client.setQueryData(key, []);
    repo.createInvitation = async () => {
      throw new Error('Lỗi mạng');
    };
    await mount(client, repo).create();
    expect(client.getQueryState(key)?.isInvalidated).toBe(false);
    client.clear();
  });
});
