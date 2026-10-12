import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { useSelfReportedCourse } from './useSelfReportedCourse';
import type { MedicationRepository } from './ports';
const session: ProfileSession = {
  account: { id: 'a', displayName: 'An', isSystemAdmin: false, healthProfileId: null },
  family: { id: 'f', name: 'Nhà' },
  role: 'main',
  csrfToken: 'csrf',
};

function mount(client: QueryClient, repository: MedicationRepository, context = session) {
  let state: ReturnType<typeof useSelfReportedCourse> | undefined;
  function Probe() {
    state = useSelfReportedCourse(repository, context, 'p');
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  return state!;
}
describe('Lưu thuốc bổ từ sheet', () => {
  it('TC-049: giữ snapshot, chặn gửi lặp và chỉ làm mới cache đúng gia đình/hồ sơ', async () => {
    const client = new QueryClient();
    const key = ['medications', 'a', 'f', 'p'];
    const otherKey = ['medications', 'a', 'khác', 'p'];
    client.setQueryData(key, []);
    client.setQueryData(otherKey, []);
    const sent: unknown[] = [];
    let finish: () => void = () => undefined;
    const wait = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const repository: MedicationRepository = {
      create: async (id, body, csrf) => {
        sent.push({ id, body, csrf });
        await wait;
        return {
          id: 'new',
          healthProfileId: id,
          prescriptionItemId: null,
          source: 'self_reported',
          name: body.name,
          strength: body.strength ?? null,
          quantityPerDose: 1,
          doseUnit: 'viên',
          slots: ['morning'],
          startDate: '2026-10-01',
          endDate: null,
          status: 'active',
        };
      },
    };
    const state = mount(client, repository);
    const draft = {
      name: 'Canxi',
      quantityPerDose: 1,
      doseUnit: 'viên',
      slots: ['morning'] as const,
      startDate: '2026-10-01',
    };
    const input = { ...draft, slots: [...draft.slots] };
    const first = state.submit(input);
    input.name = 'Đã sửa';
    input.slots.push('morning');
    await state.submit({ ...draft, name: 'Gửi lần hai', slots: [...draft.slots] });
    finish();
    await first;
    expect(sent).toEqual([{ id: 'p', csrf: 'csrf', body: draft }]);
    expect(client.getQueryState(key)?.isInvalidated).toBe(true);
    expect(client.getQueryState(otherKey)?.isInvalidated).toBe(false);
    client.clear();
  });
  it('TC-049: member không gửi lệnh, kể cả system admin', async () => {
    const client = new QueryClient();
    let sent = false;
    const repository: MedicationRepository = {
      create: async () => {
        sent = true;
        throw new Error('Không gọi');
      },
    };
    const state = mount(client, repository, { ...session, role: 'member' });
    await state.submit({ name: 'Canxi', doseUnit: 'viên', startDate: '2026-10-01' });
    expect(sent).toBe(false);
    client.clear();
  });
});
