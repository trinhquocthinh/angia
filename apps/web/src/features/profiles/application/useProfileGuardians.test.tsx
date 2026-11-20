import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { ProfileSession } from './ports';
import { profileGuardiansQueryKey, type ProfileGuardiansRepository } from './guardianPorts';
import { useProfileGuardians } from './useProfileGuardians';

const session: ProfileSession = {
  account: { id: 'acc-lan', displayName: 'Mẹ Lan', isSystemAdmin: false, healthProfileId: null },
  family: { id: 'fam-1', name: 'Nhà An' },
  role: 'main',
  csrfToken: 'csrf-token-1',
  authMethod: 'local',
  hasLocalCredential: true,
  features: { redactionSuggestions: false, localEnrollmentEnabled: false },
};

function mount(repo: ProfileGuardiansRepository, enabled = true, csrfToken = session.csrfToken) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const key = profileGuardiansQueryKey(session, 'profile-1');
  client.setQueryData(key, [{ accountId: 'acc-lan', displayName: 'Mẹ Lan', isMe: true }]);
  let hook: ReturnType<typeof useProfileGuardians>;
  function Probe() {
    hook = useProfileGuardians(repo, { ...session, csrfToken }, 'profile-1', enabled);
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  return { client, key, hook: hook! };
}

describe('TC-816 — hook quản lý người giám hộ hồ sơ trẻ', () => {
  it('TC-816 — thêm người giám hộ gửi đúng CSRF và làm mới cache danh sách', async () => {
    const repo: ProfileGuardiansRepository = {
      list: vi.fn(async () => ({
        ok: true as const,
        value: [
          { accountId: 'acc-lan', displayName: 'Mẹ Lan', isMe: true },
          { accountId: 'acc-minh', displayName: 'Ba Minh', isMe: false },
        ],
      })),
      listCandidates: vi.fn(async () => ({ ok: true as const, value: [] })),
      add: vi.fn(async () => ({ ok: true as const, value: undefined })),
      removeSelf: vi.fn(async () => ({ ok: true as const, value: undefined })),
    };

    const { client, key, hook } = mount(repo);
    expect(await hook.addGuardian('acc-minh')).toEqual({ ok: true });
    expect(repo.add).toHaveBeenCalledWith('profile-1', 'acc-minh', 'csrf-token-1');
    expect(client.getQueryState(key)?.isInvalidated).toBe(true);
    client.clear();
  });

  it('TC-816 — tự gỡ khi còn 1 giám hộ trả về thông điệp ERR_LAST_GUARDIAN', async () => {
    const repo: ProfileGuardiansRepository = {
      list: vi.fn(async () => ({
        ok: true as const,
        value: [{ accountId: 'acc-lan', displayName: 'Mẹ Lan', isMe: true }],
      })),
      listCandidates: vi.fn(async () => ({ ok: true as const, value: [] })),
      add: vi.fn(async () => ({ ok: true as const, value: undefined })),
      removeSelf: vi.fn(async () => ({ ok: false as const, code: 'ERR_LAST_GUARDIAN' })),
    };

    const { client, hook } = mount(repo);
    expect(await hook.removeSelf()).toEqual({
      ok: false,
      message: 'Bạn là người giám hộ duy nhất. Hãy thêm người giám hộ khác trước khi tự gỡ.',
    });
    expect(repo.removeSelf).toHaveBeenCalledWith('profile-1', 'csrf-token-1');
    client.clear();
  });

  it('TC-816 — lỗi ERR_VALIDATION hoặc lỗi mạng khi thêm/gỡ trả về thông điệp tiếng Việt chung', async () => {
    const repo: ProfileGuardiansRepository = {
      list: vi.fn(async () => ({ ok: true as const, value: [] })),
      listCandidates: vi.fn(async () => ({ ok: true as const, value: [] })),
      add: vi.fn(async () => ({ ok: false as const, code: 'ERR_VALIDATION' })),
      removeSelf: vi.fn(async () => ({ ok: false as const, code: 'NETWORK' })),
    };

    const { client, hook } = mount(repo);
    expect(await hook.addGuardian('acc-minh')).toEqual({
      ok: false,
      message: 'Chưa lưu được. Thử lại sau.',
    });
    expect(await hook.removeSelf()).toEqual({
      ok: false,
      message: 'Chưa lưu được. Thử lại sau.',
    });
    client.clear();
  });
});

it('không gọi POST hoặc DELETE khi thiếu CSRF, kể cả khi gọi trực tiếp hook', async () => {
  const repo: ProfileGuardiansRepository = {
    list: vi.fn(),
    listCandidates: vi.fn(),
    add: vi.fn(),
    removeSelf: vi.fn(),
  };
  const { client, hook } = mount(repo, true, '');
  expect(await hook.addGuardian('acc-minh')).toEqual({ ok: false, message: 'Chưa lưu được. Thử lại sau.' });
  expect(await hook.removeSelf()).toEqual({ ok: false, message: 'Chưa lưu được. Thử lại sau.' });
  expect(repo.add).not.toHaveBeenCalled();
  expect(repo.removeSelf).not.toHaveBeenCalled();
  client.clear();
});

it('lỗi Promise từ repository được chuyển thành lỗi lưu chung', async () => {
  const repo: ProfileGuardiansRepository = {
    list: vi.fn(),
    listCandidates: vi.fn(),
    add: vi.fn().mockRejectedValue(new Error('mạng')),
    removeSelf: vi.fn().mockRejectedValue(new Error('mạng')),
  };
  const { client, hook } = mount(repo);
  expect(await hook.addGuardian('acc-minh')).toEqual({ ok: false, message: 'Chưa lưu được. Thử lại sau.' });
  expect(await hook.removeSelf()).toEqual({ ok: false, message: 'Chưa lưu được. Thử lại sau.' });
  client.clear();
});

it('query key cô lập theo hồ sơ, tài khoản và nhà', () => {
  const key = profileGuardiansQueryKey(session, 'profile-1');
  expect(profileGuardiansQueryKey(session, 'profile-2')).not.toEqual(key);
  expect(
    profileGuardiansQueryKey({ ...session, account: { ...session.account, id: 'other' } }, 'profile-1'),
  ).not.toEqual(key);
  expect(
    profileGuardiansQueryKey({ ...session, family: { id: 'other', name: 'Nhà khác' } }, 'profile-1'),
  ).not.toEqual(key);
});

it('đang thêm chặn gửi lặp và tự gỡ đồng thời', async () => {
  let release!: () => void;
  const hold = new Promise<void>((resolve) => {
    release = resolve;
  });
  const repo: ProfileGuardiansRepository = {
    list: vi.fn(),
    listCandidates: vi.fn(),
    add: vi.fn(async () => {
      await hold;
      return { ok: true as const, value: undefined };
    }),
    removeSelf: vi.fn(),
  };
  const { client, hook } = mount(repo);
  const first = hook.addGuardian('acc-minh');
  expect((await hook.addGuardian('acc-minh')).ok).toBe(false);
  expect((await hook.removeSelf()).ok).toBe(false);
  expect(repo.add).toHaveBeenCalledOnce();
  expect(repo.removeSelf).not.toHaveBeenCalled();
  release();
  expect(await first).toEqual({ ok: true });
  client.clear();
});

it('hai hồ sơ dùng cùng QueryClient không đọc nhầm danh sách giám hộ', () => {
  const client = new QueryClient();
  client.setQueryData(profileGuardiansQueryKey(session, 'child-a'), [
    { accountId: 'a', displayName: 'An', isMe: true },
  ]);
  client.setQueryData(profileGuardiansQueryKey(session, 'child-b'), [
    { accountId: 'b', displayName: 'Bình', isMe: false },
  ]);
  const repo: ProfileGuardiansRepository = {
    list: vi.fn(),
    listCandidates: vi.fn(),
    add: vi.fn(),
    removeSelf: vi.fn(),
  };
  const names: string[] = [];
  function Probe({ id }: { id: string }) {
    const model = useProfileGuardians(repo, session, id, true);
    names.push(model.guardiansQuery.data![0]!.displayName);
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <Probe id="child-a" />
      <Probe id="child-b" />
    </QueryClientProvider>,
  );
  expect(names).toEqual(['An', 'Bình']);
  client.clear();
});
