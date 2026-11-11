import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';
import { selfProfileKey } from '@src/features/selfProfile/application/selfProfileKey';
import { useAsNeededDoseMutation } from './useAsNeededDoseMutation';

const session: ProfileSession = {
  account: { id: 'a', displayName: 'An', isSystemAdmin: false, healthProfileId: 'p' },
  family: { id: 'f', name: 'Nhà' },
  role: 'main',
  csrfToken: 'csrf',
  features: { redactionSuggestions: false },
};
const keys = [
  ['medications', 'a', 'f', 'p', 'current'],
  ['as-needed-doses', 'a', 'f', 'p', 'c'],
  ['timeline', 'a', 'f', 'p', true],
  [...selfProfileKey(session), 'medications'],
  [...selfProfileKey(session), 'timeline'],
];
function setup(currentSession = session) {
  const client = new QueryClient();
  for (const key of [...keys, ['current-session'], ['medications', 'a', 'f', 'other']])
    client.setQueryData(key, []);
  let state: ReturnType<typeof useAsNeededDoseMutation> | undefined;
  function Probe() {
    state = useAsNeededDoseMutation(currentSession, 'p');
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  return { state: state!, client };
}
describe('Ghi nhật ký liều và làm mới dữ liệu', () => {
  it('TC-495/499: thành công làm mới đúng hồ sơ, danh mục và timeline tự xem', async () => {
    const { state, client } = setup();
    expect(await state.run(async () => undefined)).toBe(true);
    expect(keys.map((key) => client.getQueryState(key)?.isInvalidated)).toEqual(keys.map(() => true));
    expect(client.getQueryState(['medications', 'a', 'f', 'other'])?.isInvalidated).toBe(false);
  });
  it('TC-498: chặn bấm lặp và chặn member gọi thao tác ghi', async () => {
    const { state } = setup();
    let finish: () => void = () => undefined;
    const action = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const first = state.run(action);
    expect(await state.run(action)).toBe(false);
    finish();
    await first;
    expect(action).toHaveBeenCalledTimes(1);
    const member = setup({ ...session, role: 'member' });
    expect(await member.state.run(action)).toBe(false);
    expect(action).toHaveBeenCalledTimes(1);
  });
  it('TC-497: đợt không hợp lệ giữ form và làm mới dữ liệu; mất quyền đọc lại phiên', async () => {
    const { state, client } = setup();
    expect(
      await state.run(async () => {
        throw new MedicationRequestError('Đợt không hợp lệ', 422, 'ERR_VALIDATION');
      }),
    ).toBe(false);
    expect(client.getQueryState(keys[0]!)?.isInvalidated).toBe(true);
    expect(
      await state.run(async () => {
        throw new MedicationRequestError('Rút đồng thuận', 409, 'ERR_CONSENT_REQUIRED');
      }),
    ).toBe(false);
    expect(client.getQueryState(['current-session'])?.isInvalidated).toBe(true);
  });
});
