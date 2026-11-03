import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { selfProfileKey } from '@src/features/selfProfile/application/selfProfileKey';
import { profileDayRemindersKey } from './profileDayRemindersKey';
import type { DoseConfirmationRepository } from './ports';
import { useDoseConfirmation } from './useDoseConfirmation';

const session: ProfileSession = {
  account: { id: 'a', displayName: 'An', isSystemAdmin: false, healthProfileId: 'p' },
  family: { id: 'f', name: 'Nhà' },
  role: 'main',
  csrfToken: 'csrf',
};
const detailKey = ['my-reminder', 'r'];
const selfKey = [...selfProfileKey(session), 'reminders', '2026-11-02'];
const mainKey = [...profileDayRemindersKey(session), 'p', '2026-11-02'];
const unrelatedKey = [...selfProfileKey(session), 'medications', '2026-11-02'];
const sessionKey = ['current-session'];

function setup(repository: Partial<DoseConfirmationRepository>) {
  const client = new QueryClient();
  for (const key of [detailKey, selfKey, mainKey, unrelatedKey, sessionKey]) client.setQueryData(key, []);
  let state: ReturnType<typeof useDoseConfirmation> | undefined;
  function Probe() {
    state = useDoseConfirmation(repository as DoseConfirmationRepository, session, 'r');
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  const invalidated = (key: readonly unknown[]) => client.getQueryState(key)?.isInvalidated;
  return { state: state!, invalidated };
}

describe('Xác nhận và hủy "Đã dùng" (SPEC-046)', () => {
  it('TC-490: chặn bấm lặp khi đang gửi; gửi đúng lời nhắc và CSRF', async () => {
    let finish: () => void = () => undefined;
    const confirm = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    const undo = vi.fn();
    const { state } = setup({ confirm, undo });
    const first = state.confirm();
    await state.confirm();
    await state.undo();
    finish();
    await first;
    expect(confirm.mock.calls).toEqual([['r', 'csrf']]);
    expect(undo).not.toHaveBeenCalled();
  });
  it('TC-486: thành công làm mới trang lời nhắc và hai danh sách của ngày, không đụng mục khác', async () => {
    const { state, invalidated } = setup({ confirm: async () => undefined });
    await state.confirm();
    expect([detailKey, selfKey, mainKey].map(invalidated)).toEqual([true, true, true]);
    expect(invalidated(unrelatedKey)).toBe(false);
    expect(invalidated(sessionKey)).toBe(false);
  });
  it('TC-491: hủy gọi đúng lời nhắc và làm mới danh sách', async () => {
    const undo = vi.fn(async () => undefined);
    const { state, invalidated } = setup({ undo });
    await state.undo();
    expect(undo.mock.calls).toEqual([['r', 'csrf']]);
    expect(invalidated(mainKey)).toBe(true);
  });
  it('TC-489: API từ chối do qua ngày thì làm mới bản ghi để tải lại quyền', async () => {
    const { state, invalidated } = setup({
      confirm: async () => {
        throw new MedicationRequestError('Ngoài ngày', 422, 'ERR_VALIDATION');
      },
    });
    await state.confirm();
    expect(invalidated(detailKey)).toBe(true);
    expect(invalidated(sessionKey)).toBe(false);
  });
  it('TC-494: rút đồng thuận thì đọc lại phiên và hồ sơ', async () => {
    const { state, invalidated } = setup({
      confirm: async () => {
        throw new MedicationRequestError('Rút', 409, 'ERR_CONSENT_REQUIRED');
      },
    });
    await state.confirm();
    expect(invalidated(sessionKey)).toBe(true);
    expect(invalidated(mainKey)).toBe(true);
  });
  it('lỗi mạng giữ trạng thái đã biết, không làm mới', async () => {
    const { state, invalidated } = setup({
      confirm: async () => {
        throw new TypeError('Failed to fetch');
      },
    });
    await state.confirm();
    expect(invalidated(detailKey)).toBe(false);
    expect(invalidated(sessionKey)).toBe(false);
  });
});
