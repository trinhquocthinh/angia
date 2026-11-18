import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { useCurrentInvitationModel } from './useCurrentInvitationModel';
const cache = vi.hoisted(() => new Map<string, unknown>());
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({ data: { items: [] } })),
  useQueryClient: () => ({
    getQueryData: (key: unknown) => cache.get(JSON.stringify(key)),
    setQueryData: (key: unknown, update: (value: unknown) => unknown) =>
      cache.set(JSON.stringify(key), update(cache.get(JSON.stringify(key)))),
  }),
}));
it('TC-773: tạo hai vai trò riêng, tạo lặp dùng mã trong cache, không giữ bí mật browser storage', async () => {
  cache.clear();
  const create = vi.fn(async ({ role }: { role: 'main' | 'member' }) => ({
    ok: true as const,
    value: {
      invitationId: role,
      code: role,
      link: 'https://example.test',
      expiresAt: new Date(Date.now() + 604800000).toISOString(),
    },
  }));
  let model!: ReturnType<typeof useCurrentInvitationModel>;
  function Probe() {
    model = useCurrentInvitationModel(
      { current: async () => ({ ok: true, value: { items: [] } }), create },
      'csrf',
      'scope',
    );
    return null;
  }
  renderToStaticMarkup(<Probe />);
  await model.create('member');
  await model.create('main');
  await model.create('member');
  expect(create).toHaveBeenCalledTimes(2);
  expect(cache.size).toBe(1);
});
