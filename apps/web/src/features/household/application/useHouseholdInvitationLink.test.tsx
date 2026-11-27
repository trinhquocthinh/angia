import type * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useHouseholdInvitationLink } from './useHouseholdInvitationLink';
import {
  capturePendingInvitation,
  clearPendingInvitation,
  readPendingInvitation,
} from './pendingHouseholdInvitation';

const harness = vi.hoisted(() => ({
  states: [] as unknown[],
  refs: [] as { current: unknown }[],
  effects: [] as (() => void | (() => void))[],
  cleanups: [] as (() => void)[],
  stateIdx: 0,
  refIdx: 0,
  mounted: false,
}));
vi.mock('react', async (original) => ({
  ...(await original<typeof React>()),
  useState: <T,>(initial: T) => {
    const idx = harness.stateIdx++;
    if (harness.states.length <= idx) harness.states.push(initial);
    return [
      harness.states[idx],
      (next: T) => {
        harness.states[idx] = next;
      },
    ];
  },
  useRef: <T,>(initial: T) => {
    const idx = harness.refIdx++;
    if (harness.refs.length <= idx) harness.refs.push({ current: initial });
    return harness.refs[idx];
  },
  useEffect: (effect: () => void | (() => void)) => {
    if (!harness.mounted) harness.effects.push(effect);
  },
}));
const token = 'a'.repeat(43);
beforeEach(() => {
  harness.states = [];
  harness.refs = [];
  harness.effects = [];
  harness.cleanups = [];
  harness.mounted = false;
  capturePendingInvitation(
    { pathname: '/invite', hash: `#token=${token}`, search: '' },
    { state: null, replaceState: vi.fn() },
  );
});
afterEach(() => {
  harness.cleanups.forEach((cleanup) => cleanup());
  clearPendingInvitation();
});
function mount(overrides: Partial<Parameters<typeof useHouseholdInvitationLink>[0]> = {}) {
  const deps = {
    hasFamily: false,
    csrfToken: 'csrf',
    inspect: vi.fn(async () => ({
      ok: true as const,
      data: { kind: 'join_family' as const, role: 'member' as const },
    })),
    accept: vi.fn(async () => ({ ok: true as const })),
    refresh: vi.fn(async () => undefined),
    leave: vi.fn(async () => undefined),
    ...overrides,
  };
  let model!: ReturnType<typeof useHouseholdInvitationLink>;
  function Probe() {
    harness.stateIdx = 0;
    harness.refIdx = 0;
    model = useHouseholdInvitationLink(deps);
    return null;
  }
  function render() {
    renderToStaticMarkup(<Probe />);
    return model;
  }
  render();
  harness.mounted = true;
  for (const effect of harness.effects) {
    const cleanup = effect();
    if (cleanup) harness.cleanups.push(cleanup);
  }
  return {
    deps,
    render,
    get model() {
      return model;
    },
  };
}
it('E27-AT-D1: thiếu token không gọi inspect, hướng dẫn mở lại link', () => {
  clearPendingInvitation();
  const view = mount();
  expect(view.model.phase).toBe('missing');
  expect(view.model.message).toBe('Không tìm thấy lời mời. Hãy mở lại link mời bạn nhận được.');
  expect(view.deps.inspect).not.toHaveBeenCalled();
});
it('E27-AT-D1: có nhà xoá token và không gọi inspect/accept', async () => {
  const view = mount({ hasFamily: true });
  expect(view.render().message).toContain('Hãy rời nhà hiện tại');
  await view.model.accept();
  expect(readPendingInvitation()).toBeNull();
  expect(view.deps.inspect).not.toHaveBeenCalled();
  expect(view.deps.accept).not.toHaveBeenCalled();
});
it.each(['member', 'main'] as const)(
  'SPEC-065: inspect bằng body token, giữ đúng vai trò %s',
  async (role) => {
    const view = mount({
      inspect: vi.fn(async () => ({ ok: true as const, data: { kind: 'join_family' as const, role } })),
    });
    expect(view.model.phase).toBe('inspecting');
    await vi.waitFor(() => expect(view.render().phase).toBe('join_family'));
    expect(view.model.role).toBe(role);
    expect(view.deps.inspect).toHaveBeenCalledExactlyOnceWith({ token });
  },
);
it('SPEC-065: inspect lập nhà không tự gọi accept', async () => {
  const view = mount({ inspect: async () => ({ ok: true as const, data: { kind: 'found_family' } }) });
  await vi.waitFor(() => expect(view.render().phase).toBe('found_family'));
  expect(view.model.invitationToken).toBe(token);
  expect(view.deps.accept).not.toHaveBeenCalled();
});
it.each([
  ['ERR_NOT_FOUND', 'Lời mời không còn dùng được. Hãy nhờ người mời gửi link mới.', true],
  ['ERR_RATE_LIMITED', 'Bạn thử quá nhiều lần. Vui lòng thử lại sau.', false],
  ['NETWORK', 'Chưa thể kiểm tra lời mời. Vui lòng thử lại.', false],
] as const)('E27-AT-D1: inspect %s xoá token đúng chỗ và cho thử lại', async (code, message, cleared) => {
  const view = mount({ inspect: vi.fn(async () => ({ ok: false as const, code })) });
  await vi.waitFor(() => expect(view.render().phase).toBe('error'));
  expect(view.model.message).toBe(message);
  expect(view.model.canRetry).toBe(!cleared);
  expect(readPendingInvitation()).toBe(cleared ? null : token);
  await view.model.retry();
  expect(view.deps.inspect).toHaveBeenCalledTimes(cleared ? 1 : 2);
});
it('E27-AT-D1: nhận lời mời khoá bấm đúp, gửi CSRF và xoá token trước GET phiên', async () => {
  let release!: (value: { ok: true }) => void;
  const accept = vi.fn(
    () =>
      new Promise<{ ok: true }>((resolve) => {
        release = resolve;
      }),
  );
  const refresh = vi.fn(async () => {
    expect(readPendingInvitation()).toBeNull();
  });
  const view = mount({ accept, refresh });
  await vi.waitFor(() => expect(view.render().phase).toBe('join_family'));
  const first = view.model.accept();
  await view.model.accept();
  expect(view.render().busy).toBe(true);
  expect(accept).toHaveBeenCalledExactlyOnceWith({ token }, 'csrf');
  release({ ok: true });
  await first;
  expect(refresh).toHaveBeenCalledOnce();
});
it('E27-AT-D1: sau 204 GET lỗi chỉ thử lại GET, không POST lần hai', async () => {
  const refresh = vi.fn(async () => {
    throw new Error('Mất mạng');
  });
  const view = mount({ refresh });
  await vi.waitFor(() => expect(view.render().phase).toBe('join_family'));
  await view.model.accept();
  expect(view.render().message).toContain('Đã nhận lời mời');
  expect(view.model.accepted).toBe(true);
  await view.model.accept();
  expect(view.deps.accept).toHaveBeenCalledOnce();
  expect(refresh).toHaveBeenCalledTimes(2);
});
it.each(['ERR_NOT_FOUND', 'ERR_ACCOUNT_ALREADY_IN_FAMILY', 'ERR_DELETION_PENDING'])(
  'E27-AT-D1: accept %s xoá token và không gửi lại',
  async (code) => {
    const view = mount({ accept: vi.fn(async () => ({ ok: false as const, code })) });
    await vi.waitFor(() => expect(view.render().phase).toBe('join_family'));
    await view.model.accept();
    expect(view.render().phase).toBe('error');
    expect(readPendingInvitation()).toBeNull();
    await view.model.accept();
    expect(view.deps.accept).toHaveBeenCalledOnce();
  },
);
it.each(['ERR_LEGAL_ACCEPTANCE_REQUIRED', 'NETWORK', 'ERR_RATE_LIMITED'])(
  'E27-AT-D1: accept %s giữ token để tiếp tục',
  async (code) => {
    const view = mount({ accept: vi.fn(async () => ({ ok: false as const, code })) });
    await vi.waitFor(() => expect(view.render().phase).toBe('join_family'));
    await view.model.accept();
    expect(view.render().message).toBeTruthy();
    expect(readPendingInvitation()).toBe(token);
  },
);
it('E27-AT-D1: không nhận xoá token rồi về trang chủ', async () => {
  const view = mount();
  await view.model.decline();
  expect(readPendingInvitation()).toBeNull();
  expect(view.deps.leave).toHaveBeenCalledOnce();
});
it('E27-AT-D1: phản hồi inspect đến sau rời trang không xoá token', async () => {
  let release!: (value: { ok: false; code: string }) => void;
  mount({
    inspect: () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  });
  await Promise.resolve();
  harness.cleanups.forEach((cleanup) => cleanup());
  release({ ok: false as const, code: 'ERR_NOT_FOUND' });
  await Promise.resolve();
  expect(readPendingInvitation()).toBe(token);
});

it('E27-AT-D1: thiếu token kể cả phiên có nhà vẫn hướng dẫn mở lại link', () => {
  clearPendingInvitation();
  const view = mount({ hasFamily: true });
  expect(view.model.phase).toBe('missing');
  expect(view.model.message).toContain('Hãy mở lại link');
  expect(view.deps.inspect).not.toHaveBeenCalled();
});
