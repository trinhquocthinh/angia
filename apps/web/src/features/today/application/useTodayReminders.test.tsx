import type { SelfReminder } from '@angia/contracts';
import { QueryClient, QueryClientProvider, QueryObserver } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDoseConfirmation } from '@src/features/doseConfirmations/application/useDoseConfirmation';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import type { TodayRepository, TodayTarget } from './ports';
import { reminder, session } from './todayTestFixture.test-helper';
import { useTodayReminders } from './useTodayReminders';

const self: TodayTarget = { kind: 'self', profile: { id: 'p', consentStatus: 'confirmed' } };
const main: TodayTarget = {
  kind: 'profile',
  profile: { id: 'p', familyId: 'f', consentStatus: 'confirmed' },
};
const selfKey = ['profiles', 'a', 'f', 'self', 'p', 'reminders', '2026-11-11'];
const mainKey = ['profiles', 'a', 'f', 'day-reminders', 'p', '2026-11-11'];
const clients: QueryClient[] = [];

function setup(repository: TodayRepository, context = session) {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
  clients.push(client);
  function read(target: TodayTarget | null, current = context) {
    let query!: ReturnType<typeof useTodayReminders>;
    let action!: ReturnType<typeof useDoseConfirmation>;
    function Probe() {
      query = useTodayReminders(repository, current, target);
      action = useDoseConfirmation(repository, current, reminder.id);
      return null;
    }
    renderToStaticMarkup(
      <QueryClientProvider client={client}>
        <Probe />
      </QueryClientProvider>,
    );
    return { query, action };
  }
  return { client, read };
}

function repository(rows: SelfReminder[] = [reminder]): TodayRepository {
  return {
    listForSelf: async () => rows,
    listForProfile: async () => rows,
    confirm: async () => undefined,
    undo: async () => undefined,
  };
}

describe('Hook liều hôm nay (SPEC-079)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-10T17:30:00.000Z'));
  });
  afterEach(() => {
    for (const client of clients.splice(0)) client.clear();
    vi.useRealTimers();
  });

  it('TC-852: trả buổi đúng thứ tự và bỏ ngày khác, không đổi snapshot đầu vào', async () => {
    const rows: SelfReminder[] = [
      { ...reminder, slot: 'evening' },
      { ...reminder, slot: 'noon' },
      { ...reminder, date: '2026-11-10' },
      reminder,
      { ...reminder, slot: 'afternoon' },
    ];
    const { read } = setup(repository(rows));
    const result = await read(self).query.refetch();
    expect(result.data?.map((item) => item.slot)).toEqual(['morning', 'noon', 'afternoon', 'evening']);
    expect(result.data?.[0]).toEqual(reminder);
    expect(rows[0]?.slot).toBe('evening');
  });

  it('TC-852: chọn nguồn tự xem hoặc main đúng với hồ sơ đích', async () => {
    const { read } = setup({
      ...repository(),
      listForSelf: async () => [reminder],
      listForProfile: async (id) => [{ ...reminder, id }],
    });
    expect((await read(self).query.refetch()).data?.[0]?.id).toBe(reminder.id);
    expect((await read(main).query.refetch()).data?.[0]?.id).toBe('p');
  });

  it('TC-852: không đọc hoặc lộ cache khi thiếu gia đình, đồng thuận hay quyền hồ sơ', async () => {
    const fail = async (): Promise<SelfReminder[]> => {
      throw new Error('Không được đọc');
    };
    const { client, read } = setup({ ...repository(), listForSelf: fail, listForProfile: fail });
    client.setQueryData(selfKey, [reminder]);
    client.setQueryData(mainKey, [reminder]);
    const cases: [TodayTarget | null, ProfileSession][] = [
      [null, session],
      [self, { ...session, family: null }],
      [{ ...self, profile: { ...self.profile, consentStatus: 'withdrawn' } }, session],
      [{ ...self, profile: { ...self.profile, id: 'other' } }, session],
      [main, { ...session, role: 'member' }],
      [{ ...main, profile: { ...main.profile, familyId: 'other' } }, session],
    ];
    for (const [target, current] of cases) {
      const { query } = read(target, current);
      expect(query.enabled).toBe(false);
      expect(query.data).toBeUndefined();
      expect((await query.refetch()).error).toBeNull();
    }
  });

  it('TC-852: cache tách tài khoản, gia đình, hồ sơ và ngày Việt Nam', () => {
    const { client, read } = setup(repository());
    client.setQueryData(selfKey, [reminder]);
    client.setQueryData(mainKey, [reminder]);
    expect(read(self).query.data).toEqual([reminder]);
    expect(read(main).query.data).toEqual([reminder]);
    expect(
      read(self, { ...session, account: { ...session.account, id: 'other' } }).query.data,
    ).toBeUndefined();
    expect(read(self, { ...session, family: { id: 'other', name: 'Nhà khác' } }).query.data).toBeUndefined();
    expect(read({ ...main, profile: { ...main.profile, id: 'other' } }).query.data).toBeUndefined();
    vi.setSystemTime(new Date('2026-11-11T17:00:00.000Z'));
    expect(read(self).query.data).toBeUndefined();
    expect(read(main).query.data).toBeUndefined();
  });

  it.each([self, main])('TC-853: xác nhận đọc lại người và giờ máy chủ cho $kind', async (target) => {
    let rows = [reminder];
    const repo: TodayRepository = {
      ...repository(),
      listForSelf: async () => rows,
      listForProfile: async () => rows,
      confirm: async () => {
        rows = [
          {
            ...reminder,
            canConfirm: false,
            canUndo: true,
            confirmation: {
              reminderId: reminder.id,
              profileId: 'p',
              date: reminder.date,
              slot: 'morning',
              confirmedBy: { accountId: 'a', displayName: 'Mẹ' },
              confirmedAt: '2026-11-11T00:32:00.000Z',
            },
          },
        ];
      },
    };
    const { client, read } = setup(repo);
    await read(target).query.refetch();
    // Giữ query hoạt động như khi component được mount để invalidate phải chờ đọc lại.
    const query = client.getQueryCache().find({ queryKey: target.kind === 'self' ? selfKey : mainKey })!;
    const observer = new QueryObserver(client, { queryKey: query.queryKey, queryFn: query.options.queryFn! });
    const unsubscribe = observer.subscribe(() => undefined);
    try {
      await read(target).action.confirm();
      expect(read(target).query.data?.[0]?.confirmation).toMatchObject({
        confirmedBy: { displayName: 'Mẹ' },
        confirmedAt: '2026-11-11T00:32:00.000Z',
      });
      expect(read(target).query.data?.[0]?.canConfirm).toBe(false);
    } finally {
      unsubscribe();
    }
  });
});
