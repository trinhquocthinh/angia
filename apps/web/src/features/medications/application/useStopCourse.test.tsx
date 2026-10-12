import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { useStopCourse } from './useStopCourse';
import type { MedicationStoppingRepository } from './stoppingPorts';
import { MedicationRequestError } from './MedicationRequestError';
const session: ProfileSession = {
  account: { id: 'a', displayName: 'An', isSystemAdmin: false, healthProfileId: null },
  family: { id: 'f', name: 'Nhà' },
  role: 'main',
  csrfToken: 'csrf',
};
function mount(client: QueryClient, repository: MedicationStoppingRepository, context = session) {
  let state: ReturnType<typeof useStopCourse> | undefined;
  function Probe() {
    state = useStopCourse(repository, context, 'p');
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  return state!;
}
describe('Ghi nhận dừng từ sheet', () => {
  it('TC-051: chặn gửi lặp; gửi đúng ID, ngày, CSRF và chỉ làm mới cache hồ sơ', async () => {
    const client = new QueryClient();
    const key = ['medications', 'a', 'f', 'p'];
    const other = ['medications', 'a', 'other', 'p'];
    client.setQueryData(key, []);
    client.setQueryData(other, []);
    let finish: () => void = () => undefined;
    const wait = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const sent: unknown[] = [];
    const repository: MedicationStoppingRepository = {
      list: async () => ({ today: '2026-10-11', courses: [] }),
      stop: async (id, courseId, body, csrf) => {
        sent.push({ id, courseId, body, csrf });
        await wait;
        return {
          id: courseId,
          healthProfileId: id,
          prescriptionItemId: null,
          source: 'self_reported',
          name: 'Canxi',
          strength: null,
          quantityPerDose: 1,
          doseUnit: 'viên',
          slots: ['morning'],
          startDate: '2026-10-01',
          endDate: '2026-10-09',
          status: 'stopped',
        };
      },
    };
    const state = mount(client, repository);
    const first = state.submit('c', '2026-10-10');
    await state.submit('other', '2026-10-11');
    finish();
    await first;
    expect(sent).toEqual([{ id: 'p', courseId: 'c', body: { stopDate: '2026-10-10' }, csrf: 'csrf' }]);
    expect(client.getQueryState(key)?.isInvalidated).toBe(true);
    expect(client.getQueryState(other)?.isInvalidated).toBe(false);
    client.clear();
  });
  it('TC-052: phiên member không ghi; trạng thái cũ làm mới danh sách', async () => {
    const client = new QueryClient();
    const key = ['medications', 'a', 'f', 'p'];
    client.setQueryData(key, []);
    let calls = 0;
    const repository: MedicationStoppingRepository = {
      list: async () => ({ today: '2026-10-11', courses: [] }),
      stop: async () => {
        calls++;
        throw new MedicationRequestError('Đợt đã thay đổi', 409, 'ERR_INVALID_STATE_TRANSITION');
      },
    };
    await mount(client, repository, { ...session, role: 'member' }).submit('c', '2026-10-10');
    expect(calls).toBe(0);
    await mount(client, repository).submit('c', '2026-10-10');
    expect(client.getQueryState(key)?.isInvalidated).toBe(true);
    client.clear();
  });
});
