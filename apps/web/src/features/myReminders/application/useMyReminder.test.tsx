import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';
import { useMyReminder } from './useMyReminder';

const id = '3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b';
function options(enabled: boolean) {
  const client = new QueryClient();
  const get = vi.fn();
  function Probe() {
    useMyReminder({ get }, id, enabled);
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  const query = client.getQueryCache().find({ queryKey: ['my-reminder', id] });
  client.clear();
  return query?.options as { staleTime?: unknown; retry?: unknown } | undefined;
}

describe('Tải lời nhắc của người nhận', () => {
  it('khóa theo id, luôn đọc lại (staleTime 0)', () => {
    expect(options(true)?.staleTime).toBe(0);
  });
  it('404/403 không thử lại; lỗi máy chủ thử lại tối đa 2 lần', () => {
    const retry = options(true)?.retry as (count: number, error: Error) => boolean;
    expect(retry(0, new MedicationRequestError('Không tìm thấy', 404))).toBe(false);
    expect(retry(0, new MedicationRequestError('Cấm', 403))).toBe(false);
    expect(retry(0, new MedicationRequestError('Lỗi', 500))).toBe(true);
    expect(retry(2, new Error('Mạng'))).toBe(false);
  });
});
