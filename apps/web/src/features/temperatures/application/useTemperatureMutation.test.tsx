import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';
import { selfProfileKey } from '@src/features/selfProfile/application/selfProfileKey';
import { useTemperatureMutation } from './useTemperatureMutation';

const session: ProfileSession = {
  account: { id: 'a', displayName: 'An', isSystemAdmin: false, healthProfileId: 'p' },
  family: { id: 'f', name: 'Nhà' },
  role: 'main',
  csrfToken: 'csrf',
};
const keys = [
  ['temperatures', 'a', 'f', 'p'],
  ['timeline', 'a', 'f', 'p'],
  [...selfProfileKey(session), 'temperatures'],
  [...selfProfileKey(session), 'timeline'],
];
function setup(current = session) {
  const client = new QueryClient();
  for (const key of [...keys, ['current-session'], ['temperatures', 'a', 'f', 'other']])
    client.setQueryData(key, []);
  let state: ReturnType<typeof useTemperatureMutation> | undefined;
  function Probe() {
    state = useTemperatureMutation(current, 'p');
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  return { state: state!, client };
}
describe('Thao tác nhiệt độ', () => {
  it('TC-500: lưu/xóa làm mới danh sách, timeline main/self của đúng hồ sơ', async () => {
    const { state, client } = setup();
    expect(await state.run(async () => undefined)).toBe('saved');
    expect(keys.map((key) => client.getQueryState(key)?.isInvalidated)).toEqual(keys.map(() => true));
    expect(client.getQueryState(['temperatures', 'a', 'f', 'other'])?.isInvalidated).toBe(false);
  });
  it('TC-501: yêu cầu xác nhận không bị coi là đã lưu; mất đồng thuận đọc lại phiên', async () => {
    const { state, client } = setup();
    expect(
      await state.run(async () => {
        throw new MedicationRequestError('Xác nhận', 422, 'ERR_OUT_OF_RANGE_UNCONFIRMED');
      }),
    ).toBe('confirm');
    expect(client.getQueryState(keys[0]!)?.isInvalidated).toBe(false);
    expect(
      await state.run(async () => {
        throw new MedicationRequestError('Đồng thuận', 409, 'ERR_CONSENT_REQUIRED');
      }),
    ).toBe('failed');
    expect(client.getQueryState(['current-session'])?.isInvalidated).toBe(true);
  });
  it('TC-500: chặn gửi lặp và member ghi', async () => {
    let finish: () => void = () => undefined;
    const action = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const { state } = setup();
    const first = state.run(action);
    expect(await state.run(action)).toBe('failed');
    finish();
    await first;
    expect(await setup({ ...session, role: 'member' }).state.run(action)).toBe('failed');
    expect(action).toHaveBeenCalledTimes(1);
  });
});
