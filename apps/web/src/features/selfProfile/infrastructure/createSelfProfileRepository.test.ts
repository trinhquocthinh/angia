import { describe, expect, it, vi } from 'vitest';
import { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';
import type { apiClient } from '@src/shared/api/apiClient';
import { createSelfProfileRepository } from './createSelfProfileRepository';

const summary = {
  id: '00000000-0000-4000-8000-000000000001',
  displayName: 'Mẹ',
  birthYear: 1950,
  consentStatus: 'confirmed',
  showsVitals: true,
};
function clientWith(result: { data?: unknown; error?: unknown; status?: number }) {
  const GET = vi.fn(async () => ({
    data: result.data,
    error: result.error,
    response: new Response(null, { status: result.status ?? 200 }),
  }));
  return { GET, client: { GET } as unknown as typeof apiClient };
}

describe('SPEC-042 — repository "Hồ sơ của tôi"', () => {
  it('đọc hồ sơ từ phiên qua route tự xem, không gửi id hồ sơ và không dùng bộ nhớ đệm', async () => {
    const { GET, client } = clientWith({ data: summary });
    await expect(createSelfProfileRepository(client).profile()).resolves.toEqual(summary);
    expect(GET).toHaveBeenCalledWith('/api/me/profile', expect.objectContaining({ cache: 'no-store' }));
  });
  it('dòng thời gian gửi cursor khi xem thêm', async () => {
    const { GET, client } = clientWith({ data: { items: [], nextCursor: null } });
    await createSelfProfileRepository(client).timeline('next');
    expect(GET).toHaveBeenCalledWith(
      '/api/me/profile/timeline',
      expect.objectContaining({ params: { query: { limit: 50, cursor: 'next' } } }),
    );
  });
  it('chuỗi số đo gửi đúng loại, khoảng ngày và đơn vị hiển thị', async () => {
    const { GET, client } = clientWith({ data: { points: [], weeks: [], periods: [] } });
    await createSelfProfileRepository(client)
      .measurementSeries('glucose', { from: '2026-08-01', to: '2026-10-30' })
      .catch(() => undefined);
    expect(GET).toHaveBeenCalledWith(
      '/api/me/profile/measurements/series',
      expect.objectContaining({
        params: {
          query: { kind: 'glucose', from: '2026-08-01', to: '2026-10-30', displayGlucoseUnit: 'mmol/L' },
        },
      }),
    );
  });
  it('giữ mã trạng thái để giao diện làm mới quyền khi 409', async () => {
    const error = { error: { code: 'ERR_CONSENT_REQUIRED', message: 'Hồ sơ chưa đồng thuận.' } };
    const { client } = clientWith({ error, status: 409 });
    const read = createSelfProfileRepository(client).revisits();
    await expect(read).rejects.toBeInstanceOf(MedicationRequestError);
    await expect(read).rejects.toMatchObject({ status: 409, code: 'ERR_CONSENT_REQUIRED' });
  });
});
