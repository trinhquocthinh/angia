import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { MedicationStoppingRepository } from '@src/features/medications/application/stoppingPorts';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { useStopMatchingCourses } from './useStopMatchingCourses';

const session: ProfileSession = {
  account: { id: 'a', displayName: 'An', isSystemAdmin: false, healthProfileId: null },
  family: { id: 'f', name: 'Nhà' },
  role: 'main',
  csrfToken: 'csrf',
};

function mount(client: QueryClient, stop: MedicationStoppingRepository['stop']) {
  let state: ReturnType<typeof useStopMatchingCourses> | undefined;
  function Probe() {
    state = useStopMatchingCourses(
      { list: async () => ({ today: '2026-10-16', courses: [] }), stop },
      session,
      'p',
    );
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  return state!;
}

describe('Dừng các đợt trùng tên từ mốc ngưng thực tế', () => {
  it('dừng lần lượt từng đợt với cùng ngày dừng, kèm CSRF; làm mới danh mục thuốc của đúng hồ sơ', async () => {
    const client = new QueryClient();
    const keys = [
      ['medications', 'a', 'f', 'p', 'current'],
      ['medications', 'a', 'f', 'khác'],
    ];
    for (const key of keys) client.setQueryData(key, {});
    const sent: unknown[] = [];
    const state = mount(client, async (...args) => {
      sent.push(args);
      return {} as never;
    });
    expect(await state.submit(['c1', 'c2'], '2026-10-16')).toBe(true);
    expect(sent).toEqual([
      ['p', 'c1', { stopDate: '2026-10-16' }, 'csrf'],
      ['p', 'c2', { stopDate: '2026-10-16' }, 'csrf'],
    ]);
    expect(keys.map((key) => client.getQueryState(key)?.isInvalidated)).toEqual([true, false]);
  });

  it('lỗi dừng → báo thất bại', async () => {
    const state = mount(new QueryClient(), async () => {
      throw new TypeError('network');
    });
    expect(await state.submit(['c1'], '2026-10-16')).toBe(false);
  });
});
