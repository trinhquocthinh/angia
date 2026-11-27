import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import type { FoundingInvitationRepository } from './ports';
import { AdminRequestError } from './AdminRequestError';
import { useFoundingInvitations } from './useFoundingInvitations';

const issued = {
  invitationId: 'id',
  code: 'AN-REAL-CODE',
  link: 'https://angia.test/invite#secret-token',
  expiresAt: '2026-12-01T18:00:00Z',
};
function harness(csrf: string | null = 'csrf') {
  const client = new QueryClient();
  client.setQueryData(['current-session'], { csrfToken: 'csrf' });
  const repository: FoundingInvitationRepository = {
    create: vi.fn(async () => issued),
    revoke: vi.fn(async () => undefined),
  };
  let state!: ReturnType<typeof useFoundingInvitations>;
  function Probe() {
    state = useFoundingInvitations(repository, csrf);
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  return { client, repository, state };
}
it('SPEC-065: tạo và thu hồi gửi CSRF, không trả bí mật vào query/mutation cache', async () => {
  const { client, repository, state } = harness();
  try {
    expect(state.items).toEqual([]);
    await expect(state.create.mutateAsync()).resolves.toBeUndefined();
    await expect(state.revoke.mutateAsync('id')).resolves.toBeUndefined();
    expect(repository.create).toHaveBeenCalledWith('csrf');
    expect(repository.revoke).toHaveBeenCalledWith('id', 'csrf');
    const cached = JSON.stringify([
      client
        .getMutationCache()
        .getAll()
        .map((mutation) => mutation.state),
      client
        .getQueryCache()
        .getAll()
        .map((query) => query.state),
    ]);
    expect(cached).not.toContain(issued.link);
    expect(cached).not.toContain(issued.code);
    expect(client.getQueryState(['current-session'])?.isInvalidated).toBe(false);
  } finally {
    client.clear();
  }
});
it('SPEC-065: thu hồi lời mời không còn hiệu lực không báo lỗi thao tác', async () => {
  const { client, repository, state } = harness();
  vi.mocked(repository.revoke).mockRejectedValue(new AdminRequestError('ERR_NOT_FOUND', 404));
  try {
    await expect(state.revoke.mutateAsync('id')).resolves.toBeUndefined();
  } finally {
    client.clear();
  }
});
it.each([401, 403, 500])('SPEC-065: tạo/thu hồi lỗi %s, chỉ lỗi quyền làm mới phiên', async (status) => {
  const { client, repository, state } = harness();
  const error = new AdminRequestError('ERR_INTERNAL', status);
  vi.mocked(repository.create).mockRejectedValue(error);
  vi.mocked(repository.revoke).mockRejectedValue(error);
  try {
    await expect(state.create.mutateAsync()).rejects.toBe(error);
    expect(client.getQueryState(['current-session'])?.isInvalidated).toBe(status !== 500);
    client.setQueryData(['current-session'], { csrfToken: 'csrf' });
    await expect(state.revoke.mutateAsync('id')).rejects.toBe(error);
    expect(client.getQueryState(['current-session'])?.isInvalidated).toBe(status !== 500);
  } finally {
    client.clear();
  }
});
it('SPEC-065: không có CSRF không phát hành hoặc thu hồi', async () => {
  const { client, repository, state } = harness(null);
  try {
    await expect(state.create.mutateAsync()).rejects.toMatchObject({ status: 401 });
    await expect(state.revoke.mutateAsync('id')).rejects.toMatchObject({ status: 401 });
    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.revoke).not.toHaveBeenCalled();
  } finally {
    client.clear();
  }
});
