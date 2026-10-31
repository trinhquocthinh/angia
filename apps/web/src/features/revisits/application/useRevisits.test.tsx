import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import { vietnamDate } from '@src/features/visitSummary/application/vietnamDate';
import { useRevisits } from './useRevisits';
const session = {
  account: { id: 'a' },
  family: { id: 'f' },
  role: 'main',
  csrfToken: 'csrf',
} as ProfileSession;
const profile = { id: 'p', familyId: 'f', consentStatus: 'confirmed' } as HealthProfile;
describe('TC-473 — scope và quyền đọc lịch', () => {
  it.each(['confirmed', 'pending', 'withdrawn'] as const)('đồng thuận %s', (consentStatus) => {
    const client = new QueryClient();
    function Probe() {
      useRevisits({ list: vi.fn() }, session, { ...profile, consentStatus });
      return null;
    }
    renderToStaticMarkup(
      <QueryClientProvider client={client}>
        <Probe />
      </QueryClientProvider>,
    );
    const query = client.getQueryCache().find({ queryKey: ['revisits', 'a', 'f', 'p', vietnamDate()] });
    expect((query?.options as { enabled?: boolean }).enabled).toBe(consentStatus === 'confirmed');
    client.clear();
  });
  it('đọc lại thất bại không hiển thị dữ liệu cache cũ', () => {
    const client = new QueryClient();
    const key = ['revisits', 'a', 'f', 'p', vietnamDate()];
    client.setQueryData(key, [{ revisitDate: '2026-11-20', prescriptions: [] }]);
    client
      .getQueryCache()
      .find({ queryKey: key })!
      .setState({ status: 'error', error: new Error('denied') });
    client.setQueryDefaults(['revisits'], { retryOnMount: false });
    let visible: unknown;
    function Probe() {
      visible = useRevisits({ list: vi.fn() }, session, profile).data;
      return null;
    }
    renderToStaticMarkup(
      <QueryClientProvider client={client}>
        <Probe />
      </QueryClientProvider>,
    );
    expect(visible).toBeUndefined();
    client.clear();
  });
});
