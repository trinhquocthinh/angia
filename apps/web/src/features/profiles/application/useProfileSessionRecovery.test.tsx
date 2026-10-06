import { useEffect } from 'react';
import type * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProfileRequestError } from './ProfileRequestError';
import { useProfileSessionRecovery } from './useProfileSessionRecovery';
vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal<typeof React>()),
  useEffect: vi.fn(),
}));
afterEach(() => vi.clearAllMocks());
function recover(error: Error | null) {
  const effects: Array<() => void | (() => void)> = [];
  vi.mocked(useEffect).mockImplementation((effect) => {
    effects.push(effect);
  });
  const client = new QueryClient();
  client.setQueryData(['current-session'], { csrfToken: 'csrf' });
  function Probe() {
    useProfileSessionRecovery(error);
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  for (const effect of effects) effect()?.();
  const invalidated = client.getQueryState(['current-session'])?.isInvalidated;
  client.clear();
  return invalidated;
}
describe('Làm mới phiên khi quyền truy cập hồ sơ thay đổi', () => {
  it.each([401, 403])('HTTP %s: yêu cầu kiểm tra lại phiên', (status) => {
    expect(recover(new ProfileRequestError('Không có quyền', status))).toBe(true);
  });
  it.each([409, 500])('HTTP %s: giữ phiên khi lỗi không liên quan quyền', (status) => {
    expect(recover(new ProfileRequestError('Lỗi yêu cầu', status))).toBe(false);
  });
  it('không có lỗi hoặc lỗi mạng không đánh dấu phiên cần tải lại', () => {
    expect(recover(null)).toBe(false);
    expect(recover(new Error('Mạng gián đoạn'))).toBe(false);
  });
});
