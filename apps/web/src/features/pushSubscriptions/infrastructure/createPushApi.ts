import { apiClient } from '@src/shared/api/apiClient';
import type { PushApi } from '../application/ports';
function failure(error: unknown): Error {
  const value = error as { error?: { code?: string; message?: string } } | undefined;
  return Object.assign(new Error(value?.error?.message ?? 'Không thể kết nối dịch vụ thông báo.'), {
    code: value?.error?.code,
  });
}
export function createPushApi(): PushApi {
  return {
    async config(signal) {
      const { data, error } = await apiClient.GET('/api/me/push-config', { ...(signal ? { signal } : {}) });
      if (!data) throw failure(error);
      return data;
    },
    async register(value, csrf, intent, signal) {
      if (!value.endpoint || !value.keys?.p256dh || !value.keys.auth)
        throw new Error('Đăng ký thiết bị chưa đủ thông tin.');
      const { error, response } = await apiClient.PUT('/api/me/push-subscription', {
        body: {
          intent,
          endpoint: value.endpoint,
          keys: { p256dh: value.keys.p256dh, auth: value.keys.auth },
        },
        headers: { 'X-CSRF-Token': csrf },
        ...(signal ? { signal } : {}),
      });
      if (!response.ok) throw failure(error);
    },
    async remove(csrf) {
      const { error, response } = await apiClient.DELETE('/api/me/push-subscription', {
        headers: { 'X-CSRF-Token': csrf },
      });
      if (response.status !== 401 && !response.ok) throw failure(error);
    },
    async sendTest(csrf) {
      const { error, response } = await apiClient.POST('/api/me/push-test', {
        headers: { 'X-CSRF-Token': csrf },
      });
      if (!response.ok) throw failure(error);
    },
  };
}
