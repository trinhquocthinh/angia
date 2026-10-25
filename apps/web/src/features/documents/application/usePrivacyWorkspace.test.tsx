import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { components } from '@src/shared/api/schema.gen';
import type { PrivacyRepository } from './privacyPorts';
import { usePrivacyWorkspace } from './usePrivacyWorkspace';
type Session = components['schemas']['MeContextResponse'];
const session: Session = {
  account: { id: 'a', displayName: 'An', isSystemAdmin: false, healthProfileId: null },
  family: { id: 'f', name: 'Nhà An' },
  role: 'main',
  csrfToken: 'csrf',
};
function mount(client: QueryClient, context: Session, calls: string[]) {
  const repository: PrivacyRepository = {
    read: async () => {
      calls.push('GET');
      return { state: 'none' };
    },
    create: async () => {
      calls.push('CREATE');
      return { state: 'none' };
    },
    approve: async () => {
      calls.push('APPROVE');
      throw new Error('Không được gọi');
    },
    manual: async () => {
      calls.push('MANUAL');
      throw new Error('Không được gọi');
    },
  };
  let workspace!: ReturnType<typeof usePrivacyWorkspace>;
  function Probe() {
    workspace = usePrivacyWorkspace(repository, context, 'document');
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  return workspace;
}
describe('Quyền và phiên của bước kiểm tra riêng tư', () => {
  it('TC-210a: member không tải nháp hay gửi các lệnh riêng tư', async () => {
    const client = new QueryClient();
    const calls: string[] = [];
    const workspace = mount(client, { ...session, role: 'member' }, calls);
    expect(
      client
        .getQueryCache()
        .getAll()
        .every((query) => (query.options as { enabled?: boolean }).enabled === false),
    ).toBe(true);
    await workspace.create();
    await workspace.approve();
    await workspace.manual();
    expect(calls).toEqual([]);
    client.clear();
  });
  it('TC-210b: đổi tài khoản, gia đình hoặc phiên không dùng bản nháp trong cache trước', () => {
    const client = new QueryClient();
    const calls: string[] = [];
    mount(client, session, calls);
    const oldKey = client.getQueryCache().getAll()[0]!.queryKey;
    client.setQueryData(oldKey, {
      draft: { state: 'ready', draftId: 'old', sha256: 'a'.repeat(64), imageUrl: '/old' },
      revision: 0,
    });
    for (const next of [
      { ...session, account: { ...session.account, id: 'b' } },
      { ...session, family: { id: 'g', name: 'Nhà Bình' } },
      { ...session, csrfToken: 'next-session' },
    ]) {
      const workspace = mount(client, next, calls);
      expect(workspace.query.data).toBeUndefined();
      expect(workspace.state.loaded).toBeNull();
      expect(workspace.state.checked).toBe(false);
    }
    expect(calls).toEqual([]);
    client.clear();
  });
});
