import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { PainIssueWriter } from './ports';
import { issue, profile, session } from '../test/painIssues.test-helper';
import { useNewPainIssue } from './useNewPainIssue';
import { PainJournalRequestError } from './PainJournalRequestError';
const body = { region: 'knee' as const, side: 'left' as const, firstEntry: { level: 6 } };
const detail = { ...issue, entries: [], exercises: [], statusEvents: [] };
function probe(api: PainIssueWriter, current = session, target = profile, scope: 'main' | 'self' = 'main') {
  const client = new QueryClient();
  let state: ReturnType<typeof useNewPainIssue>;
  function Probe() {
    state = useNewPainIssue(api, current, target, scope);
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  return {
    client,
    get state() {
      return state!;
    },
  };
}
describe('E21-S2-T2 — quyền ghi và cache', () => {
  it('chặn ghi trái quyền, khác gia đình, thiếu CSRF và thiếu đồng thuận', async () => {
    const create = vi.fn(async () => detail);
    const cases = [
      probe({ create }, { ...session, role: 'member' }),
      probe({ create }, { ...session, csrfToken: '' }),
      probe({ create }, session, { ...profile, familyId: 'other' }),
      probe({ create }, session, { ...profile, consentStatus: 'withdrawn' }),
      probe({ create }, { ...session, family: null }),
      probe({ create }, session, { ...profile, id: 'other' }, 'self'),
    ];
    for (const { state, client } of cases) {
      expect(await state.save(body)).toBeNull();
      client.clear();
    }
    expect(create).not.toHaveBeenCalled();
  });
  it('ghi self bằng hồ sơ phiên, làm mới cả cache main/self cùng hồ sơ', async () => {
    const create = vi.fn(async () => detail);
    const { state, client } = probe({ create }, { ...session, role: 'member' }, profile, 'self');
    const main = ['profiles', 'a', 'f', 'pain', 'main', 'p', 'all'];
    const self = ['profiles', 'a', 'f', 'pain', 'self', 'p', 'tracking'];
    const other = ['profiles', 'a', 'f', 'pain', 'main', 'q', 'all'];
    for (const key of [main, self, other]) client.setQueryData(key, {});
    expect(await state.save(body)).toEqual({ kind: 'created', issueId: issue.id });
    expect(create).toHaveBeenCalledWith(null, body, 'csrf', expect.any(AbortSignal));
    expect(client.getQueryState(main)?.isInvalidated).toBe(true);
    expect(client.getQueryState(self)?.isInvalidated).toBe(true);
    expect(client.getQueryState(other)?.isInvalidated).toBe(false);
    client.clear();
  });
  it('chặn gửi lặp trong khi lưu', async () => {
    let finish!: (value: typeof detail) => void;
    const create = vi.fn(
      () =>
        new Promise<typeof detail>((resolve) => {
          finish = resolve;
        }),
    );
    const { state, client } = probe({ create });
    const first = state.save(body);
    expect(await state.save(body)).toBeNull();
    finish(detail);
    await first;
    expect(create).toHaveBeenCalledTimes(1);
    client.clear();
  });
  it('lỗi đồng thuận làm mới phiên và danh sách hồ sơ', async () => {
    const { state, client } = probe({
      create: async () => {
        throw new PainJournalRequestError('Cần đồng thuận', 409, 'ERR_CONSENT_REQUIRED');
      },
    });
    client.setQueryData(['current-session'], session);
    expect(await state.save(body)).toBeNull();
    expect(client.getQueryState(['current-session'])?.isInvalidated).toBe(true);
    client.clear();
  });
});
