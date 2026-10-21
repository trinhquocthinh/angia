import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { usePushSettings } from './usePushSettings';
import type { PushApi } from './ports';
const api: PushApi = {
  config: async () => ({ enabled: true, publicKey: 'key', registered: true }),
  register: async () => undefined,
  remove: async () => undefined,
  sendTest: async () => undefined,
};
describe('Trạng thái thông báo theo phiên', () => {
  it('TC-339: cache phiên cũ không bật nhầm trạng thái đăng ký của phiên mới', () => {
    const client = new QueryClient();
    client.setQueryData(['push-config', 'old'], { enabled: true, publicKey: 'key', registered: true });
    function Probe() {
      const { config } = usePushSettings(api, 'new');
      return <span>{config.isPending ? 'Đang tải' : String(config.data?.registered)}</span>;
    }
    const html = renderToStaticMarkup(
      <QueryClientProvider client={client}>
        <Probe />
      </QueryClientProvider>,
    );
    expect(html).toContain('Đang tải');
    client.clear();
  });
});
