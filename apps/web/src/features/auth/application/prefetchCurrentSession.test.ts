import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { prefetchCurrentSession } from './prefetchCurrentSession';

describe('Kiểm tra phiên sớm khi khởi động (NFR-1)', () => {
  it('gọi kiểm tra phiên ngay và lưu kết quả vào cùng khóa mà AuthBoundary đọc', async () => {
    const client = new QueryClient();
    const fetchSession = vi.fn(async () => null);
    await prefetchCurrentSession(client, fetchSession);
    expect(fetchSession).toHaveBeenCalledTimes(1);
    expect(client.getQueryState(['current-session'])?.status).toBe('success');
    expect(client.getQueryData(['current-session'])).toBeNull();
    client.clear();
  });

  it('lỗi mạng không làm hỏng khởi động: AuthBoundary tự hiển thị lỗi và cho thử lại', async () => {
    const client = new QueryClient();
    const fetchSession = vi.fn(async () => {
      throw new Error('mạng lỗi');
    });
    await expect(prefetchCurrentSession(client, fetchSession)).resolves.toBeUndefined();
    expect(fetchSession).toHaveBeenCalledTimes(1);
    client.clear();
  });
});
