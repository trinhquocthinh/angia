import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import type { RegistrationSwitchRepository } from './ports';
import { AdminRequestError } from './AdminRequestError';
import { useRegistrationSwitch } from './useRegistrationSwitch';

function harness(csrf: string | null = 'csrf') {
  const client = new QueryClient();
  client.setQueryData(['current-session'], { csrfToken: 'csrf' });
  client.setQueryData(['admin', 'registration-switch'], { registrationOpen: true });
  const repository: RegistrationSwitchRepository = {
    get: vi.fn(async () => ({ registrationOpen: true })),
    set: vi.fn(async (open) => ({ registrationOpen: open })),
  };
  let state!: ReturnType<typeof useRegistrationSwitch>;
  function Probe() {
    state = useRegistrationSwitch(repository, csrf);
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  return { client, repository, state };
}
it('TC-832/833: đọc giá trị bật trong cache, chỉ cập nhật giá trị khi lưu thành công', async () => {
  const { client, repository, state } = harness();
  try {
    expect(state.registration.data).toEqual({ registrationOpen: true });
    await state.save.mutateAsync(false);
    expect(client.getQueryData(['admin', 'registration-switch'])).toEqual({ registrationOpen: false });
    await state.save.mutateAsync(true);
    expect(client.getQueryData(['admin', 'registration-switch'])).toEqual({ registrationOpen: true });
    expect(repository.set).toHaveBeenNthCalledWith(1, false, 'csrf');
    expect(repository.set).toHaveBeenNthCalledWith(2, true, 'csrf');
    expect(client.getQueryState(['current-session'])?.isInvalidated).toBe(false);
  } finally {
    client.clear();
  }
});
it.each([401, 403, 500])('TC-834: lưu lỗi %s giữ giá trị cũ, lỗi quyền làm mới phiên', async (status) => {
  const { client, repository, state } = harness();
  const error = new AdminRequestError(status === 403 ? 'ERR_FORBIDDEN' : 'ERR_INTERNAL', status);
  vi.mocked(repository.set).mockRejectedValue(error);
  try {
    await expect(state.save.mutateAsync(false)).rejects.toBe(error);
    expect(client.getQueryData(['admin', 'registration-switch'])).toEqual({ registrationOpen: true });
    expect(client.getQueryState(['current-session'])?.isInvalidated).toBe(status !== 500);
  } finally {
    client.clear();
  }
});
it('TC-834: không có CSRF không đọc hoặc gửi lệnh thay đổi', async () => {
  const { client, repository, state } = harness(null);
  try {
    expect(state.registration.fetchStatus).toBe('idle');
    await expect(state.save.mutateAsync(false)).rejects.toMatchObject({ status: 401 });
    expect(repository.get).not.toHaveBeenCalled();
    expect(repository.set).not.toHaveBeenCalled();
    expect(client.getQueryState(['current-session'])?.isInvalidated).toBe(true);
  } finally {
    client.clear();
  }
});
