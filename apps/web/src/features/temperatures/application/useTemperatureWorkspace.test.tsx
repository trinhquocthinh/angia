import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import type { TemperatureRepository } from './ports';
import { useTemperatureWorkspace } from './useTemperatureWorkspace';

const session: ProfileSession = {
  account: { id: 'a', displayName: 'An', isSystemAdmin: false, healthProfileId: 'p' },
  family: { id: 'f', name: 'Nhà' },
  role: 'main',
  csrfToken: 'csrf',
};
const request = { celsius: 38.5, measuredAt: '2020-01-01T06:50:00Z', confirmOutOfRange: false };
function setup(readOnly = false, consentConfirmed = true) {
  const record = vi.fn(async () => ({
    id: 'r',
    ...request,
    recordedBy: null,
    recordedAt: request.measuredAt,
  }));
  const repository = { record } as unknown as TemperatureRepository;
  let state: ReturnType<typeof useTemperatureWorkspace> | undefined;
  function Probe() {
    state = useTemperatureWorkspace(repository, session, 'p', readOnly, consentConfirmed);
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      <Probe />
    </QueryClientProvider>,
  );
  return { state: state!, record };
}
describe('Điều khiển khối nhiệt độ', () => {
  it('TC-500: ghi vào đúng hồ sơ bằng CSRF của phiên', async () => {
    const { state, record } = setup();
    expect(await state.record(request)).toBe('saved');
    expect(record).toHaveBeenCalledWith('p', request, 'csrf');
  });
  it('TC-502: tự xem hoặc chưa đồng thuận không ghi dù gọi handler trực tiếp', async () => {
    for (const entry of [setup(true), setup(false, false)]) {
      expect(await entry.state.record(request)).toBe('failed');
      expect(entry.record).not.toHaveBeenCalled();
    }
  });
});
