import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { vietnamDate } from '@src/features/visitSummary/application/vietnamDate';
import { selfProfileKey } from '@src/features/selfProfile/application/selfProfileKey';
import { TemperatureWorkspace } from './TemperatureWorkspace';

const session: ProfileSession = {
  account: { id: 'a', displayName: 'An', isSystemAdmin: false, healthProfileId: 'p' },
  family: { id: 'f', name: 'Nhà' },
  role: 'main',
  csrfToken: 'csrf',
  features: { redactionSuggestions: false },
};
function render(readOnly = false, consentConfirmed = true) {
  const client = new QueryClient();
  const today = vietnamDate();
  const prefix = readOnly ? [...selfProfileKey(session), 'temperatures'] : ['temperatures', 'a', 'f', 'p'];
  client.setQueryData([...prefix, today, today], { readings: [] });
  return renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <TemperatureWorkspace
        session={session}
        profileId="p"
        readOnly={readOnly}
        consentConfirmed={consentConfirmed}
      />
    </QueryClientProvider>,
  );
}
describe('Khối nhiệt độ dùng chung main/self', () => {
  it('TC-502: main có ghi nhiệt độ, trạng thái rỗng và bộ lọc ngày', () => {
    const html = render();
    expect(html).toContain('Ghi nhiệt độ');
    expect(html).toContain('Đang tải nhiệt độ…');
    expect(html).toContain('Xem nhiệt độ theo ngày');
  });
  it('TC-502: tự xem không có hành động ghi; mất đồng thuận không lộ dữ liệu', () => {
    expect(render(true)).not.toContain('Ghi nhiệt độ');
    expect(render(false, false)).not.toContain('Ghi nhiệt độ');
    expect(render(false, false)).toContain('Hồ sơ chưa được đồng ý lưu dữ liệu.');
  });
});
