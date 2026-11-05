import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import { useSetRevisitDate } from './useSetRevisitDate';
const session = {
  account: { id: 'a' },
  family: { id: 'f' },
  role: 'main',
  csrfToken: 'csrf',
} as ProfileSession;
const profile = { id: 'p', familyId: 'f', consentStatus: 'confirmed' } as HealthProfile;
const prescription = { id: 'rx', issuedDate: '2026-10-01', facility: null };
function mount(
  context = session,
  item = profile,
  setDate = vi.fn(async (_p: string, _r: string, revisitDate: string | null, _c: string) => ({
    revisitDate,
  })),
) {
  const client = new QueryClient();
  let hook: ReturnType<typeof useSetRevisitDate>;
  function Probe() {
    hook = useSetRevisitDate({ setDate }, context, item, prescription);
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  return { client, hook: hook!, setDate };
}
describe('TC-474 — sửa ngày hẹn và đồng bộ cache', () => {
  it('gửi null với CSRF và làm mới đúng scope, gồm trang lời nhắc', async () => {
    const { client, hook, setDate } = mount();
    const keys = [
      ['revisits', 'a', 'f', 'p'],
      ['documents', 'a', 'f', 'p'],
      ['my-revisit-reminder', 'a', 'f', 'id'],
      ['prescriptions', 'a', 'f', 'p', 'list'],
      ['prescriptions', 'a', 'f', 'p', 'detail', 'rx'],
    ];
    const other = ['revisits', 'other', 'f', 'p'];
    for (const key of [...keys, other]) client.setQueryData(key, []);
    expect(await hook.save('')).toBe(true);
    expect(setDate).toHaveBeenCalledWith('p', 'rx', null, 'csrf');
    expect(keys.map((key) => client.getQueryState(key)?.isInvalidated)).toEqual([
      true,
      true,
      true,
      true,
      true,
    ]);
    expect(client.getQueryState(other)?.isInvalidated).toBe(false);
    client.clear();
  });
  it.each([
    { ...session, role: 'member' as const },
    { ...session, csrfToken: '' },
    { ...session, family: { id: 'other', name: 'Khác' } },
  ])('phiên không đủ quyền không gửi', async (context) => {
    const { client, hook, setDate } = mount(context);
    expect(await hook.save('2026-11-20')).toBe(false);
    expect(setDate).not.toHaveBeenCalled();
    client.clear();
  });
  it('ngày sai hoặc hồ sơ rút đồng thuận không gửi', async () => {
    const { client, hook, setDate } = mount();
    expect(await hook.save('2026-09-01')).toBe(false);
    expect(setDate).not.toHaveBeenCalled();
    client.clear();
    const withdrawn = mount(session, { ...profile, consentStatus: 'withdrawn' });
    expect(await withdrawn.hook.save('')).toBe(false);
    expect(withdrawn.setDate).not.toHaveBeenCalled();
    withdrawn.client.clear();
  });
  it('chặn gửi lặp và giữ cache nếu PUT thất bại', async () => {
    let reject!: (reason: Error) => void;
    const save = vi.fn(
      () =>
        new Promise<{ revisitDate: null }>((_resolve, fail) => {
          reject = fail;
        }),
    );
    const { client, hook } = mount(session, profile, save);
    client.setQueryData(['revisits', 'a', 'f', 'p'], ['cũ']);
    const first = hook.save('');
    expect(await hook.save('')).toBe(false);
    reject(new Error('mạng'));
    expect(await first).toBe(false);
    expect(client.getQueryData(['revisits', 'a', 'f', 'p'])).toEqual(['cũ']);
    expect(save).toHaveBeenCalledTimes(1);
    client.clear();
  });
});
