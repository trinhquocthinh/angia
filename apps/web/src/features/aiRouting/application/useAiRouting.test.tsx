import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_AI_ROUTING_SETTINGS, type AiRoutingView } from '@angia/contracts';
import { AdminRequestError } from '@src/features/family/application/AdminRequestError';
import { useAiRouting } from './useAiRouting';
import type { AiRoutingRepository } from './ports';

const initial: AiRoutingView = {
  version: 0,
  settings: DEFAULT_AI_ROUTING_SETTINGS,
  updatedAt: null,
  updatedBy: null,
};
const input = {
  expectedVersion: 0,
  settings: { ...DEFAULT_AI_ROUTING_SETTINGS, selectedProvider: 'openrouter' as const },
};
function harness(csrf: string | null = 'csrf', account: string | null = 'admin-a') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  client.setQueryData(['admin', 'ai-routing', 'admin-a'], initial);
  client.setQueryData(['current-session'], { csrfToken: csrf });
  const repository: AiRoutingRepository = {
    get: vi.fn<AiRoutingRepository['get']>().mockResolvedValue(initial),
    save: vi
      .fn<AiRoutingRepository['save']>()
      .mockResolvedValue({ ...initial, version: 1, settings: input.settings }),
  };
  let state: ReturnType<typeof useAiRouting> | undefined;
  function Probe() {
    state = useAiRouting(repository, csrf, account);
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  return { client, repository, state: state! };
}
describe('Luồng cache và mutation cấu hình OCR', () => {
  it('TC-510: không tải hoặc ghi khi thiếu phiên admin', async () => {
    const h = harness(null, null);
    expect(h.repository.get).not.toHaveBeenCalled();
    await expect(h.state.save.mutateAsync(input)).rejects.toMatchObject({ code: 'ERR_UNAUTHENTICATED' });
    expect(h.repository.save).not.toHaveBeenCalled();
    h.client.clear();
  });
  it('TC-514: lưu chỉ cập nhật cache của tài khoản bắt đầu thao tác', async () => {
    const h = harness();
    h.client.setQueryData(['admin', 'ai-routing', 'admin-b'], { ...initial, version: 8 });
    const saved = await h.state.save.mutateAsync(input);
    expect(h.repository.save).toHaveBeenCalledWith(input, 'csrf');
    expect(h.client.getQueryData(['admin', 'ai-routing', 'admin-a'])).toEqual(saved);
    expect(h.client.getQueryData(['admin', 'ai-routing', 'admin-b'])).toMatchObject({ version: 8 });
    h.client.clear();
  });
  it('TC-511: GET cũ về sau PUT thành công không ghi đè cache mới', async () => {
    const h = harness();
    let resolveGet!: (view: AiRoutingView) => void;
    const delayed = new Promise<AiRoutingView>((resolve) => {
      resolveGet = resolve;
    });
    const background = h.client
      .fetchQuery({ queryKey: ['admin', 'ai-routing', 'admin-a'], staleTime: 0, queryFn: () => delayed })
      .catch(() => undefined);
    const saved = await h.state.save.mutateAsync(input);
    resolveGet(initial);
    await background;
    expect(h.client.getQueryData(['admin', 'ai-routing', 'admin-a'])).toEqual(saved);
    h.client.clear();
  });
  it('TC-511: 409 không retry, không sửa version cache hoặc tự GET bản mới', async () => {
    const h = harness();
    vi.mocked(h.repository.save).mockRejectedValue(new AdminRequestError('ERR_AI_ROUTING_CONFLICT', 409));
    await expect(h.state.save.mutateAsync(input)).rejects.toMatchObject({ status: 409 });
    expect(h.repository.save).toHaveBeenCalledTimes(1);
    expect(h.repository.get).not.toHaveBeenCalled();
    expect(h.client.getQueryData(['admin', 'ai-routing', 'admin-a'])).toEqual(initial);
    h.client.clear();
  });
  it.each([401, 403])('TC-510: lỗi mutation %s làm mới phiên hiện tại', async (status) => {
    const h = harness();
    vi.mocked(h.repository.save).mockRejectedValue(new AdminRequestError('ERR_FORBIDDEN', status));
    await expect(h.state.save.mutateAsync(input)).rejects.toMatchObject({ status });
    expect(h.client.getQueryState(['current-session'])?.isInvalidated).toBe(true);
    h.client.clear();
  });
  it.each([401, 403])('TC-510: lỗi GET %s cũng làm mới phiên', async (status) => {
    const h = harness();
    vi.mocked(h.repository.get).mockRejectedValue(new AdminRequestError('ERR_FORBIDDEN', status));
    expect((await h.state.config.refetch()).isError).toBe(true);
    expect(h.client.getQueryState(['current-session'])?.isInvalidated).toBe(true);
    h.client.clear();
  });
});
