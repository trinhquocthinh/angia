import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { AdherenceRequestError } from './AdherenceRequestError';
import type { AdherencePeriod, AdherenceRepository } from './ports';
import { useRecordAdherence } from './useRecordAdherence';

const session: ProfileSession = {
  account: { id: 'a', displayName: 'An', isSystemAdmin: false, healthProfileId: null },
  family: { id: 'f', name: 'Nhà' },
  role: 'main',
  csrfToken: 'csrf',
};
const saved: AdherencePeriod = {
  id: 'n',
  healthProfileId: 'p',
  medicationName: 'Amlodipin',
  status: 'stopped',
  fromDate: '2026-10-10',
  toDate: null,
};
const request = { medicationName: 'Amlodipin', status: 'stopped', fromDate: '2026-10-10' } as const;

function mount(client: QueryClient, repository: AdherenceRepository) {
  let state: ReturnType<typeof useRecordAdherence> | undefined;
  function Probe() {
    state = useRecordAdherence(repository, session, 'p');
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  return state!;
}
const repositoryWith = (record: AdherenceRepository['record']): AdherenceRepository => ({
  list: async () => ({ today: '2026-10-13', periods: [] }),
  record,
});

describe('TC-267 lưu giai đoạn từ Bottom Sheet', () => {
  it('gửi CSRF, làm mới biểu đồ và danh sách giai đoạn của đúng hồ sơ, báo thuốc vừa lưu', async () => {
    const client = new QueryClient();
    const keys = [
      ['measurements', 'a', 'f', 'p', 'blood_pressure', 'series'],
      ['adherence', 'a', 'f', 'p'],
      ['measurements', 'a', 'f', 'khác'],
    ];
    for (const key of keys) client.setQueryData(key, {});
    const sent: unknown[] = [];
    const savedNames: string[] = [];
    const state = mount(
      client,
      repositoryWith(async (...args) => {
        sent.push(args);
        return saved;
      }),
    );
    expect(await state.submit(request, (period) => savedNames.push(period.medicationName))).toBe(true);
    expect(sent).toEqual([['p', request, 'csrf']]);
    expect(keys.map((key) => client.getQueryState(key)?.isInvalidated)).toEqual([true, true, false]);
    expect(savedNames).toEqual(['Amlodipin']);
  });

  it('lỗi API giữ thông điệp; lỗi không rõ → thông điệp chung', async () => {
    const failing = mount(
      new QueryClient(),
      repositoryWith(async () => {
        throw new AdherenceRequestError('Mốc phải sau giai đoạn trước.', 422, 'ERR_VALIDATION');
      }),
    );
    expect(await failing.submit(request, () => undefined)).toBe(false);
    const broken = mount(
      new QueryClient(),
      repositoryWith(async () => {
        throw new TypeError('network');
      }),
    );
    expect(await broken.submit(request, () => undefined)).toBe(false);
  });
});
