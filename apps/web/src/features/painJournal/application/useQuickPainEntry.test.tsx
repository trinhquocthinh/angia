import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { issue, profile, session } from '../test/painIssues.test-helper';
import type { PainEntryWriter } from './ports';
import { useQuickPainEntry } from './useQuickPainEntry';
import { PainJournalRequestError } from './PainJournalRequestError';

const entry = {
  id: issue.id,
  level: 6,
  recordedAt: issue.updatedAt,
  note: null,
  createdBy: null,
  updatedBy: null,
  updatedAt: issue.updatedAt,
};
function probe(api: PainEntryWriter, current = session, target = profile, scope: 'main' | 'self' = 'main') {
  const client = new QueryClient();
  let state!: ReturnType<typeof useQuickPainEntry>;
  function Probe() {
    state = useQuickPainEntry(api, current, target, scope, issue.id);
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  return { state, client };
}
it('TC-723 — chặn ghi thiếu quyền, đồng thuận hoặc CSRF', async () => {
  const record = vi.fn(async () => entry);
  const api = { record, reopen: vi.fn(async () => issue) };
  for (const { state, client } of [
    probe(api, { ...session, role: 'member' }),
    probe(api, { ...session, csrfToken: '' }),
    probe(api, session, { ...profile, familyId: 'other' }),
    probe(api, session, { ...profile, consentStatus: 'withdrawn' }),
    probe(api, session, { ...profile, id: 'other' }, 'self'),
  ]) {
    expect(await state.save({ level: 6 })).toBeNull();
    client.clear();
  }
  expect(record).not.toHaveBeenCalled();
});
it('TC-723 — ghi self và làm mới đúng cache, không làm mới hồ sơ khác', async () => {
  const record = vi.fn(async () => entry);
  const { state, client } = probe(
    { record, reopen: async () => issue },
    { ...session, role: 'member' },
    profile,
    'self',
  );
  const key = ['profiles', 'a', 'f', 'pain', 'main', 'p', 'all'];
  const other = ['profiles', 'a', 'f', 'pain', 'main', 'q', 'all'];
  client.setQueryData(key, {});
  client.setQueryData(other, {});
  expect(await state.save({ level: 6 })).toEqual(entry);
  expect(record).toHaveBeenCalledWith(null, issue.id, { level: 6 }, 'csrf', expect.any(AbortSignal));
  expect(client.getQueryState(key)?.isInvalidated).toBe(true);
  expect(client.getQueryState(other)?.isInvalidated).toBe(false);
  client.clear();
});
it('TC-723 — chặn gửi trùng khi request chưa xong', async () => {
  let finish!: (value: typeof entry) => void;
  const record = vi.fn(
    () =>
      new Promise<typeof entry>((resolve) => {
        finish = resolve;
      }),
  );
  const { state, client } = probe({ record, reopen: async () => issue });
  const first = state.save({ level: 6 });
  expect(await state.save({ level: 6 })).toBeNull();
  finish(entry);
  await first;
  expect(record).toHaveBeenCalledTimes(1);
  client.clear();
});
it('TC-723 — không tự mở lại khi ghi gặp vấn đề đã khỏi', async () => {
  const reopen = vi.fn(async () => issue);
  const { state, client } = probe({
    reopen,
    record: async () => {
      throw new PainJournalRequestError('Đã khỏi', 409, 'ERR_INVALID_STATE_TRANSITION');
    },
  });
  expect(await state.save({ level: 6 })).toBeNull();
  expect(reopen).not.toHaveBeenCalled();
  client.clear();
});

it('TC-723 — mở lại thành công rồi mới ghi, không ghi khi mở lại thất bại', async () => {
  const calls: string[] = [];
  const api = {
    reopen: async () => {
      calls.push('reopen');
      return issue;
    },
    record: async () => {
      calls.push('record');
      return entry;
    },
  };
  const { state, client } = probe(api);
  expect(await state.save({ level: 6 }, true)).toEqual(entry);
  expect(calls).toEqual(['reopen', 'record']);
  client.clear();
  const record = vi.fn(async () => entry);
  const failed = probe({
    record,
    reopen: async () => {
      throw new PainJournalRequestError('Trùng vùng', 409, 'ERR_PAIN_ISSUE_EXISTS', issue.id);
    },
  });
  expect(await failed.state.save({ level: 6 }, true)).toBeNull();
  expect(record).not.toHaveBeenCalled();
  failed.client.clear();
});

it('TC-723 — lỗi đồng thuận làm mới quyền, lỗi mạng cho phép thử lại', async () => {
  let attempt = 0;
  const { state, client } = probe({
    reopen: async () => issue,
    record: async () => {
      attempt++;
      if (attempt === 1) throw new PainJournalRequestError('Cần đồng thuận', 409, 'ERR_CONSENT_REQUIRED');
      if (attempt === 2) throw new Error('offline');
      return entry;
    },
  });
  client.setQueryData(['current-session'], session);
  expect(await state.save({ level: 6 })).toBeNull();
  expect(client.getQueryState(['current-session'])?.isInvalidated).toBe(true);
  expect(await state.save({ level: 6 })).toBeNull();
  expect(await state.save({ level: 6 })).toEqual(entry);
  client.clear();
});
