import type { PushApi } from '../application/ports';
import { getPushRegistration } from './getPushRegistration';
function bytes(key: string): Uint8Array<ArrayBuffer> {
  const value = atob(key.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (key.length % 4)) % 4));
  return Uint8Array.from(value, (char) => char.charCodeAt(0));
}
export async function enableBrowserPush(api: PushApi, publicKey: string, csrf: string): Promise<void> {
  // Phải được gọi ngay từ nút bấm để giữ user gesture trên iPhone.
  const permission = await Notification.requestPermission();
  if (permission !== 'granted')
    throw new Error('Chưa được cấp quyền. Nếu đã chặn, hãy cho phép thông báo trong cài đặt thiết bị.');
  const registration = await getPushRegistration();
  const existing = await registration.pushManager.getSubscription();
  const sub =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: bytes(publicKey),
    }));
  try {
    await api.register(sub.toJSON(), csrf);
  } catch (error) {
    if ((error as { code?: string }).code === 'ERR_PUSH_CONFLICT') await sub.unsubscribe();
    throw error;
  }
}
